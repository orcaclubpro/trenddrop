import axios from 'axios';
import { OpenAI } from 'openai';
import { parse as parseHTML } from 'node-html-parser';
import { JSDOM } from 'jsdom';
import { Product, InsertProduct, InsertTrend, InsertRegion, InsertVideo } from '@shared/schema.js';
import { log } from '../vite.js';
import WebSocket from 'ws';
import { eq, sql } from 'drizzle-orm';
import * as schema from '@shared/schema.js';
import { TrendService } from './trend-service.js';
import { AgentService } from './agent-service.js';
import databaseService from './database-service.js';

// Constants for AI service configuration
const MAX_PRODUCTS = 1000; // Maximum number of products to scrape
const BATCH_SIZE = 10; // Number of products to scrape in each batch
const RETRY_ATTEMPTS = 3; // Number of retries for failed requests

// LLM API endpoints
interface LLMEndpoint {
  url: string;
  headers?: Record<string, string>;
  model?: string;
}

// AI Agent for product discovery and trend analysis
export class AIAgentService {
  private static instance: AIAgentService;
  private isRunning = false;
  private agentService: AgentService;
  private trendService: TrendService;
  private openaiClient: OpenAI | null = null;
  private lmStudioEndpoint: LLMEndpoint | null = null;
  private grokEndpoint: LLMEndpoint | null = null;
  private productsFound = 0;
  private scraperStatus: {
    status: 'idle' | 'running' | 'error' | 'completed';
    message: string;
    progress: number;
    error?: string;
    lastRun?: Date;
    productsFound?: number;
  };

  private constructor() {
    this.agentService = AgentService.getInstance();
    this.trendService = new TrendService(null as any); // Will be set properly when initialized
    this.scraperStatus = {
      status: 'idle',
      message: 'AI Agent is idle',
      progress: 0
    };
  }

  public static getInstance(): AIAgentService {
    if (!AIAgentService.instance) {
      AIAgentService.instance = new AIAgentService();
    }
    return AIAgentService.instance;
  }

