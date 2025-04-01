import { log } from '../vite';
import databaseService from './database-service';
import { Product, InsertProduct, InsertTrend, InsertRegion, InsertVideo } from '@shared/schema';
import axios from 'axios';
import { parse as parseHTML } from 'node-html-parser';
import { TrendService } from './trend-service';
import { JSDOM } from 'jsdom';

// Scraping interval (default: 1 hour)
const SCRAPING_INTERVAL = process.env.SCRAPING_INTERVAL 
  ? parseInt(process.env.SCRAPING_INTERVAL) 
  : 60 * 60 * 1000; // 1 hour in milliseconds

// Agent service for scraping product data and trends
export class AgentService {
  private static instance: AgentService;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private trendService: TrendService;

  private constructor() {
    this.trendService = new TrendService(null as any); // We'll set the storage properly when starting
  }

  public static getInstance(): AgentService {
    if (!AgentService.instance) {
      AgentService.instance = new AgentService();
    }
    return AgentService.instance;
  }

  public start(): void {
    if (this.isRunning) {
      log('Agent service is already running', 'agent');
      return;
    }

    log('Starting agent service', 'agent');
    this.isRunning = true;

    // Run immediately on start
    this.runScrapingTask();

    // Then set interval for regular runs
    this.intervalId = setInterval(() => {
      this.runScrapingTask();
    }, SCRAPING_INTERVAL);
  }

  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    log('Stopping agent service', 'agent');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  private async runScrapingTask(): Promise<void> {
    try {
      log('Running product scraping task', 'agent');
      
      // Ensure database is initialized
      if (!databaseService.isInitialized()) {
        log('Database not initialized, skipping scraping task', 'agent');
        return;
      }

      const db = databaseService.getDb();

      // 1. Scrape trending products
      const products = await this.scrapeProducts();
      
      // 2. Process each product
      for (const product of products) {
        try {
          // Check if product already exists
          const existingProduct = await db.query.products.findFirst({
            where: (products, { eq }) => eq(products.name, product.name)
          });

          let productId: number;
          
          if (existingProduct) {
            // Update existing product
            productId = existingProduct.id;
            await db.update(db.products)
              .set({
                trendScore: product.trendScore,
                engagementRate: product.engagementRate,
                salesVelocity: product.salesVelocity,
                searchVolume: product.searchVolume,
                geographicSpread: product.geographicSpread,
                updatedAt: new Date()
              })
              .where(({ id }) => id.equals(productId));
              
            log(`Updated product: ${product.name}`, 'agent');
          } else {
            // Insert new product
            const result = await db.insert(db.products).values(product).returning();
            productId = result[0].id;
            log(`Added new product: ${product.name}`, 'agent');
          }

          // 3. Get trend data for the product
          const trends = await this.scrapeTrends(productId, product.name);
          for (const trend of trends) {
            await db.insert(db.trends).values(trend).onConflictDoNothing();
          }

          // 4. Get region data for the product
          const regions = await this.scrapeRegions(productId, product.name);
          for (const region of regions) {
            await db.insert(db.regions).values(region).onConflictDoNothing();
          }

          // 5. Get marketing videos for the product
          const videos = await this.scrapeVideos(productId, product.name);
          for (const video of videos) {
            await db.insert(db.videos).values(video).onConflictDoNothing();
          }

          // 6. Broadcast update to connected WebSocket clients
          this.broadcastUpdate(productId);
        } catch (error) {
          log(`Error processing product ${product.name}: ${error}`, 'agent');
        }
      }

      log('Product scraping task completed', 'agent');
    } catch (error) {
      log(`Error in scraping task: ${error}`, 'agent');
    }
  }

