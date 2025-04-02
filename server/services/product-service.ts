import { IStorage } from "../storage.js";
import { InsertProduct, Product, ProductFilter, DashboardSummary } from "@shared/schema.js";
import { log } from "../vite.js";

export class ProductService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
    log("ProductService initialized", "service");
  }

  async getProducts(filter: ProductFilter): Promise<{ products: Product[], total: number }> {
    return this.storage.getProducts(filter);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.storage.getProduct(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.storage.createProduct(product);
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.storage.updateProduct(id, product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.storage.deleteProduct(id);
  }

  async getDashboardSummary(): Promise<DashboardSummary> {
    const { products } = await this.storage.getProducts({ page: 1, limit: 1000 });
    
    // Basic metrics
    const trendingProductsCount = products.filter(p => (p.trendScore || 0) >= 80).length;
    const averageTrendScore = products.reduce((sum, p) => sum + (p.trendScore || 0), 0) / products.length;
    
    // Get top region (placeholder for now)
    const topRegion = "United States";
    const topRegionPercentage = 35; // Placeholder value
    
    // Get viral videos count (placeholder for now)
    const viralVideosCount = 12; // Placeholder value
    const newVideosToday = 5; // Placeholder value
    
    // Products data
    const productCount = products.length;
    const newProductCount = products.filter(p => {
      const createdAt = new Date(p.createdAt || "");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return createdAt >= today;
    }).length;
    
    const topProducts = products
      .sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        trendScore: p.trendScore || 0,
        price: p.priceRangeLow
      }));
    
    const recentProducts = products
      .sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime())
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        trendScore: p.trendScore || 0,
        price: p.priceRangeLow
      }));
    
    // Trend metrics
    const averagePrice = products.reduce((sum, p) => sum + (p.priceRangeLow || 0), 0) / products.length;
    const priceChange = 0; // Placeholder value
    const trendScoreChange = 0; // Placeholder value
    
    // Category analysis
    const categoryCounts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percentage: (count / products.length) * 100
      }));
    
    // Geographic data (placeholder values)
    const regionCount = 12;
    const countryCount = 45;
    const topRegions = [
      { regionName: "North America", count: 150, percentage: 35 },
      { regionName: "Europe", count: 120, percentage: 28 },
      { regionName: "Asia", count: 100, percentage: 23 },
      { regionName: "South America", count: 50, percentage: 14 }
    ];
    
    // Video metrics (placeholder values)
    const topVideos = [
      {
        id: 1,
        title: "Product Review",
        platform: "YouTube",
        views: 50000,
        productId: 1,
        productName: "Sample Product",
        thumbnailUrl: "https://example.com/thumbnail.jpg"
      }
    ];
    
    const platformDistribution = [
      { platform: "YouTube", count: 50, percentage: 60 },
      { platform: "TikTok", count: 30, percentage: 30 },
      { platform: "Instagram", count: 20, percentage: 10 }
    ];
    
    // Time series data (placeholder values)
    const trendTimeline = [
      { date: "2024-01-01", avgTrendScore: 75, newProducts: 10 },
      { date: "2024-01-02", avgTrendScore: 78, newProducts: 12 },
      { date: "2024-01-03", avgTrendScore: 82, newProducts: 15 }
    ];
    
    // Performance indicators (placeholder values)
    const salesVelocityDistribution = [
      { range: "0-10", count: 50, percentage: 25 },
      { range: "11-20", count: 75, percentage: 37.5 },
      { range: "21-30", count: 50, percentage: 25 },
      { range: "31+", count: 25, percentage: 12.5 }
    ];
    
    // Market analysis (placeholder values)
    const marketOpportunities = [
      {
        category: "Electronics",
        growthRate: 15,
        competitionLevel: "Medium",
        potentialScore: 85
      },
      {
        category: "Fashion",
        growthRate: 12,
        competitionLevel: "High",
        potentialScore: 75
      }
    ];

    return {
      trendingProductsCount,
      averageTrendScore,
      topRegion,
      topRegionPercentage,
      viralVideosCount,
      newVideosToday,
      productCount,
      newProductCount,
      topProducts,
      recentProducts,
      averagePrice,
      priceChange,
      trendScoreChange,
      topCategories,
      regionCount,
      countryCount,
      topRegions,
      topVideos,
      platformDistribution,
      trendTimeline,
      salesVelocityDistribution,
      marketOpportunities
    };
  }

  // Calculate trend score based on component metrics
  calculateTrendScore(
    engagementRate: number, 
    salesVelocity: number, 
    searchVolume: number, 
    geographicSpread: number
  ): number {
    // Weight: 40% engagement, 30% sales, 20% search, 10% geographic
    const score = (
      (engagementRate * 0.4) + 
      (salesVelocity * 0.3) + 
      (searchVolume * 0.2) + 
      (geographicSpread * 0.1)
    );
    
    return Math.round(score);
  }
}