  // Initialize the AI Agent with necessary API keys and configurations
  public async initialize(): Promise<boolean> {
    try {
      log('Initializing AI Agent Service', 'ai-agent');

      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openaiClient = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        log('OpenAI client initialized', 'ai-agent');
      }

      // Initialize LM Studio endpoint
      if (process.env.LMSTUDIO_API_URL) {
        this.lmStudioEndpoint = {
          url: process.env.LMSTUDIO_API_URL,
          model: process.env.LMSTUDIO_MODEL || 'default'
        };
        log('LM Studio endpoint configured', 'ai-agent');
      } else {
        // Default local endpoint for LM Studio
        this.lmStudioEndpoint = {
          url: 'http://localhost:1234/v1/chat/completions',
          model: 'local-model'
        };
        log('Using default local LM Studio endpoint', 'ai-agent');
      }

      // Initialize Grok endpoint if available
      if (process.env.GROK_API_URL && process.env.GROK_API_KEY) {
        this.grokEndpoint = {
          url: process.env.GROK_API_URL,
          headers: {
            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
          },
          model: process.env.GROK_MODEL || 'grok-1'
        };
        log('Grok endpoint configured', 'ai-agent');
      }

      // Broadcast initialization status
      this.broadcastStatus('initialized', {
        message: 'AI Agent Service initialized',
        openai: !!this.openaiClient,
        lmstudio: !!this.lmStudioEndpoint,
        grok: !!this.grokEndpoint
      });

      return true;
    } catch (error) {
      log(`Error initializing AI Agent: ${error}`, 'ai-agent');
      this.broadcastStatus('error', {
        message: 'Error initializing AI Agent',
        error: String(error)
      });
      return false;
    }
  }

  // Start the AI Agent scraping process
  public async start(): Promise<void> {
    if (this.isRunning) {
      log('AI Agent is already running', 'ai-agent');
      return;
    }

    try {
      this.isRunning = true;
      this.productsFound = 0;
      this.scraperStatus = {
        status: 'running',
        message: 'Starting AI Agent Service',
        progress: 5,
        productsFound: 0
      };

      // Broadcast start status
      this.broadcastStatus('running', {
        message: 'Starting AI Agent Service',
        progress: 5
      });

      // Check database connection
      if (!databaseService.isInitialized()) {
        log('Database not initialized, initializing...', 'ai-agent');
        
        this.scraperStatus = {
          status: 'running',
          message: 'Connecting to database',
          progress: 10,
          productsFound: 0
        };
        
        this.broadcastStatus('initializing', {
          message: 'Connecting to database'
        });
        
        const success = await databaseService.initialize();
        if (!success) {
          throw new Error('Failed to initialize database');
        }
      }

      // Run the main scraping process
      await this.runScrapingTask();

    } catch (error) {
      log(`Error in AI Agent: ${error}`, 'ai-agent');
      this.scraperStatus = {
        status: 'error',
        message: 'Error in AI Agent Service',
        progress: 0,
        error: String(error),
        productsFound: this.productsFound
      };
      
      this.broadcastStatus('error', {
        message: 'Error in AI Agent Service',
        error: String(error),
        productsFound: this.productsFound
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Stop the AI Agent
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    log('Stopping AI Agent Service', 'ai-agent');
    this.isRunning = false;
    this.scraperStatus = {
      status: 'idle',
      message: 'AI Agent Service stopped',
      progress: 0,
      lastRun: new Date(),
      productsFound: this.productsFound
    };

    // Broadcast stopped status
    this.broadcastStatus('stopped', {
      message: 'AI Agent Service has been stopped',
      productsFound: this.productsFound
    });
  }

  // Get current status of the AI Agent
  public getStatus(): any {
    return {
      ...this.scraperStatus,
      isRunning: this.isRunning,
      openai: !!this.openaiClient,
      lmstudio: !!this.lmStudioEndpoint,
      grok: !!this.grokEndpoint,
      productsFound: this.productsFound
    };
  }

  // Main scraping task
  private async runScrapingTask(): Promise<void> {
    try {
      log('Running AI product discovery task', 'ai-agent');
      
      // Check current product count
      const db = databaseService.getDb();
      const productCountResult = await db.select({ count: sql`count(*)` }).from(schema.products);
      const currentProductCount = parseInt(productCountResult[0].count.toString());
      
      log(`Current product count: ${currentProductCount}`, 'ai-agent');
      
      // Calculate how many more products we need to reach MAX_PRODUCTS
      const productsNeeded = Math.max(0, MAX_PRODUCTS - currentProductCount);
      
      if (productsNeeded <= 0) {
        log('Already reached maximum product count, nothing to do', 'ai-agent');
        this.scraperStatus = {
          status: 'completed',
          message: 'Already reached maximum product count',
          progress: 100,
          lastRun: new Date(),
          productsFound: 0
        };
        
        this.broadcastStatus('completed', {
          message: 'Already reached maximum product count',
          progress: 100,
          productsFound: 0
        });
        
        return;
      }
      
      log(`Need to discover ${productsNeeded} more products`, 'ai-agent');
      this.scraperStatus = {
        status: 'running',
        message: `Starting product discovery for ${productsNeeded} products`,
        progress: 15,
        productsFound: 0
      };
      
      this.broadcastStatus('running', {
        message: `Starting product discovery for ${productsNeeded} products`,
        progress: 15
      });
      
      // Get trending product categories
      const categories = await this.discoverTrendingCategories();
      log(`Discovered ${categories.length} trending categories`, 'ai-agent');
      
      // Process each category in batches
      let totalProcessed = 0;
      
      for (let i = 0; i < categories.length && totalProcessed < productsNeeded; i++) {
        const category = categories[i];
        log(`Processing category ${i+1}/${categories.length}: ${category}`, 'ai-agent');
        
        // Update status
        const categoryProgress = 15 + Math.floor((i / categories.length) * 40);
        this.scraperStatus = {
          status: 'running',
          message: `Discovering products in category: ${category}`,
          progress: categoryProgress,
          productsFound: this.productsFound
        };
        
        this.broadcastStatus('running', {
          message: `Discovering products in category: ${category}`,
          progress: categoryProgress,
          productsFound: this.productsFound
        });
        
        // Process this category until we have enough products or move to next category
        const productsInBatch = Math.min(BATCH_SIZE, productsNeeded - totalProcessed);
        const discoveredProducts = await this.discoverProductsInCategory(category, productsInBatch);
        
        // Process each discovered product
        for (const productData of discoveredProducts) {
          if (!this.isRunning) {
            throw new Error('AI Agent was stopped during execution');
          }
          
          try {
            // Insert product into database
            const product = await this.insertProduct(productData);
            
            if (product) {
              this.productsFound++;
              totalProcessed++;
              
              // Generate and insert additional data (trends, regions, videos)
              await this.generateProductData(product.id, product.name);
              
              // Update status
              const progress = 15 + Math.floor((totalProcessed / productsNeeded) * 80);
              this.scraperStatus = {
                status: 'running',
                message: `Processing product: ${product.name} (${totalProcessed}/${productsNeeded})`,
                progress,
                productsFound: this.productsFound
              };
              
              this.broadcastStatus('running', {
                message: `Processing product: ${product.name} (${totalProcessed}/${productsNeeded})`,
                progress,
                productsFound: this.productsFound
              });
            }
            
            // Check if we've reached our target
            if (totalProcessed >= productsNeeded) {
              break;
            }
          } catch (error) {
            log(`Error processing product: ${error}`, 'ai-agent');
            // Continue with next product
          }
        }
      }
      
      // Task completed
      this.scraperStatus = {
        status: 'completed',
        message: `Product discovery completed. Found ${this.productsFound} new products.`,
        progress: 100,
        lastRun: new Date(),
        productsFound: this.productsFound
      };
      
      this.broadcastStatus('completed', {
        message: `Product discovery completed. Found ${this.productsFound} new products.`,
        progress: 100,
        productsFound: this.productsFound
      });
      
      log(`AI Agent task completed. Found ${this.productsFound} new products.`, 'ai-agent');
    } catch (error) {
      log(`Error in AI Agent scraping task: ${error}`, 'ai-agent');
      this.scraperStatus = {
        status: 'error',
        message: 'Error in product discovery task',
        progress: 0,
        error: String(error),
        lastRun: new Date(),
        productsFound: this.productsFound
      };
      
      this.broadcastStatus('error', {
        message: 'Error in product discovery task',
        error: String(error),
        productsFound: this.productsFound
      });
    } finally {
      this.isRunning = false;
    }
  }

  // Helper methods for the AI scraping process
  private async discoverTrendingCategories(): Promise<string[]> {
    try {
      const prompt = `
        You are an AI assistant helping with market research for dropshipping products.
        Please identify the top 10 trending product categories for dropshipping right now.
        For each category, provide just the name of the category with no additional information.
        Return the results as a JSON array of strings.
      `;

      const result = await this.sendPromptToLLM(prompt);
      
      // Parse the response to extract the array of categories
      let categories: string[] = [];
      try {
        // Try to extract JSON array from the response
        const match = result.match(/\[.*\]/s);
        if (match) {
          categories = JSON.parse(match[0]);
        } else {
          // If not in JSON format, try to extract lines as categories
          categories = result.split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('{') && !line.startsWith('}') && !line.startsWith('[') && !line.startsWith(']'))
            .map(line => {
              // Remove any numbering or special characters
              return line.replace(/^\d+[\.\)]\s*/, '').replace(/["']+/g, '');
            });
        }
      } catch (parseError) {
        log(`Error parsing categories from LLM response: ${parseError}`, 'ai-agent');
        // Fallback to default categories if parsing fails
        categories = [
          "Tech Gadgets", "Home Decor", "Beauty & Skincare", "Fitness Equipment", 
          "Kitchen Accessories", "Pet Supplies", "Fashion Accessories", "Sustainable Products",
          "Smart Home Devices", "Outdoor & Camping"
        ];
      }
      
      return categories.slice(0, 10); // Ensure we only use top 10
    } catch (error) {
      log(`Error discovering trending categories: ${error}`, 'ai-agent');
      // Return default categories in case of error
      return [
        "Tech Gadgets", "Home Decor", "Beauty & Skincare", "Fitness Equipment", 
        "Kitchen Accessories", "Pet Supplies", "Fashion Accessories", "Sustainable Products",
        "Smart Home Devices", "Outdoor & Camping"
      ];
    }
  }

  private async discoverProductsInCategory(category: string, count: number): Promise<InsertProduct[]> {
    try {
      const prompt = `
        You are an AI assistant helping with product research for dropshipping.
        I need to find ${count} trending products in the category "${category}" that would be good for a dropshipping business.
        
        For each product:
        1. Provide a specific product name (not generic)
        2. Include a subcategory within ${category}
        3. Write a detailed description (2-3 sentences)
        4. Estimate a realistic wholesale price range (low-high in USD)
        5. Estimate a trend score (70-100, higher for more trending products)
        6. Estimate engagement rate (1-100)
        7. Estimate sales velocity (1-50)
        8. Estimate search volume (1-50)
        9. Estimate geographic spread (1-10)
        10. Provide a fictional but realistic AliExpress supplier URL (e.g., https://www.aliexpress.com/item/1005005832171466.html)
        11. Provide a fictional but realistic CJ Dropshipping URL (e.g., https://cjdropshipping.com/product/example-product-12345.html)
        12. Provide a realistic product image URL (ensure it's a valid URL)
        13. Specify the source platform where the product is trending (e.g., TikTok, Instagram, Facebook)
        
        Please format your response as a valid JSON array with these fields for each product:
        name, category, subcategory, description, priceRangeLow, priceRangeHigh, trendScore, engagementRate, salesVelocity, searchVolume, geographicSpread, aliexpressUrl, cjdropshippingUrl, imageUrl, sourcePlatform.
        
        Each field should have the appropriate data type (strings for text, numbers for numeric values).
      `;

      const result = await this.sendPromptToLLM(prompt);
      
      // Parse the response to extract the product data
      let products: InsertProduct[] = [];
      try {
        // Try to extract JSON array from the response
        const match = result.match(/\[.*\]/s);
        if (match) {
          const parsedProducts = JSON.parse(match[0]);
          
          // Validate and transform each product
          products = parsedProducts.map((p: any) => ({
            name: p.name || `${category} Product ${Math.random().toString(36).substring(2, 7)}`,
            category: p.category || category,
            subcategory: p.subcategory || '',
            description: p.description || `A trending product in the ${category} category.`,
            priceRangeLow: typeof p.priceRangeLow === 'number' ? p.priceRangeLow : parseFloat(p.priceRangeLow) || 10,
            priceRangeHigh: typeof p.priceRangeHigh === 'number' ? p.priceRangeHigh : parseFloat(p.priceRangeHigh) || 50,
            trendScore: typeof p.trendScore === 'number' ? p.trendScore : parseInt(p.trendScore) || 70,
            engagementRate: typeof p.engagementRate === 'number' ? p.engagementRate : parseInt(p.engagementRate) || 50,
            salesVelocity: typeof p.salesVelocity === 'number' ? p.salesVelocity : parseInt(p.salesVelocity) || 20,
            searchVolume: typeof p.searchVolume === 'number' ? p.searchVolume : parseInt(p.searchVolume) || 15,
            geographicSpread: typeof p.geographicSpread === 'number' ? p.geographicSpread : parseInt(p.geographicSpread) || 5,
            aliexpressUrl: p.aliexpressUrl || `https://www.aliexpress.com/item/${Math.floor(1000000000 + Math.random() * 9000000000)}.html`,
            cjdropshippingUrl: p.cjdropshippingUrl || `https://cjdropshipping.com/product/${category.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(10000 + Math.random() * 90000)}.html`,
            imageUrl: p.imageUrl || `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/500/500`,
            sourcePlatform: p.sourcePlatform || ['TikTok', 'Instagram', 'Facebook', 'Pinterest', 'YouTube'][Math.floor(Math.random() * 5)]
          }));
        } else {
          throw new Error('Could not extract valid JSON from LLM response');
        }
      } catch (parseError) {
        log(`Error parsing products from LLM response: ${parseError}`, 'ai-agent');
        throw parseError;
      }
      
      return products.slice(0, count); // Ensure we only return the requested count
    } catch (error) {
      log(`Error discovering products in category ${category}: ${error}`, 'ai-agent');
      throw error;
    }
  }

  private async insertProduct(productData: InsertProduct): Promise<Product | null> {
    try {
      const db = databaseService.getDb();
      
      // Check if product with same name already exists
      const existingProduct = await db.select()
        .from(schema.products)
        .where(eq(schema.products.name, productData.name))
        .limit(1);
      
      if (existingProduct.length > 0) {
        log(`Product "${productData.name}" already exists, skipping`, 'ai-agent');
        return null;
      }
      
      // Insert new product
      const result = await db.insert(schema.products).values(productData).returning();
      
      if (result.length > 0) {
        log(`Inserted new product: ${productData.name}`, 'ai-agent');
        return result[0];
      }
      
      return null;
    } catch (error) {
      log(`Error inserting product ${productData.name}: ${error}`, 'ai-agent');
      throw error;
    }
  }

  private async generateProductData(productId: number, productName: string): Promise<void> {
    try {
      const db = databaseService.getDb();
      
      // Generate trend data
      const trends = await this.generateTrends(productId, productName);
      for (const trend of trends) {
        await db.insert(schema.trends).values(trend).onConflictDoNothing();
      }
      
      // Generate region data
      const regions = await this.generateRegions(productId, productName);
      for (const region of regions) {
        await db.insert(schema.regions).values(region).onConflictDoNothing();
      }
      
      // Generate videos
      const videos = await this.generateVideos(productId, productName);
      for (const video of videos) {
        await db.insert(schema.videos).values(video).onConflictDoNothing();
      }
      
      // Broadcast update
      this.broadcastUpdate(productId);
    } catch (error) {
      log(`Error generating data for product ${productName}: ${error}`, 'ai-agent');
      throw error;
    }
  }

  private async generateTrends(productId: number, productName: string): Promise<InsertTrend[]> {
    const trends: InsertTrend[] = [];
    const today = new Date();
    
    // Generate 30 days of trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate random trend values with an upward trend for newer entries
      const trendFactor = 1 + ((30 - i) / 30); // Increasing factor for more recent dates
      const randomFactor = 0.7 + (Math.random() * 0.6); // Random variance between 0.7 and 1.3
      
      const baseEngagement = Math.floor(20 * trendFactor * randomFactor);
      const baseSales = Math.floor(10 * trendFactor * randomFactor);
      const baseSearch = Math.floor(15 * trendFactor * randomFactor);
      
      trends.push({
        productId,
        date,
        engagementValue: baseEngagement,
        salesValue: baseSales,
        searchValue: baseSearch
      });
    }
    
    return trends;
  }

  private async generateRegions(productId: number, productName: string): Promise<InsertRegion[]> {
    try {
      const prompt = `
        You are an AI assistant helping with market research for dropshipping products.
        For a product called "${productName}", suggest 5-8 countries or regions where this product might be popular.
        For each region, provide a percentage that represents its share of the global interest (all percentages should add up to 100%).
        
        Please format your response as a valid JSON array with these fields for each region:
        country (string), percentage (number).
      `;

      const result = await this.sendPromptToLLM(prompt, true);
      
      // Parse the response to extract the regions
      let regions: InsertRegion[] = [];
      try {
        // Try to extract JSON array from the response
        const match = result.match(/\[.*\]/s);
        if (match) {
          const parsedRegions = JSON.parse(match[0]);
          
          // Validate and transform each region
          regions = parsedRegions.map((r: any) => ({
            productId,
            country: r.country || 'Unknown Region',
            percentage: typeof r.percentage === 'number' ? r.percentage : parseInt(r.percentage) || 10
          }));
          
          // Ensure percentages add up to 100%
          const totalPercentage = regions.reduce((sum, r) => sum + r.percentage, 0);
          if (totalPercentage !== 100) {
            // Normalize percentages
            regions = regions.map(r => ({
              ...r,
              percentage: Math.round((r.percentage / totalPercentage) * 100)
            }));
          }
        } else {
          throw new Error('Could not extract valid JSON from LLM response');
        }
      } catch (parseError) {
        log(`Error parsing regions from LLM response: ${parseError}`, 'ai-agent');
        // Fallback to default regions
        regions = [
          { productId, country: 'United States', percentage: 35 },
          { productId, country: 'United Kingdom', percentage: 20 },
          { productId, country: 'Canada', percentage: 15 },
          { productId, country: 'Australia', percentage: 10 },
          { productId, country: 'Germany', percentage: 10 },
          { productId, country: 'France', percentage: 5 },
          { productId, country: 'Other', percentage: 5 }
        ];
      }
      
      return regions;
    } catch (error) {
      log(`Error generating regions for product ${productName}: ${error}`, 'ai-agent');
      // Return default regions in case of error
      return [
        { productId, country: 'United States', percentage: 35 },
        { productId, country: 'United Kingdom', percentage: 20 },
        { productId, country: 'Canada', percentage: 15 },
        { productId, country: 'Australia', percentage: 10 },
        { productId, country: 'Germany', percentage: 10 },
        { productId, country: 'France', percentage: 5 },
        { productId, country: 'Other', percentage: 5 }
      ];
    }
  }

  private async generateVideos(productId: number, productName: string): Promise<InsertVideo[]> {
    try {
      const prompt = `
        You are an AI assistant helping with market research for dropshipping products.
        For a product called "${productName}", generate 3-5 fictional but realistic marketing videos that might exist on social media platforms.
        
        For each video, provide:
        1. A catchy and realistic title
        2. The platform (TikTok, Instagram, YouTube, etc.)
        3. The number of views (realistic numbers)
        4. An upload date (within the last 2 months)
        5. A URL for a thumbnail image (use placeholder images like https://picsum.photos/id/XXX/300/200)
        6. A URL for the video (use fictional but realistic URLs for the specified platform)
        
        Please format your response as a valid JSON array with these fields for each video:
        title, platform, views, uploadDate, thumbnailUrl, videoUrl.
      `;

      const result = await this.sendPromptToLLM(prompt, true);
      
      // Parse the response to extract the videos
      let videos: InsertVideo[] = [];
      try {
        // Try to extract JSON array from the response
        const match = result.match(/\[.*\]/s);
        if (match) {
          const parsedVideos = JSON.parse(match[0]);
          
          // Get current date for calculating relative dates
          const now = new Date();
          
          // Validate and transform each video
          videos = parsedVideos.map((v: any) => {
            // Parse upload date or generate a random recent date
            let uploadDate: Date;
            try {
              uploadDate = new Date(v.uploadDate);
              // Ensure date is within last 2 months
              const twoMonthsAgo = new Date();
              twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
              if (uploadDate < twoMonthsAgo || uploadDate > now) {
                // If date is invalid or outside range, generate random recent date
                uploadDate = new Date(now);
                uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 60));
              }
            } catch (e) {
              // If date parsing fails, generate random recent date
              uploadDate = new Date(now);
              uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 60));
            }
            
            return {
              productId,
              title: v.title || `Amazing ${productName} Review`,
              platform: v.platform || ['TikTok', 'Instagram', 'YouTube'][Math.floor(Math.random() * 3)],
              views: typeof v.views === 'number' ? v.views : parseInt(v.views) || Math.floor(10000 + Math.random() * 990000),
              uploadDate: uploadDate,
              thumbnailUrl: v.thumbnailUrl || `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
              videoUrl: v.videoUrl || this.generateVideoUrl(v.platform || 'TikTok', productName)
            };
          });
        } else {
          throw new Error('Could not extract valid JSON from LLM response');
        }
      } catch (parseError) {
        log(`Error parsing videos from LLM response: ${parseError}`, 'ai-agent');
        // Fallback to default videos
        videos = this.generateDefaultVideos(productId, productName);
      }
      
      return videos;
    } catch (error) {
      log(`Error generating videos for product ${productName}: ${error}`, 'ai-agent');
      // Return default videos in case of error
      return this.generateDefaultVideos(productId, productName);
    }
  }

  private generateDefaultVideos(productId: number, productName: string): InsertVideo[] {
    const videos: InsertVideo[] = [];
    const now = new Date();
    const platforms = ['TikTok', 'Instagram', 'YouTube'];
    
    // Generate 3-5 default videos
    const videoCount = 3 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < videoCount; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const daysAgo = Math.floor(Math.random() * 60);
      const uploadDate = new Date(now);
      uploadDate.setDate(uploadDate.getDate() - daysAgo);
      
      const views = Math.floor(10000 + Math.random() * 990000);
      
      videos.push({
        productId,
        title: this.generateVideoTitle(productName, platform),
        platform,
        views,
        uploadDate,
        thumbnailUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 1000)}/300/200`,
        videoUrl: this.generateVideoUrl(platform, productName)
      });
    }
    
    return videos;
  }

  private generateVideoTitle(productName: string, platform: string): string {
    const titles = [
      `I can't believe this ${productName} changed my life!`,
      `Honest review: ${productName} after 30 days`,
      `${productName} - Is it worth the hype?`,
      `Unboxing the viral ${productName}`,
      `${productName} hack that nobody talks about`,
      `How to use the ${productName} (COMPLETE GUIDE)`,
      `${productName} vs Competition - Which is better?`,
      `The truth about ${productName} that influencers won't tell you`,
      `${productName} - Before you buy WATCH THIS!`,
      `My honest opinion on the trending ${productName}`
    ];
    
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private generateVideoUrl(platform: string, productName: string): string {
    const slug = productName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    switch (platform.toLowerCase()) {
      case 'tiktok':
        return `https://www.tiktok.com/@trendsetter/video/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      case 'instagram':
        return `https://www.instagram.com/p/${this.generateRandomId(11)}/`;
      case 'youtube':
        return `https://www.youtube.com/watch?v=${this.generateRandomId(11)}`;
      default:
        return `https://www.tiktok.com/@trendsetter/video/${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    }
  }

  // Helper method to generate random IDs for videos
  private generateRandomId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Send a prompt to the available LLM (LM Studio, Grok, or OpenAI)
  private async sendPromptToLLM(prompt: string, useSmaller = false): Promise<string> {
    // Try LM Studio first (local model)
    if (this.lmStudioEndpoint) {
      try {
        return await this.sendPromptToLMStudio(prompt, useSmaller);
      } catch (error) {
        log(`LM Studio request failed: ${error}. Trying next option...`, 'ai-agent');
      }
    }
    
    // Try Grok if available
    if (this.grokEndpoint) {
      try {
        return await this.sendPromptToGrok(prompt, useSmaller);
      } catch (error) {
        log(`Grok request failed: ${error}. Trying next option...`, 'ai-agent');
      }
    }
    
    // Fall back to OpenAI if available
    if (this.openaiClient) {
      try {
        return await this.sendPromptToOpenAI(prompt, useSmaller);
      } catch (error) {
        log(`OpenAI request failed: ${error}`, 'ai-agent');
        throw error; // Re-throw as we have no more fallbacks
      }
    }
    
    throw new Error('No LLM endpoints available for querying');
  }

  // Send a prompt to LM Studio
  private async sendPromptToLMStudio(prompt: string, useSmaller = false): Promise<string> {
    try {
      log('Sending prompt to LM Studio', 'ai-agent');
      
      const response = await axios.post(
        this.lmStudioEndpoint!.url,
        {
          model: this.lmStudioEndpoint!.model || 'local-model',
          messages: [
            { role: 'system', content: 'You are a helpful assistant for dropshipping market research.' },
            { role: 'user', content: prompt }
          ],
          temperature: useSmaller ? 0.3 : 0.7,
          max_tokens: useSmaller ? 800 : 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.lmStudioEndpoint!.headers || {})
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      log(`Error sending prompt to LM Studio: ${error}`, 'ai-agent');
      throw error;
    }
  }

  // Send a prompt to Grok
  private async sendPromptToGrok(prompt: string, useSmaller = false): Promise<string> {
    try {
      log('Sending prompt to Grok', 'ai-agent');
      
      const response = await axios.post(
        this.grokEndpoint!.url,
        {
          model: this.grokEndpoint!.model || 'grok-1',
          messages: [
            { role: 'system', content: 'You are a helpful assistant for dropshipping market research.' },
            { role: 'user', content: prompt }
          ],
          temperature: useSmaller ? 0.3 : 0.7,
          max_tokens: useSmaller ? 800 : 2000
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(this.grokEndpoint!.headers || {})
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      log(`Error sending prompt to Grok: ${error}`, 'ai-agent');
      throw error;
    }
  }

  // Send a prompt to OpenAI
  private async sendPromptToOpenAI(prompt: string, useSmaller = false): Promise<string> {
    try {
      log('Sending prompt to OpenAI', 'ai-agent');
      
      const response = await this.openaiClient!.chat.completions.create({
        model: useSmaller ? 'gpt-3.5-turbo' : 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for dropshipping market research.' },
          { role: 'user', content: prompt }
        ],
        temperature: useSmaller ? 0.3 : 0.7,
        max_tokens: useSmaller ? 800 : 2000
      });
      
      return response.choices[0].message.content || '';
    } catch (error) {
      log(`Error sending prompt to OpenAI: ${error}`, 'ai-agent');
      throw error;
    }
  }

  // Broadcast a status update to WebSocket clients
  private broadcastStatus(status: string, data: any = {}): void {
    const wsClients = (global as any).wsClients as Set<WebSocket> | undefined;
    
    if (!wsClients || wsClients.size === 0) {
      return; // No connected clients
    }
    
    const statusMessage = {
      type: 'ai_agent_status',
      status,
      timestamp: new Date().toISOString(),
      ...data
    };
    
    const messageString = JSON.stringify(statusMessage);
    
    // Broadcast to all connected clients
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }

  // Broadcast product update to WebSocket clients
  private broadcastUpdate(productId: number): void {
    const wsClients = (global as any).wsClients as Set<WebSocket> | undefined;
    
    if (!wsClients || wsClients.size === 0) {
      return; // No connected clients
    }
    
    const updateMessage = {
      type: 'product_update',
      productId,
      timestamp: new Date().toISOString()
    };
    
    const messageString = JSON.stringify(updateMessage);
    
    // Broadcast to all connected clients
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageString);
      }
    });
  }
}

// Singleton instance
const aiAgentService = AIAgentService.getInstance();

// Export functions to interact with the AI Agent Service
export function initializeAIAgent(): Promise<boolean> {
  return aiAgentService.initialize();
}

export function startAIAgent(): Promise<void> {
  return aiAgentService.start();
}

export function stopAIAgent(): void {
  aiAgentService.stop();
}

export function getAIAgentStatus(): any {
  return aiAgentService.getStatus();
}

export default aiAgentService;