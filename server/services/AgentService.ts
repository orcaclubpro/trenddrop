/**
 * AgentService - Product discovery and trend tracking
 * 
 * This service is responsible for discovering trending products and tracking their metrics.
 */

import * as schema from '../../shared/schema.js';
import { eventBus } from '../core/EventBus.js';
import { webSocketService } from './common/WebSocketService.js';
import { productService } from './ProductService.js';
import { trendService } from './TrendService.js';
import { regionService } from './RegionService.js';
import { videoService } from './VideoService.js';
import { log } from '../vite.js';

// Agent status interface
interface AgentStatus {
  status: string;
  message: string;
  progress: number;
  productsFound: number;
  lastRun?: Date;
  nextRun?: Date;
}

export class AgentService {
  private static instance: AgentService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private lastScrapingTime: Date | undefined = undefined;
  private productsFound = 0;
  private scrapingInterval = 3600000; // 1 hour in milliseconds
  
  private agentStatus: AgentStatus = {
    status: 'idle',
    message: 'Agent is idle',
    progress: 0,
    productsFound: 0
  };

  private constructor() {
    // Subscribe to event bus events
    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Listen for WebSocket client connections
    eventBus.subscribe('ws:client_connected', () => {
      this.broadcastStatus(this.agentStatus.status, {
        message: this.agentStatus.message,
        progress: this.agentStatus.progress,
        productsFound: this.agentStatus.productsFound,
        lastRun: this.lastScrapingTime,
        nextRun: this.getNextRunTime()
      });
    });
    
    // Listen for database connection events
    eventBus.subscribe('db:connected', () => {
      log('Database connected, agent service ready', 'agent');
    });
    
    // Listen for metric update events
    eventBus.subscribe('trend:metrics:update', (data) => {
      this.updateProductMetrics(data.productId);
    });
    
    eventBus.subscribe('region:metrics:update', (data) => {
      this.updateProductMetrics(data.productId);
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  /**
   * Start the agent service
   */
  public start(): void {
    if (this.isRunning) {
      log('Agent service is already running', 'agent');
      return;
    }

    this.isRunning = true;
    this.agentStatus = {
      status: 'running',
      message: 'Agent service started',
      progress: 0,
      productsFound: this.productsFound
    };

    log('Starting agent service', 'agent');
    this.broadcastStatus('running', {
      message: 'Agent service started'
    });

    // Run the scraping task immediately
    this.runScrapingTask();

    // Set up interval for periodic scraping
    this.intervalId = setInterval(() => {
      this.runScrapingTask();
    }, this.scrapingInterval);
  }

  /**
   * Stop the agent service
   */
  public stop(): void {
    if (!this.isRunning) {
      log('Agent service is not running', 'agent');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.agentStatus = {
      status: 'stopped',
      message: 'Agent service stopped',
      progress: 0,
      productsFound: this.productsFound,
      lastRun: this.lastScrapingTime
    };

    log('Agent service stopped', 'agent');
    this.broadcastStatus('stopped', {
      message: 'Agent service stopped',
      lastRun: this.lastScrapingTime
    });
  }

  /**
   * Get the agent status
   */
  public getStatus(): AgentStatus {
    return {
      ...this.agentStatus,
      lastRun: this.lastScrapingTime,
      nextRun: this.getNextRunTime()
    };
  }

  /**
   * Calculate the next run time
   */
  private getNextRunTime(): Date | undefined {
    if (!this.isRunning || !this.lastScrapingTime) {
      return undefined;
    }

    const nextRun = new Date(this.lastScrapingTime);
    nextRun.setTime(nextRun.getTime() + this.scrapingInterval);
    return nextRun;
  }

  /**
   * Run the product scraping task
   */
  private async runScrapingTask(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    log('Starting product scraping task', 'agent');
    this.agentStatus.status = 'scraping';
    this.agentStatus.message = 'Searching for trending products';
    this.agentStatus.progress = 10;

    this.broadcastStatus('scraping', {
      message: 'Searching for trending products',
      progress: 10
    });

    try {
      // Record start time
      this.lastScrapingTime = new Date();
      
      // Simulate discovering products
      // In a real implementation, this would interact with external APIs or use AI
      const products = await this.scrapeProducts();
      
      // Update status
      this.agentStatus.progress = 50;
      this.agentStatus.message = `Found ${products.length} products, analyzing trends`;
      this.broadcastStatus('analyzing', {
        message: `Found ${products.length} products, analyzing trends`,
        progress: 50
      });

      // Process each product
      for (const productData of products) {
        // Create the product
        const product = await productService.createProduct(productData);
        this.productsFound++;
        
        // Generate trend data
        const trends = await this.scrapeTrends(product.id, product.name);
        for (const trend of trends) {
          await trendService.createTrend(trend);
        }
        
        // Generate region data
        const regions = await this.scrapeRegions(product.id, product.name);
        for (const region of regions) {
          await regionService.createRegion(region);
        }
        
        // Generate video data
        const videos = await this.scrapeVideos(product.id, product.name);
        for (const video of videos) {
          await videoService.createVideo(video);
        }
        
        // Update product metrics
        await this.updateProductMetrics(product.id);
        
        // Broadcast update
        this.broadcastUpdate(product.id);
      }

      // Update status
      this.agentStatus.status = 'idle';
      this.agentStatus.message = `Completed scraping, found ${products.length} products`;
      this.agentStatus.progress = 100;
      this.agentStatus.productsFound = this.productsFound;
      
      this.broadcastStatus('idle', {
        message: `Completed scraping, found ${products.length} products`,
        progress: 100,
        productsFound: this.productsFound,
        lastRun: this.lastScrapingTime,
        nextRun: this.getNextRunTime()
      });
      
      log(`Completed scraping task, found ${products.length} products`, 'agent');
    } catch (error) {
      log(`Error in scraping task: ${error}`, 'agent');
      
      this.agentStatus.status = 'error';
      this.agentStatus.message = `Error in scraping task: ${error}`;
      this.agentStatus.progress = 0;
      
      this.broadcastStatus('error', {
        message: `Error in scraping task: ${error}`,
        error: String(error)
      });
    }
  }

  /**
   * Update product metrics based on trends and regions
   */
  private async updateProductMetrics(productId: number): Promise<void> {
    try {
      // Update trend score and metrics
      await productService.updateProductTrendScore(productId);
      
      // Broadcast update
      this.broadcastUpdate(productId);
    } catch (error) {
      log(`Error updating product metrics: ${error}`, 'agent');
    }
  }

  /**
   * Simulate product scraping
   * In a real implementation, this would interact with external APIs or use AI
   */
  private async scrapeProducts(): Promise<schema.InsertProduct[]> {
    // Categories and subcategories
    const categories = [
      { category: 'Electronics', subcategories: ['Smartphones', 'Wearables', 'Smart Home'] },
      { category: 'Fashion', subcategories: ['Accessories', 'Clothing', 'Footwear'] },
      { category: 'Home & Garden', subcategories: ['Kitchen', 'Decor', 'Furniture'] },
      { category: 'Health & Beauty', subcategories: ['Skincare', 'Haircare', 'Fitness'] },
      { category: 'Pets', subcategories: ['Toys', 'Accessories', 'Food'] }
    ];
    
    // Generate 1-3 products
    const numProducts = Math.floor(Math.random() * 3) + 1;
    const products: schema.InsertProduct[] = [];
    
    for (let i = 0; i < numProducts; i++) {
      // Select random category and subcategory
      const categoryInfo = categories[Math.floor(Math.random() * categories.length)];
      const category = categoryInfo.category;
      const subcategory = categoryInfo.subcategories[Math.floor(Math.random() * categoryInfo.subcategories.length)];
      
      // Generate product name
      const productName = this.generateProductName(category, subcategory);
      
      // Generate price range
      const minPrice = Math.floor(Math.random() * 50) + 10;
      const maxPrice = minPrice + Math.floor(Math.random() * 100) + 20;
      
      // Generate initial trend score
      const trendScore = Math.floor(Math.random() * 40) + 60; // 60-100
      
      // Generate engagement metrics
      const engagementRate = Math.floor(Math.random() * 30) + 70; // 70-100
      const salesVelocity = Math.floor(Math.random() * 40) + 60; // 60-100
      const searchVolume = Math.floor(Math.random() * 50) + 50; // 50-100
      const geographicSpread = Math.floor(Math.random() * 60) + 40; // 40-100
      
      // Create product object
      products.push({
        name: productName,
        category,
        subcategory,
        description: `Trending ${subcategory.toLowerCase()} in the ${category.toLowerCase()} category`,
        priceRangeLow: minPrice,
        priceRangeHigh: maxPrice,
        trendScore,
        engagementRate,
        salesVelocity,
        searchVolume,
        geographicSpread,
        sourcePlatform: 'TrendDrop',
        aliexpressUrl: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(productName)}`,
        cjdropshippingUrl: `https://cjdropshipping.com/search?q=${encodeURIComponent(productName)}`,
        imageUrl: `https://source.unsplash.com/random/400x400/?${encodeURIComponent(productName.split(' ')[0])}`
      });
    }
    
    return products;
  }

  /**
   * Generate a product name
   */
  private generateProductName(category: string, subcategory: string): string {
    const adjectives = ['Premium', 'Ultra', 'Smart', 'Pro', 'Elite', 'Advanced', 'Essential', 'Luxury', 'Compact'];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    
    // Generate suffixes based on category
    let suffixes: string[] = [];
    
    switch (category) {
      case 'Electronics':
        suffixes = ['X1', 'Pro', 'Max', 'Ultra', 'Plus', '360', 'Neo'];
        break;
      case 'Fashion':
        suffixes = ['Collection', 'Edition', 'Series', 'Line', 'Signature'];
        break;
      case 'Home & Garden':
        suffixes = ['Home', 'Living', 'Essentials', 'Collection', 'Comfort'];
        break;
      case 'Health & Beauty':
        suffixes = ['Essential', 'Natural', 'Pure', 'Radiance', 'Wellness'];
        break;
      case 'Pets':
        suffixes = ['Buddy', 'Companion', 'Friend', 'Care', 'Joy'];
        break;
      default:
        suffixes = ['Pro', 'Plus', 'Premium', 'Elite'];
    }
    
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Generate a unique identifier
    const id = this.generateRandomId(3).toUpperCase();
    
    return `${adjective} ${subcategory} ${suffix} ${id}`;
  }

  /**
   * Simulate trend data generation
   */
  private async scrapeTrends(productId: number, productName: string): Promise<schema.InsertTrend[]> {
    // Use the trend service to generate initial trend data
    return trendService.generateInitialTrendData(productId, 70); // Base trend score of 70
  }

  /**
   * Simulate region data generation
   */
  private async scrapeRegions(productId: number, productName: string): Promise<schema.InsertRegion[]> {
    // Use the region service to generate initial region data
    return regionService.generateInitialRegionData(productId, 70); // Base trend score of 70
  }

  /**
   * Simulate video data generation
   */
  private async scrapeVideos(productId: number, productName: string): Promise<schema.InsertVideo[]> {
    // Get the product to access its category
    const product = await productService.getProduct(productId);
    
    if (!product) {
      return [];
    }
    
    // Use the video service to generate initial video data
    return videoService.generateInitialVideoData(productId, productName, product.category);
  }

  /**
   * Generate a random ID
   */
  private generateRandomId(length: number): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return result;
  }

  /**
   * Broadcast product update
   */
  private broadcastUpdate(productId: number): void {
    webSocketService.broadcast({
      type: 'product_update',
      productId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Broadcast agent status
   */
  private broadcastStatus(status: string, data: any = {}): void {
    webSocketService.broadcast({
      type: 'agent_status',
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
      log('Agent service is not running, cannot trigger scraping', 'agent');
      return;
    }

    log('Manually triggering product scraping task', 'agent');
    await this.runScrapingTask();
  }
}

// Export singleton instance
export const agentService = AgentService.getInstance();

// Export functions to interact with the Agent Service
export function startAgentService(): void {
  agentService.start();
}

export function stopAgentService(): void {
  agentService.stop();
}

export function triggerScraping(): Promise<void> {
  return agentService.triggerScraping();
}

export function getAgentStatus(): any {
  return agentService.getStatus();
}

// Export default for convenience
export default agentService;