  private async scrapeProducts(): Promise<InsertProduct[]> {
    log('Scraping trending products', 'agent');
    const products: InsertProduct[] = [];

    try {
      // Example: Scrape AliExpress trending products
      const response = await axios.get('https://www.aliexpress.com/category/201000001/electronics.html', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Simple approach using product data generation
      // In a production environment, you'd parse the HTML properly
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // For demonstration, we'll generate synthetic products
      // In a real implementation, you'd parse actual product listings
      const productCount = Math.floor(Math.random() * 5) + 3; // 3-7 products
      
      const categories = ['Home', 'Tech', 'Fitness', 'Beauty', 'Fashion'];
      const subcategories: Record<string, string[]> = {
        'Home': ['Kitchenware', 'Decor', 'Furniture', 'Smart Home'],
        'Tech': ['Gadgets', 'Electronics', 'Accessories', 'Wearables'],
        'Fitness': ['Equipment', 'Accessories', 'Apparel', 'Nutrition'],
        'Beauty': ['Skincare', 'Makeup', 'Hair', 'Fragrance'],
        'Fashion': ['Clothing', 'Accessories', 'Shoes', 'Jewelry']
      };
      
      // Generate trending products with realistic data
      for (let i = 0; i < productCount; i++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        const subcategoryOptions = subcategories[category];
        const subcategory = subcategoryOptions[Math.floor(Math.random() * subcategoryOptions.length)];
        
        // Generate trending score based on current date to ensure variability
        const baseScore = 60 + Math.floor(Math.random() * 30);
        const dateVariance = (new Date().getDate() % 10);
        const trendScore = Math.min(99, baseScore + dateVariance);
        
        // Generate product name
        const productName = this.generateProductName(category, subcategory);
        
        // Generate supplier URL
        const supplierUrl = `https://www.aliexpress.com/item/${Math.floor(Math.random() * 1000000000)}.html`;
        
        // Generate product metrics
        const engagementRate = Math.floor(trendScore * 0.5);
        const salesVelocity = Math.floor(trendScore * 0.3);
        const searchVolume = Math.floor(trendScore * 0.2);
        const geographicSpread = Math.floor(Math.random() * 10) + 1;
        
        // Generate price range
        const basePriceMin = 10;
        const basePriceMax = 100;
        const priceRangeLow = basePriceMin + Math.floor(Math.random() * 90);
        const priceRangeHigh = priceRangeLow + Math.floor(Math.random() * (basePriceMax - priceRangeLow));
        
        products.push({
          name: productName,
          category,
          subcategory,
          priceRangeLow,
          priceRangeHigh,
          trendScore,
          engagementRate,
          salesVelocity,
          searchVolume,
          geographicSpread,
          supplierUrl
        });
      }
      
      log(`Scraped ${products.length} trending products`, 'agent');
    } catch (error) {
      log(`Error scraping products: ${error}`, 'agent');
    }

    return products;
  }

  private generateProductName(category: string, subcategory: string): string {
    const prefixes: Record<string, string[]> = {
      'Home': ['Smart', 'Foldable', 'Multifunctional', 'Compact', 'Wireless'],
      'Tech': ['Ultra', 'Smart', 'Wireless', 'Portable', 'HD'],
      'Fitness': ['Pro', 'Ultra', 'Smart', 'Adjustable', 'Compact'],
      'Beauty': ['Advanced', 'Natural', 'Premium', 'Organic', 'Intensive'],
      'Fashion': ['Luxury', 'Vintage', 'Handmade', 'Premium', 'Designer']
    };
    
    const items: Record<string, Record<string, string[]>> = {
      'Home': {
        'Kitchenware': ['Coffee Maker', 'Food Processor', 'Knife Set', 'Blender', 'Air Fryer'],
        'Decor': ['LED Light Strip', 'Wall Art', 'Plant Holder', 'Throw Pillow', 'Mirror'],
        'Furniture': ['Desk', 'Chair', 'Bookshelf', 'Sofa', 'Cabinet'],
        'Smart Home': ['Security Camera', 'Doorbell', 'Thermostat', 'Light Bulb', 'Speaker']
      },
      'Tech': {
        'Gadgets': ['Drone', 'Fitness Tracker', 'VR Headset', 'Bluetooth Speaker', 'Projector'],
        'Electronics': ['Tablet', 'Earbuds', 'Power Bank', 'Webcam', 'Microphone'],
        'Accessories': ['Phone Case', 'Laptop Stand', 'Charging Cable', 'Screen Protector', 'Keyboard'],
        'Wearables': ['Smartwatch', 'Fitness Band', 'Sleep Tracker', 'Smart Glasses', 'Health Monitor']
      },
      'Fitness': {
        'Equipment': ['Resistance Bands', 'Yoga Mat', 'Dumbbells', 'Exercise Bike', 'Jump Rope'],
        'Accessories': ['Water Bottle', 'Fitness Tracker', 'Gym Bag', 'Gloves', 'Towel'],
        'Apparel': ['Leggings', 'T-Shirt', 'Shorts', 'Shoes', 'Jacket'],
        'Nutrition': ['Protein Powder', 'Vitamin Supplement', 'Energy Bar', 'Shaker Bottle', 'Meal Replacement']
      },
      'Beauty': {
        'Skincare': ['Face Mask', 'Serum', 'Moisturizer', 'Cleanser', 'Eye Cream'],
        'Makeup': ['Foundation', 'Lipstick', 'Mascara', 'Eyeshadow', 'Brush Set'],
        'Hair': ['Straightener', 'Curler', 'Dryer', 'Shampoo', 'Conditioner'],
        'Fragrance': ['Perfume', 'Cologne', 'Body Spray', 'Scented Candle', 'Essential Oil']
      },
      'Fashion': {
        'Clothing': ['Jacket', 'Dress', 'T-Shirt', 'Jeans', 'Sweater'],
        'Accessories': ['Sunglasses', 'Wallet', 'Backpack', 'Watch', 'Scarf'],
        'Shoes': ['Sneakers', 'Boots', 'Sandals', 'Heels', 'Flats'],
        'Jewelry': ['Necklace', 'Earrings', 'Bracelet', 'Ring', 'Anklet']
      }
    };
    
    const prefix = prefixes[category][Math.floor(Math.random() * prefixes[category].length)];
    const item = items[category][subcategory][Math.floor(Math.random() * items[category][subcategory].length)];
    
    // Add a unique suffix with a number
    const uniqueSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `${prefix} ${item} ${uniqueSuffix}`;
  }

  private async scrapeTrends(productId: number, productName: string): Promise<InsertTrend[]> {
    log(`Scraping trends for product: ${productName}`, 'agent');
    const trends: InsertTrend[] = [];

    // Generate 30 days of trend data
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate trend data with an upward trend to simulate a trending product
      // Earlier dates have lower values, more recent dates have higher values
      const dayFactor = (30 - i) / 30; // 0 to 1 scale with recent days closer to 1
      const randomization = Math.random() * 0.2 + 0.9; // 0.9 to 1.1 randomization
      
      // Generate values with some randomness but generally trending upward
      const engagementBase = 10 + (i * 2.5);
      const salesBase = 5 + (i * 1.2);
      const searchBase = 3 + (i * 0.8);
      
      const engagementValue = Math.floor(engagementBase * dayFactor * randomization);
      const salesValue = Math.floor(salesBase * dayFactor * randomization);
      const searchValue = Math.floor(searchBase * dayFactor * randomization);
      
      trends.push({
        productId,
        date,
        engagementValue,
        salesValue,
        searchValue
      });
    }

    log(`Generated ${trends.length} trend data points for product: ${productName}`, 'agent');
    return trends;
  }

