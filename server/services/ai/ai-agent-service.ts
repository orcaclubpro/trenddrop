/**
 * AI Agent Service
 * 
 * Main AI agent service that coordinates the scraping, analysis, and data storage.
 */

import WebSocket from 'ws';
import { eq, sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema.js';
import { Product, InsertProduct, InsertTrend, InsertRegion, InsertVideo } from '../../../shared/schema.js';
import { log } from '../../vite.js';
import { DiscoveredProduct, AgentStatus } from './interfaces.js';
import llmService from './llm-service.js';
import webSearchService from './web-search-service.js';
import trendAnalysisService from './trend-analysis-service.js';
import databaseService from '../database-service.js';

// Constants for agent configuration
const MAX_PRODUCTS = 1000; // Maximum number of products to discover
const BATCH_SIZE = 10; // Number of products to process in each batch
const CATEGORIES_TO_SEARCH = 10; // Number of categories to search

export class AIAgentService {
  private static instance: AIAgentService;
  private isRunning = false;
  private productsFound = 0;
  private agentStatus: AgentStatus;

  private constructor() {
    this.agentStatus = {
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

  /**
   * Initialize the AI Agent service
   */
  public async initialize(): Promise<boolean> {
    try {
      log('Initializing AI Agent Service', 'ai-agent');
      
      // Initialize LLM service first
      const llmInitialized = await llmService.initialize();
      if (!llmInitialized) {
        log('LLM service initialization failed', 'ai-agent');
        this.broadcastStatus('error', {
          message: 'Failed to initialize LLM service'
        });
        return false;
      }
      
      log('AI Agent Service initialized successfully', 'ai-agent');
      this.broadcastStatus('initialized', {
        message: 'AI Agent Service initialized successfully',
        llmStatus: llmService.getStatus()
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

  /**
   * Start the AI Agent
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      log('AI Agent is already running', 'ai-agent');
      return;
    }

    try {
      this.isRunning = true;
      this.productsFound = 0;
      this.agentStatus = {
        status: 'running',
        message: 'Starting AI Agent',
        progress: 5,
        productsFound: 0
      };

      // Broadcast initial status
      this.broadcastStatus('running', {
        message: 'Starting AI Agent',
        progress: 5
      });

      // Check database connection
      if (!databaseService.isInitialized()) {
        log('Database not initialized, initializing...', 'ai-agent');
        
        this.agentStatus = {
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

      // Run the main product discovery process
      await this.runDiscoveryProcess();

    } catch (error) {
      log(`Error in AI Agent: ${error}`, 'ai-agent');
      this.agentStatus = {
        status: 'error',
        message: 'Error in AI Agent',
        progress: 0,
        error: String(error),
        productsFound: this.productsFound
      };
      
      this.broadcastStatus('error', {
        message: 'Error in AI Agent',
        error: String(error),
        productsFound: this.productsFound
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Stop the AI Agent
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    log('Stopping AI Agent', 'ai-agent');
    this.isRunning = false;
    this.agentStatus = {
      status: 'idle',
      message: 'AI Agent stopped',
      progress: 0,
      lastRun: new Date(),
      productsFound: this.productsFound
    };

    // Broadcast stop status
    this.broadcastStatus('stopped', {
      message: 'AI Agent has been stopped',
      productsFound: this.productsFound
    });
  }

  /**
   * Get the current status of the AI Agent
   */
  public getStatus(): any {
    return {
      ...this.agentStatus,
      isRunning: this.isRunning,
      llmStatus: llmService.getStatus(),
      productsFound: this.productsFound
    };
  }

  /**
   * Main product discovery process
   */
  private async runDiscoveryProcess(): Promise<void> {
    try {
      log('Running AI product discovery process', 'ai-agent');
      
      // Check current product count
      const db = databaseService.getDb();
      const productCountResult = await db.select({ count: sql`count(*)` }).from(schema.products);
      const currentProductCount = parseInt(productCountResult[0].count.toString());
      
      log(`Current product count: ${currentProductCount}`, 'ai-agent');
      
      // Calculate how many more products we need to reach MAX_PRODUCTS
      const productsNeeded = Math.max(0, MAX_PRODUCTS - currentProductCount);
      
      if (productsNeeded <= 0) {
        log('Already reached maximum product count, nothing to do', 'ai-agent');
        this.agentStatus = {
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
      this.agentStatus = {
        status: 'running',
        message: `Starting product discovery for ${productsNeeded} products`,
        progress: 15,
        productsFound: 0
      };
      
      this.broadcastStatus('running', {
        message: `Starting product discovery for ${productsNeeded} products`,
        progress: 15
      });
      
      // Discover trending categories
      const categories = await this.discoverTrendingCategories();
      log(`Discovered ${categories.length} trending categories`, 'ai-agent');
      
      // Process categories in batches
      let totalProcessed = 0;
      
      for (let i = 0; i < categories.length && totalProcessed < productsNeeded; i++) {
        if (!this.isRunning) {
          log('AI Agent was stopped during execution', 'ai-agent');
          return;
        }
        
        const category = categories[i];
        log(`Processing category ${i+1}/${categories.length}: ${category}`, 'ai-agent');
        
        // Update status
        const categoryProgress = 15 + Math.floor((i / categories.length) * 40);
        this.agentStatus = {
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
        
        // Search for products in this category
        const productsInBatch = Math.min(BATCH_SIZE, productsNeeded - totalProcessed);
        
        try {
          // Search and validate products
          const discoveredProducts = await webSearchService.searchTrendingProducts(category, productsInBatch);
          
          // Process each product
          for (const productData of discoveredProducts) {
            if (!this.isRunning) {
              log('AI Agent was stopped during execution', 'ai-agent');
              return;
            }
            
            try {
              // Insert product into database
              const product = await this.insertProduct(productData);
              
              if (product) {
                this.productsFound++;
                totalProcessed++;
                
                // Generate additional data for the product
                await this.generateProductData(product.id, product.name);
                
                // Update status
                const progress = 15 + Math.floor((totalProcessed / productsNeeded) * 80);
                this.agentStatus = {
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
        } catch (error) {
          log(`Error searching products in category ${category}: ${error}`, 'ai-agent');
          // Continue with next category
        }
      }
      
      // Process completed
      this.agentStatus = {
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
      
      log(`AI Agent discovery process completed. Found ${this.productsFound} new products.`, 'ai-agent');
    } catch (error) {
      log(`Error in AI Agent discovery process: ${error}`, 'ai-agent');
      this.agentStatus = {
        status: 'error',
        message: 'Error in product discovery process',
        progress: 0,
        error: String(error),
        lastRun: new Date(),
        productsFound: this.productsFound
      };
      
      this.broadcastStatus('error', {
        message: 'Error in product discovery process',
        error: String(error),
        productsFound: this.productsFound
      });
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Discover trending product categories
   */
  private async discoverTrendingCategories(): Promise<string[]> {
    try {
      log('Discovering trending product categories', 'ai-agent');
      
      const systemPrompt = `You are an AI assistant helping with market research for dropshipping products.
Please identify the top ${CATEGORIES_TO_SEARCH} trending product categories for dropshipping right now.
Focus on specific niches and categories that are showing high growth potential.`;

      const userPrompt = `Please identify the top ${CATEGORIES_TO_SEARCH} trending product categories for dropshipping in 2025.
For each category, provide just the name of the category with no additional information.
Return the results as a JSON array of strings.

Examples of good specific categories:
- Home Office Gadgets
- Eco-Friendly Kitchenware
- Smart Fitness Equipment
- Pet Tech Accessories
- Sustainable Fashion

Avoid overly broad categories like "Electronics" or "Home Goods".`;

      const jsonSchema = `{
  "categories": ["string"]
}`;

      const response = await llmService.executeTask<{ categories: string[] }>(
        systemPrompt,
        userPrompt,
        jsonSchema
      );
      
      return response.categories.slice(0, CATEGORIES_TO_SEARCH);
    } catch (error) {
      log(`Error discovering trending categories: ${error}`, 'ai-agent');
      
      // Fallback to default categories
      return [
        "Tech Gadgets", "Home Decor", "Beauty & Skincare", "Fitness Equipment", 
        "Kitchen Accessories", "Pet Supplies", "Fashion Accessories", "Sustainable Products",
        "Smart Home Devices", "Outdoor & Camping"
      ];
    }
  }

  /**
   * Insert a product into the database
   */
  private async insertProduct(productData: DiscoveredProduct): Promise<Product | null> {
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
      
      // Prepare product data for insertion
      const insertProduct: InsertProduct = {
        name: productData.name,
        category: productData.category,
        subcategory: productData.subcategory || '',
        description: productData.description,
        priceRangeLow: productData.priceRangeLow,
        priceRangeHigh: productData.priceRangeHigh,
        trendScore: productData.trendScore || 70,
        engagementRate: productData.engagementRate || 50,
        salesVelocity: productData.salesVelocity || 20,
        searchVolume: productData.searchVolume || 15,
        geographicSpread: productData.geographicSpread || 5,
        aliexpressUrl: productData.aliexpressUrl || '',
        cjdropshippingUrl: productData.cjdropshippingUrl || '',
        imageUrl: productData.imageUrl || `https://picsum.photos/seed/${encodeURIComponent(productData.name)}/500/500`,
        sourcePlatform: productData.sourcePlatform || 'TikTok'
      };
      
      // Insert into database
      const result = await db.insert(schema.products).values(insertProduct).returning();
      
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

  /**
   * Generate additional data for a product
   */
  private async generateProductData(productId: number, productName: string): Promise<void> {
    try {
      const db = databaseService.getDb();
      
      // Generate trend data
      const trends = await trendAnalysisService.generateTrendData(productId, productName);
      for (const trend of trends) {
        await db.insert(schema.trends).values(trend).onConflictDoNothing();
      }
      
      // Generate region data
      const regions = await trendAnalysisService.generateGeographicData(productId, productName);
      for (const region of regions) {
        await db.insert(schema.regions).values(region).onConflictDoNothing();
      }
      
      // Generate video data
      const videos = await trendAnalysisService.generateVideoData(productId, productName);
      for (const video of videos) {
        await db.insert(schema.videos).values(video).onConflictDoNothing();
      }
      
      // Broadcast update to clients
      this.broadcastUpdate(productId);
    } catch (error) {
      log(`Error generating data for product ${productName}: ${error}`, 'ai-agent');
      throw error;
    }
  }

  /**
   * Broadcast status updates to WebSocket clients
   */
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

  /**
   * Broadcast product updates to WebSocket clients
   */
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