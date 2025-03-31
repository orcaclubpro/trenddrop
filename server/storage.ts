import {
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  trends, type Trend, type InsertTrend,
  regions, type Region, type InsertRegion,
  videos, type Video, type InsertVideo,
  type ProductFilter, type DashboardSummary
} from "@shared/schema";

// Define the storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProducts(filter: ProductFilter): Promise<{ products: Product[], total: number }>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;

  // Trend methods
  getTrendsForProduct(productId: number): Promise<Trend[]>;
  createTrend(trend: InsertTrend): Promise<Trend>;

  // Region methods
  getRegionsForProduct(productId: number): Promise<Region[]>;
  createRegion(region: InsertRegion): Promise<Region>;

  // Video methods
  getVideosForProduct(productId: number): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;

  // Dashboard
  getDashboardSummary(): Promise<DashboardSummary>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private trends: Map<number, Trend>;
  private regions: Map<number, Region>;
  private videos: Map<number, Video>;
  private lastUserId: number;
  private lastProductId: number;
  private lastTrendId: number;
  private lastRegionId: number;
  private lastVideoId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.trends = new Map();
    this.regions = new Map();
    this.videos = new Map();
    this.lastUserId = 0;
    this.lastProductId = 0;
    this.lastTrendId = 0;
    this.lastRegionId = 0;
    this.lastVideoId = 0;
    
    // Initialize with some demo data
    this.initDemoData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = ++this.lastUserId;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getProducts(filter: ProductFilter): Promise<{ products: Product[], total: number }> {
    let filtered = Array.from(this.products.values());
    
    // Apply filters
    if (filter.trendScore !== undefined) {
      filtered = filtered.filter(p => p.trendScore >= filter.trendScore);
    }
    
    if (filter.category) {
      filtered = filtered.filter(p => p.category === filter.category);
    }
    
    if (filter.region) {
      // Filter by region would require joining with regions table
      // For in-memory implementation, we'll just get products that have this region
      const productIdsInRegion = new Set(
        Array.from(this.regions.values())
          .filter(r => r.country === filter.region)
          .map(r => r.productId)
      );
      filtered = filtered.filter(p => productIdsInRegion.has(p.id));
    }
    
    const total = filtered.length;
    
    // Pagination
    const startIdx = (filter.page - 1) * filter.limit;
    const endIdx = startIdx + filter.limit;
    filtered = filtered.slice(startIdx, endIdx);
    
    return { products: filtered, total };
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = ++this.lastProductId;
    const now = new Date();
    const product: Product = {
      ...insertProduct,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: number, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    
    const updatedProduct: Product = {
      ...product,
      ...productUpdate,
      updatedAt: new Date()
    };
    
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  // Trend methods
  async getTrendsForProduct(productId: number): Promise<Trend[]> {
    return Array.from(this.trends.values())
      .filter(trend => trend.productId === productId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async createTrend(insertTrend: InsertTrend): Promise<Trend> {
    const id = ++this.lastTrendId;
    const trend: Trend = { ...insertTrend, id };
    this.trends.set(id, trend);
    return trend;
  }

  // Region methods
  async getRegionsForProduct(productId: number): Promise<Region[]> {
    return Array.from(this.regions.values())
      .filter(region => region.productId === productId)
      .sort((a, b) => b.percentage - a.percentage);
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    const id = ++this.lastRegionId;
    const region: Region = { ...insertRegion, id };
    this.regions.set(id, region);
    return region;
  }

  // Video methods
  async getVideosForProduct(productId: number): Promise<Video[]> {
    return Array.from(this.videos.values())
      .filter(video => video.productId === productId)
      .sort((a, b) => b.views - a.views);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const id = ++this.lastVideoId;
    const video: Video = { ...insertVideo, id };
    this.videos.set(id, video);
    return video;
  }

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    const allProducts = Array.from(this.products.values());
    const allRegions = Array.from(this.regions.values());
    const allVideos = Array.from(this.videos.values());
    
    // Calculate top region
    const regionCounts: {[key: string]: number} = {};
    allRegions.forEach(region => {
      if (!regionCounts[region.country]) regionCounts[region.country] = 0;
      regionCounts[region.country] += region.percentage;
    });
    
    let topRegion = '';
    let topRegionPercentage = 0;
    
    Object.entries(regionCounts).forEach(([country, percentage]) => {
      if (percentage > topRegionPercentage) {
        topRegion = country;
        topRegionPercentage = percentage;
      }
    });
    
    // Calculate new videos (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    const newVideosToday = allVideos.filter(v => v.uploadDate > oneDayAgo).length;
    
    // Calculate average trend score
    const totalTrendScore = allProducts.reduce((sum, product) => sum + product.trendScore, 0);
    const averageTrendScore = allProducts.length > 0 ? 
      Math.round((totalTrendScore / allProducts.length) * 10) / 10 : 0;
    
    return {
      trendingProductsCount: allProducts.length,
      averageTrendScore,
      topRegion,
      topRegionPercentage: Math.round(topRegionPercentage / allRegions.length),
      viralVideosCount: allVideos.length,
      newVideosToday
    };
  }

  // Initialize demo data
  private initDemoData() {
    // Create demo products
    const demoProducts: InsertProduct[] = [
      {
        name: "Self-Stirring Mug",
        category: "Home",
        subcategory: "Kitchenware",
        priceRangeLow: 9.99,
        priceRangeHigh: 15.99,
        trendScore: 85,
        engagementRate: 45,
        salesVelocity: 24,
        searchVolume: 15,
        geographicSpread: 7
      },
      {
        name: "Floating Plant Pot",
        category: "Home",
        subcategory: "Decor",
        priceRangeLow: 19.99,
        priceRangeHigh: 29.99,
        trendScore: 92,
        engagementRate: 48,
        salesVelocity: 27,
        searchVolume: 17,
        geographicSpread: 8
      },
      {
        name: "Collapsible Water Bottle",
        category: "Fitness",
        subcategory: "Accessories",
        priceRangeLow: 14.99,
        priceRangeHigh: 24.99,
        trendScore: 78,
        engagementRate: 38,
        salesVelocity: 23,
        searchVolume: 14,
        geographicSpread: 6
      },
      {
        name: "LED Photo Clip String Lights",
        category: "Decor",
        subcategory: "Lighting",
        priceRangeLow: 12.99,
        priceRangeHigh: 22.99,
        trendScore: 81,
        engagementRate: 41,
        salesVelocity: 24,
        searchVolume: 13,
        geographicSpread: 6
      },
      {
        name: "Mini Portable Projector",
        category: "Tech",
        subcategory: "Electronics",
        priceRangeLow: 69.99,
        priceRangeHigh: 89.99,
        trendScore: 89,
        engagementRate: 44,
        salesVelocity: 26,
        searchVolume: 18,
        geographicSpread: 7
      }
    ];

    // Add products to storage
    demoProducts.forEach(product => {
      this.createProduct(product).then(p => {
        this.createTrendData(p.id);
        this.createRegionData(p.id);
        this.createVideoData(p.id);
      });
    });
  }

  private async createTrendData(productId: number) {
    const today = new Date();
    
    // Create 30 days of trend data
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate increasing trend values as we get closer to today
      const factor = 1 + ((30 - i) / 30);
      const trend: InsertTrend = {
        productId,
        date,
        engagementValue: Math.floor(10 + (i * 2 * factor)),
        salesValue: Math.floor(5 + (i * factor)),
        searchValue: Math.floor(3 + (i * 0.5 * factor))
      };
      
      await this.createTrend(trend);
    }
  }
  
  private async createRegionData(productId: number) {
    // Create regions based on product ID to ensure variety
    const regions: [string, number][] = productId % 2 === 0 ? 
      [["USA", 45], ["Germany", 30], ["Japan", 15], ["Canada", 10]] :
      [["Canada", 35], ["UK", 25], ["Australia", 20], ["Brazil", 20]];
    
    for (const [country, percentage] of regions) {
      await this.createRegion({
        productId,
        country,
        percentage
      });
    }
  }
  
  private async createVideoData(productId: number) {
    const platforms = ["TikTok", "Instagram", "YouTube"];
    const today = new Date();
    
    // Create 3 videos per product
    for (let i = 0; i < 3; i++) {
      const uploadDate = new Date(today);
      uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 10));
      
      const platform = platforms[i % platforms.length];
      const views = Math.floor(100000 + Math.random() * 900000);
      
      await this.createVideo({
        productId,
        title: `Amazing ${this.products.get(productId)?.name} Demo`,
        platform,
        views,
        uploadDate,
        thumbnailUrl: `https://picsum.photos/seed/${productId * 10 + i}/400/225`,
        videoUrl: `https://example.com/video/${productId * 10 + i}`
      });
    }
  }
}

export const storage = new MemStorage();
