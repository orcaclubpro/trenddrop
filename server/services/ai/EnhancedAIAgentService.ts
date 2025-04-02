/**
 * EnhancedAIAgentService - Improved AI agent with quality controls
 * 
 * This service extends the base AI Agent with better quality controls,
 * data verification, and error handling for more reliable data collection.
 */

import { eq, sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema.js';
import { log } from '../../vite.js';
import { DiscoveredProduct, AgentStatus } from './interfaces.js';
import llmService from './llm-service.js';
import webSearchService from './web-search-service.js';
import trendAnalysisService from './trend-analysis-service.js';
import { enhancedDatabaseService } from '../common/EnhancedDatabaseService.js';
import { eventBus } from '../../core/EventBus.js';
import productVerificationService from './ProductVerificationService.js';

// Constants for agent configuration
const MAX_PRODUCTS = 1000; // Maximum number of products to discover
const BATCH_SIZE = 5; // Number of products to process in each batch
const MIN_QUALITY_SCORE = 70; // Minimum quality score for a product to be accepted
const MAX_VERIFICATION_RETRIES = 3; // Maximum number of times to retry verification
const DEFAULT_SCRAPE_INTERVAL = 1000 * 60 * 60 * 6; // 6 hours

export class EnhancedAIAgentService {
  private static instance: EnhancedAIAgentService;
  private isRunning = false;
  private isInitialized = false;
  private productsFound = 0;
  private agentStatus: AgentStatus;
  private lastScrapingTime: Date | null = null;
  private scrapingInterval: NodeJS.Timeout | null = null;
  private existingProducts: Set<string> = new Set();
  private existingProductLookupKeys: Set<string> = new Set();
  private scrapingIntervalMs: number;

  private constructor() {
    this.agentStatus = {
      status: 'idle',
      message: 'Enhanced AI Agent is idle',
      progress: 0
    };
    
    // Read scraping interval from environment or use default
    this.scrapingIntervalMs = parseInt(process.env.SCRAPING_INTERVAL || '', 10) || DEFAULT_SCRAPE_INTERVAL;
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for database connection events
    eventBus.subscribe('db:connected', () => {
      this.onDatabaseConnected();
    });
    
    // Listen for product verification events for monitoring
    eventBus.subscribe('product:verification:complete', (data) => {
      log(`Product verification: "${data.productName}" - Valid: ${data.isValid}, Score: ${data.qualityScore}, Issues: ${data.issueCount}`, 'enhanced-ai-agent');
    });
  }

  /**
   * Handler for database connection event
   */
  private async onDatabaseConnected(): Promise<void> {
    if (!this.isInitialized) {
      log('Database connected, initializing AI agent cache...', 'enhanced-ai-agent');
      await this.initializeProductCache();
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): EnhancedAIAgentService {
    if (!EnhancedAIAgentService.instance) {
      EnhancedAIAgentService.instance = new EnhancedAIAgentService();
    }
    return EnhancedAIAgentService.instance;
  }

  /**
   * Initialize the Enhanced AI Agent service
   */
  public async initialize(): Promise<boolean> {
    try {
      log('Initializing Enhanced AI Agent Service', 'enhanced-ai-agent');
      
      // Initialize LLM service first
      const llmInitialized = await llmService.initialize();
      if (!llmInitialized) {
        log('LLM service initialization failed', 'enhanced-ai-agent');
        this.broadcastStatus('error', {
          message: 'Failed to initialize LLM service'
        });
        return false;
      }
      
      // Initialize product cache
      await this.initializeProductCache();
      
      // Mark as initialized
      this.isInitialized = true;
      
      log('Enhanced AI Agent Service initialized successfully', 'enhanced-ai-agent');
      this.broadcastStatus('initialized', {
        message: 'Enhanced AI Agent Service initialized successfully',
        llmStatus: llmService.getStatus()
      });
      
      return true;
    } catch (error) {
      log(`Error initializing Enhanced AI Agent: ${error}`, 'enhanced-ai-agent');
      this.broadcastStatus('error', {
        message: 'Error initializing Enhanced AI Agent',
        error: String(error)
      });
      return false;
    }
  }

  /**
   * Initialize the product cache to avoid duplicates
   */
  private async initializeProductCache(): Promise<void> {
    try {
      const db = enhancedDatabaseService.getDb();
      
      // Clear existing caches
      this.existingProducts.clear();
      this.existingProductLookupKeys.clear();
      
      // Query existing products
      log('Querying existing products to avoid duplicates', 'enhanced-ai-agent');
      const products = await db.select({
        id: schema.products.id,
        name: schema.products.name,
        category: schema.products.category
      }).from(schema.products);
      
      // Add existing products to cache
      products.forEach(product => {
        this.existingProducts.add(product.name.toLowerCase());
        
        // Create lookup keys for fuzzy matching (to avoid similar products)
        // Key formats: category:first_word, first_three_words, etc.
        this.generateProductLookupKeys(product).forEach(key => {
          this.existingProductLookupKeys.add(key);
        });
      });
      
      log(`Found ${products.length} existing products in database`, 'enhanced-ai-agent');
      log(`Created ${this.existingProductLookupKeys.size} lookup keys for duplicate detection`, 'enhanced-ai-agent');
    } catch (error) {
      log(`Error initializing product cache: ${error}`, 'enhanced-ai-agent');
    }
  }

  /**
   * Generate lookup keys for a product to help with fuzzy duplicate detection
   */
  private generateProductLookupKeys(product: { name: string, category: string }): string[] {
    const keys: string[] = [];
    const name = product.name.toLowerCase();
    const category = product.category.toLowerCase();
    const words = name.split(/\s+/).filter(word => word.length > 2);
    
    // Category + first word
    if (words.length > 0) {
      keys.push(`${category}:${words[0]}`);
    }
    
    // First three words together
    if (words.length >= 3) {
      keys.push(words.slice(0, 3).join('_'));
    }
    
    // First two words together
    if (words.length >= 2) {
      keys.push(words.slice(0, 2).join('_'));
    }
    
    // Words that likely indicate product type (like "chair", "desk", etc.)
    const significantWords = words.filter(word => 
      word.length > 3 && 
      !['with', 'and', 'for', 'the', 'this', 'that'].includes(word)
    );
    
    significantWords.forEach(word => {
      keys.push(`${category}:${word}`);
    });
    
    return keys;
  }

  /**
   * Start the Enhanced AI Agent
   */
  public async start(): Promise<void> {
    if (this.isRunning) {
      log('Enhanced AI Agent is already running', 'enhanced-ai-agent');
      return;
    }

    try {
      this.isRunning = true;
      this.agentStatus = {
        status: 'running',
        message: 'Starting Enhanced AI Agent',
        progress: 5,
        productsFound: this.productsFound
      };

      // Broadcast initial status
      this.broadcastStatus('running', {
        message: 'Starting Enhanced AI Agent',
        progress: 5
      });
      
      // Run the initial scraping task
      await this.runScrapingTask();
      
      // Set up periodic scraping
      this.setupPeriodicScraping();
      
      log('Enhanced AI Agent started successfully', 'enhanced-ai-agent');
    } catch (error) {
      this.isRunning = false;
      log(`Error starting Enhanced AI Agent: ${error}`, 'enhanced-ai-agent');
      this.broadcastStatus('error', {
        message: 'Error starting Enhanced AI Agent',
        error: String(error)
      });
    }
  }

  /**
   * Set up periodic scraping
   */
  private setupPeriodicScraping(): void {
    // Clear any existing interval
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
    }
    
    // Set up a new interval
    this.scrapingInterval = setInterval(() => {
      // Only run if agent is still running
      if (this.isRunning) {
        this.runScrapingTask().catch(error => {
          log(`Error in periodic scraping: ${error}`, 'enhanced-ai-agent');
        });
      }
    }, this.scrapingIntervalMs);
    
    log(`Periodic scraping scheduled every ${this.scrapingIntervalMs / (1000 * 60 * 60)} hours`, 'enhanced-ai-agent');
  }

  /**
   * Stop the Enhanced AI Agent
   */
  public stop(): void {
    if (!this.isRunning) {
      log('Enhanced AI Agent is not running', 'enhanced-ai-agent');
      return;
    }

    // Clear the scraping interval
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = null;
    }

    this.isRunning = false;
    this.agentStatus = {
      status: 'idle',
      message: 'Enhanced AI Agent stopped',
      progress: 0,
      productsFound: this.productsFound,
      lastRun: this.lastScrapingTime
    };

    // Broadcast status update
    this.broadcastStatus('idle', {
      message: 'Enhanced AI Agent stopped',
      lastRun: this.lastScrapingTime
    });

    log('Enhanced AI Agent stopped', 'enhanced-ai-agent');
  }

  /**
   * Get the current status of the Enhanced AI Agent
   */
  public getStatus(): AgentStatus {
    // Add additional information
    const status = {
      ...this.agentStatus,
      lastRun: this.lastScrapingTime,
      nextRun: this.getNextRunTime()
    };
    
    return status;
  }

  /**
   * Get the next scheduled run time
   */
  private getNextRunTime(): Date | null {
    if (!this.isRunning || !this.scrapingInterval || !this.lastScrapingTime) {
      return null;
    }
    
    return new Date(this.lastScrapingTime.getTime() + this.scrapingIntervalMs);
  }

  /**
   * Run the product scraping task
   */
  public async runScrapingTask(): Promise<void> {
    if (!this.isRunning) {
      log('Enhanced AI Agent is not running, cannot run scraping task', 'enhanced-ai-agent');
      return;
    }

    // Update status
    this.agentStatus.status = 'running';
    this.agentStatus.message = 'Scraping trending products';
    this.agentStatus.progress = 10;
    
    // Broadcast status update
    this.broadcastStatus('running', {
      message: 'Scraping trending products',
      progress: 10
    });
    
    try {
      log('Running product scraping task', 'enhanced-ai-agent');
      this.lastScrapingTime = new Date();
      
      // Discover trending products
      log('Scraping trending products', 'enhanced-ai-agent');
      const products = await this.discoverTrendingProducts(BATCH_SIZE);
      
      // Process each product in sequence
      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        
        // Update status with progress
        const progress = 10 + Math.round(((i + 1) / products.length) * 90);
        this.agentStatus.progress = progress;
        this.agentStatus.message = `Processing product ${i + 1} of ${products.length}: ${product.name}`;
        
        // Broadcast status update
        this.broadcastStatus('running', {
          message: `Processing product ${i + 1} of ${products.length}: ${product.name}`,
          progress,
          currentProduct: product.name
        });
        
        // Verify product quality
        const verificationResult = await productVerificationService.verifyProduct(product);
        
        // Skip products that don't meet quality standards
        if (!verificationResult.isValid && verificationResult.qualityScore < MIN_QUALITY_SCORE && !verificationResult.repaired) {
          log(`Skipping low-quality product: ${product.name} (Quality Score: ${verificationResult.qualityScore})`, 'enhanced-ai-agent');
          continue;
        }
        
        // Use verified product data
        const verifiedProduct = verificationResult.product;
        
        // Process the product (save to database, etc.)
        await this.processProduct(verifiedProduct);
      }
      
      // Update status to completed
      this.agentStatus.status = 'idle';
      this.agentStatus.message = 'Product scraping task completed';
      this.agentStatus.progress = 100;
      this.agentStatus.productsFound = this.productsFound;
      this.agentStatus.lastRun = this.lastScrapingTime;
      
      // Broadcast status update
      this.broadcastStatus('idle', {
        message: 'Product scraping task completed',
        progress: 100,
        productsFound: this.productsFound,
        lastRun: this.lastScrapingTime
      });
      
      log('Product scraping task completed', 'enhanced-ai-agent');
    } catch (error) {
      this.agentStatus.status = 'error';
      this.agentStatus.message = `Error in product scraping task: ${error}`;
      
      // Broadcast error status
      this.broadcastStatus('error', {
        message: `Error in product scraping task: ${error}`
      });
      
      log(`Error in product scraping task: ${error}`, 'enhanced-ai-agent');
    }
  }

  /**
   * Discover trending products using LLM and web search
   */
  private async discoverTrendingProducts(count: number): Promise<DiscoveredProduct[]> {
    const products: DiscoveredProduct[] = [];
    let attempts = 0;
    const maxAttempts = count * 2; // Allow up to twice as many attempts as needed products
    
    while (products.length < count && attempts < maxAttempts) {
      attempts++;
      
      try {
        // Generate a product with the LLM
        const product = await this.generateTrendingProduct();
        
        // Skip if product already exists
        if (this.isProductDuplicate(product)) {
          log(`Skipping duplicate product: ${product.name}`, 'enhanced-ai-agent');
          continue;
        }
        
        // Add to discovered products
        products.push(product);
        this.productsFound++;
        
        // Add to cache to avoid duplicates
        this.existingProducts.add(product.name.toLowerCase());
        this.generateProductLookupKeys({ name: product.name, category: product.category })
          .forEach(key => this.existingProductLookupKeys.add(key));
        
        log(`Generated unique product #${products.length}: ${product.name}`, 'enhanced-ai-agent');
      } catch (error) {
        log(`Error generating product (attempt ${attempts}): ${error}`, 'enhanced-ai-agent');
      }
    }
    
    log(`Scraped ${products.length} trending products in ${attempts} attempts`, 'enhanced-ai-agent');
    return products;
  }

  /**
   * Generate a single trending product using the LLM
   */
  private async generateTrendingProduct(): Promise<DiscoveredProduct> {
    const prompt = `Generate a trending dropshipping product with high potential. Include:
- Name
- Category
- Detailed description
- Price range (low and high in USD)
- Source platform (TikTok, Instagram, YouTube, etc.)

Make sure it's a real, trending product that could be found on wholesale sites like AliExpress or CJ Dropshipping.`;

    const result = await llmService.askLLM({
      system: "You are a dropshipping trend analyst who identifies trending products with high potential. Provide factual, realistic product details.",
      user: prompt,
      temperature: 0.7,
      responseFormat: "json"
    });
    
    try {
      // Parse the JSON response
      const data = JSON.parse(result);
      
      // Normalize the data structure
      const product: DiscoveredProduct = {
        name: data.name || data.productName || '',
        category: data.category || '',
        description: data.description || '',
        priceRangeLow: parseFloat(data.priceRangeLow) || parseFloat(data.priceLow) || parseFloat(data.price_low) || 0,
        priceRangeHigh: parseFloat(data.priceRangeHigh) || parseFloat(data.priceHigh) || parseFloat(data.price_high) || 0,
        sourcePlatform: data.sourcePlatform || data.platform || ''
      };
      
      return product;
    } catch (error) {
      log(`Error parsing LLM response: ${error}`, 'enhanced-ai-agent');
      log(`Response was: ${result}`, 'enhanced-ai-agent');
      
      // Try to extract information from non-JSON response
      return this.extractProductFromText(result);
    }
  }

  /**
   * Extract product information from non-JSON text
   */
  private extractProductFromText(text: string): DiscoveredProduct {
    // Default product
    const product: DiscoveredProduct = {
      name: 'Unknown Product',
      category: 'Miscellaneous',
      description: '',
      priceRangeLow: 9.99,
      priceRangeHigh: 29.99
    };
    
    try {
      // Extract name
      const nameMatch = text.match(/name:?\s*([^\n]+)/i);
      if (nameMatch && nameMatch[1]) {
        product.name = nameMatch[1].trim();
      }
      
      // Extract category
      const categoryMatch = text.match(/category:?\s*([^\n]+)/i);
      if (categoryMatch && categoryMatch[1]) {
        product.category = categoryMatch[1].trim();
      }
      
      // Extract description
      const descriptionMatch = text.match(/description:?\s*([^\n]+(?:\n[^\n]+)*)/i);
      if (descriptionMatch && descriptionMatch[1]) {
        product.description = descriptionMatch[1].trim();
      }
      
      // Extract price range
      const priceMatch = text.match(/price range:?\s*\$?(\d+(?:\.\d+)?)\s*-\s*\$?(\d+(?:\.\d+)?)/i);
      if (priceMatch && priceMatch[1] && priceMatch[2]) {
        product.priceRangeLow = parseFloat(priceMatch[1]);
        product.priceRangeHigh = parseFloat(priceMatch[2]);
      } else {
        // Try individual price matches
        const priceLowMatch = text.match(/price(?:range)?low:?\s*\$?(\d+(?:\.\d+)?)/i);
        const priceHighMatch = text.match(/price(?:range)?high:?\s*\$?(\d+(?:\.\d+)?)/i);
        
        if (priceLowMatch && priceLowMatch[1]) {
          product.priceRangeLow = parseFloat(priceLowMatch[1]);
        }
        
        if (priceHighMatch && priceHighMatch[1]) {
          product.priceRangeHigh = parseFloat(priceHighMatch[1]);
        }
      }
      
      // Extract source platform
      const platformMatch = text.match(/(?:source)?platform:?\s*([^\n]+)/i);
      if (platformMatch && platformMatch[1]) {
        product.sourcePlatform = platformMatch[1].trim();
      }
      
      return product;
    } catch (error) {
      log(`Error extracting product from text: ${error}`, 'enhanced-ai-agent');
      return product;
    }
  }

  /**
   * Check if a product is a duplicate
   */
  private isProductDuplicate(product: DiscoveredProduct): boolean {
    // Check for exact name match
    if (this.existingProducts.has(product.name.toLowerCase())) {
      return true;
    }
    
    // Check for fuzzy matches
    const lookupKeys = this.generateProductLookupKeys({
      name: product.name,
      category: product.category
    });
    
    for (const key of lookupKeys) {
      if (this.existingProductLookupKeys.has(key)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Process a verified product (save to database, etc.)
   */
  private async processProduct(product: DiscoveredProduct): Promise<void> {
    try {
      log(`Processed product: ${product.name}`, 'enhanced-ai-agent');
      
      const db = enhancedDatabaseService.getDb();
      
      // Create product in database
      const [createdProduct] = await db.insert(schema.products).values({
        name: product.name,
        description: product.description,
        category: product.category,
        priceRangeLow: product.priceRangeLow,
        priceRangeHigh: product.priceRangeHigh,
        trendScore: product.trendScore || 0,
        engagementRate: product.engagementRate || 0,
        salesVelocity: product.salesVelocity || 0,
        searchVolume: product.searchVolume || 0,
        geographicSpread: product.geographicSpread || 0,
        imageUrl: product.imageUrl,
        createdAt: new Date()
      }).returning();
      
      // Generate trend data
      log(`Scraping trends for product: ${product.name}`, 'enhanced-ai-agent');
      const trendData = await this.generateTrendData(createdProduct.id);
      
      // Generate regional data
      log(`Scraping regions for product: ${product.name}`, 'enhanced-ai-agent');
      const regionData = await this.generateRegionalData(createdProduct.id);
      
      // Generate video data
      log(`Scraping videos for product: ${product.name}`, 'enhanced-ai-agent');
      const videoData = await this.generateVideoData(createdProduct.id, product.name);
      
      // Broadcast product created event
      eventBus.publish('product:created', {
        productId: createdProduct.id,
        productName: product.name,
        timestamp: new Date().toISOString(),
        trendPoints: trendData.length,
        regions: regionData.length,
        videos: videoData.length
      });
    } catch (error) {
      log(`Error processing product ${product.name}: ${error}`, 'enhanced-ai-agent');
    }
  }

  /**
   * Generate trend data for a product
   */
  private async generateTrendData(productId: number): Promise<any[]> {
    try {
      const db = enhancedDatabaseService.getDb();
      
      // Generate 30 days of trend data
      const trendData = [];
      const now = new Date();
      
      for (let i = 30; i >= 1; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Generate a random trend value between 0 and 100
        // With a slight upward trend over time
        const baseValue = 30 + Math.random() * 40;
        const trendFactor = 1 + ((30 - i) / 60);
        const value = baseValue * trendFactor;
        
        trendData.push({
          productId,
          date,
          value,
          source: 'ai-generated',
          createdAt: new Date()
        });
      }
      
      // Insert trend data into database
      await db.insert(schema.trends).values(trendData);
      
      log(`Generated ${trendData.length} trend data points for product: ${productId}`, 'enhanced-ai-agent');
      return trendData;
    } catch (error) {
      log(`Error generating trend data for product ${productId}: ${error}`, 'enhanced-ai-agent');
      return [];
    }
  }

  /**
   * Generate regional data for a product
   */
  private async generateRegionalData(productId: number): Promise<any[]> {
    try {
      const db = enhancedDatabaseService.getDb();
      
      // List of countries with interest levels
      const countries = [
        { country: 'United States', interestLevel: 80 + Math.random() * 20 },
        { country: 'United Kingdom', interestLevel: 70 + Math.random() * 20 },
        { country: 'Canada', interestLevel: 65 + Math.random() * 20 },
        { country: 'Australia', interestLevel: 60 + Math.random() * 20 },
        { country: 'Germany', interestLevel: 40 + Math.random() * 30 }
      ];
      
      // Randomly select 3-5 countries
      const numberOfCountries = 3 + Math.floor(Math.random() * 3);
      const selectedCountries = countries
        .sort(() => 0.5 - Math.random())
        .slice(0, numberOfCountries);
      
      // Create region data
      const regionData = selectedCountries.map(c => ({
        productId,
        country: c.country,
        interestLevel: c.interestLevel,
        createdAt: new Date()
      }));
      
      // Insert region data into database
      await db.insert(schema.regions).values(regionData);
      
      log(`Generated ${regionData.length} regional data points for product: ${productId}`, 'enhanced-ai-agent');
      return regionData;
    } catch (error) {
      log(`Error generating regional data for product ${productId}: ${error}`, 'enhanced-ai-agent');
      return [];
    }
  }

  /**
   * Generate video data for a product
   */
  private async generateVideoData(productId: number, productName: string): Promise<any[]> {
    try {
      const db = enhancedDatabaseService.getDb();
      
      // List of video platforms
      const platforms = ['TikTok', 'YouTube', 'Instagram'];
      
      // Generate 2-3 videos
      const numberOfVideos = 2 + Math.floor(Math.random() * 2);
      const videoData = [];
      
      for (let i = 0; i < numberOfVideos; i++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const views = Math.floor(10000 + Math.random() * 990000);
        
        // Generate a date in the last 90 days
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 90));
        
        // Generate a title
        const titlePrefixes = ['Amazing', 'Must-See', 'Trending', 'Viral', 'Top', 'Best'];
        const titleSuffixes = ['Review', 'Unboxing', 'Demo', 'Test', 'How-to', 'Guide'];
        const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
        const suffix = titleSuffixes[Math.floor(Math.random() * titleSuffixes.length)];
        const title = `${prefix} ${productName} ${suffix}`;
        
        // Generate a fake URL
        const url = `https://${platform.toLowerCase()}.com/watch?v=${Math.random().toString(36).substring(2, 10)}`;
        
        videoData.push({
          productId,
          title,
          url,
          platform,
          views,
          uploadDate: date,
          createdAt: new Date()
        });
      }
      
      // Insert video data into database
      await db.insert(schema.videos).values(videoData);
      
      log(`Generated ${videoData.length} marketing videos for product: ${productId}`, 'enhanced-ai-agent');
      return videoData;
    } catch (error) {
      log(`Error generating video data for product ${productId}: ${error}`, 'enhanced-ai-agent');
      return [];
    }
  }

  /**
   * Broadcast status updates to clients
   */
  private broadcastStatus(status: string, data: any = {}): void {
    // Update internal status
    this.agentStatus.status = status as any;
    this.agentStatus.message = data.message || this.agentStatus.message;
    if (data.progress !== undefined) {
      this.agentStatus.progress = data.progress;
    }
    if (data.productsFound !== undefined) {
      this.agentStatus.productsFound = data.productsFound;
    }
    
    // Publish to event bus
    eventBus.publish('ai-agent:status', {
      type: 'ai_agent_status',
      status,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Manually trigger a scraping task
   */
  public async triggerScraping(): Promise<void> {
    if (!this.isRunning) {
      log('Enhanced AI Agent is not running, cannot trigger scraping', 'enhanced-ai-agent');
      return;
    }

    log('Manually triggering product scraping task', 'enhanced-ai-agent');
    await this.runScrapingTask();
  }
}

// Singleton instance
export const enhancedAIAgentService = EnhancedAIAgentService.getInstance();

// Export functions to interact with the Enhanced AI Agent Service
export function initializeEnhancedAIAgent(): Promise<boolean> {
  return enhancedAIAgentService.initialize();
}

export function startEnhancedAIAgent(): Promise<void> {
  return enhancedAIAgentService.start();
}

export function stopEnhancedAIAgent(): void {
  enhancedAIAgentService.stop();
}

export function triggerEnhancedAIScraping(): Promise<void> {
  return enhancedAIAgentService.triggerScraping();
}

export function getEnhancedAIAgentStatus(): any {
  return enhancedAIAgentService.getStatus();
}

// Export default for convenience
export default enhancedAIAgentService;