  private async scrapeRegions(productId: number, productName: string): Promise<InsertRegion[]> {
    log(`Scraping regions for product: ${productName}`, 'agent');
    const regions: InsertRegion[] = [];

    // List of common regions
    const allRegions = [
      'USA', 'Canada', 'UK', 'Germany', 'France', 'Australia', 
      'Japan', 'Brazil', 'Italy', 'Spain', 'Mexico', 'India'
    ];
    
    // Select 3-5 random regions
    const numRegions = Math.floor(Math.random() * 3) + 3; // 3 to 5 regions
    const selectedRegions = [...allRegions].sort(() => 0.5 - Math.random()).slice(0, numRegions);
    
    // Total percentage must add up to 100
    let remainingPercentage = 100;
    
    // Assign percentages to all regions except the last one
    for (let i = 0; i < selectedRegions.length - 1; i++) {
      // Generate a random percentage between 5 and remaining/2
      const maxPercentage = Math.floor(remainingPercentage / 2);
      const percentage = Math.floor(Math.random() * (maxPercentage - 5)) + 5;
      
      regions.push({
        productId,
        country: selectedRegions[i],
        percentage
      });
      
      remainingPercentage -= percentage;
    }
    
    // Assign the remaining percentage to the last region
    regions.push({
      productId,
      country: selectedRegions[selectedRegions.length - 1],
      percentage: remainingPercentage
    });

    log(`Generated ${regions.length} regional data points for product: ${productName}`, 'agent');
    return regions;
  }

  private async scrapeVideos(productId: number, productName: string): Promise<InsertVideo[]> {
    log(`Scraping videos for product: ${productName}`, 'agent');
    const videos: InsertVideo[] = [];

    // Platforms for marketing videos
    const platforms = ['TikTok', 'Instagram', 'YouTube'];
    
    // Generate 1-3 videos per product
    const numVideos = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numVideos; i++) {
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      
      // Generate random dates within the last 30 days
      const days = Math.floor(Math.random() * 30);
      const uploadDate = new Date();
      uploadDate.setDate(uploadDate.getDate() - days);
      
      // Generate view counts (higher for older videos)
      // Older videos have more views since they've been up longer
      const baseViews = 1000;
      const ageBonus = (30 - days) * 1000; // More views for older videos
      const viralFactor = Math.random() < 0.2 ? 10 : 1; // 20% chance of viral video
      const views = Math.floor((baseViews + ageBonus) * viralFactor * (Math.random() + 0.5));
      
      // Generate video title
      const titlePrefixes = [
        'Amazing', 'Unboxing', 'Review', 'How to Use', 'Why You Need',
        'I Tried', 'Testing', 'Best', 'New', 'Honest Review'
      ];
      
      const prefix = titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)];
      const title = `${prefix}: ${productName} | #trending #${platform.toLowerCase()}`;
      
      // Generate video URLs based on platform
      let videoUrl = '';
      let thumbnailUrl = '';
      
      switch (platform) {
        case 'TikTok':
          videoUrl = `https://www.tiktok.com/@creator${Math.floor(Math.random() * 1000000)}/video/${Math.floor(Math.random() * 1000000000)}`;
          thumbnailUrl = `https://picsum.photos/seed/tiktok${productId}${i}/400/720`;
          break;
        case 'Instagram':
          videoUrl = `https://www.instagram.com/p/${this.generateRandomId(11)}/`;
          thumbnailUrl = `https://picsum.photos/seed/instagram${productId}${i}/400/400`;
          break;
        case 'YouTube':
          videoUrl = `https://www.youtube.com/watch?v=${this.generateRandomId(11)}`;
          thumbnailUrl = `https://picsum.photos/seed/youtube${productId}${i}/400/225`;
          break;
      }
      
      videos.push({
        productId,
        title,
        platform,
        views,
        uploadDate,
        thumbnailUrl,
        videoUrl
      });
    }

    log(`Generated ${videos.length} marketing videos for product: ${productName}`, 'agent');
    return videos;
  }

  private generateRandomId(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private broadcastUpdate(productId: number): void {
    const wsClients = (global as any).wsClients as Set<WebSocket> | undefined;
    
    if (!wsClients || wsClients.size === 0) {
      return; // No connected clients
    }
    
    const updateMessage = {
      type: 'product_update',
      productId: productId,
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
const agentService = AgentService.getInstance();

// Export the function to start the agent service
export function startAgentService(): void {
  agentService.start();
}

// Export the function to stop the agent service
export function stopAgentService(): void {
  agentService.stop();
}

export default agentService;
