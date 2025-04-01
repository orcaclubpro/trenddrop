import * as schema from "@shared/schema.js";
import {
  users, type User, type InsertUser,
  products, type Product, type InsertProduct,
  trends, type Trend, type InsertTrend,
  regions, type Region, type InsertRegion,
  videos, type Video, type InsertVideo,
  type ProductFilter, type DashboardSummary
} from "@shared/schema.js";
import { eq, gte, and, desc, asc, sql } from "drizzle-orm";
import databaseService from "./services/database-service.js";
import { log } from "./vite.js";

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

// Database-backed storage implementation
export class DbStorage implements IStorage {
  constructor() {}

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.query.users.findFirst({
        where: (users: typeof schema.users.$inferSelect, { eq }: { eq: any }) => eq(users.id, id)
      });
      return result;
    } catch (error) {
      log(`Error getting user: ${error}`, 'storage');
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.query.users.findFirst({
        where: (users: typeof schema.users.$inferSelect, { eq }: { eq: any }) => eq(users.username, username)
      });
      return result;
    } catch (error) {
      log(`Error getting user by username: ${error}`, 'storage');
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      log(`Error creating user: ${error}`, 'storage');
      throw error;
    }
  }

  // Product methods
  async getProducts(filter: ProductFilter): Promise<{ products: Product[], total: number }> {
    try {
      const db = databaseService.getDb();
      let query = db.select().from(products);
      
      // Apply filters
      if (filter.trendScore !== undefined) {
        query = query.where(gte(products.trendScore, filter.trendScore));
      }
      
      if (filter.category) {
        query = query.where(eq(products.category, filter.category));
      }
      
      if (filter.region) {
        // For region filtering, we need to join with regions table
        // This is a more complex query requiring a subquery
        const productsInRegion = db.select({ productId: regions.productId })
          .from(regions)
          .where(eq(regions.country, filter.region));
          
        query = query.where(
          sql`${products.id} IN (${productsInRegion.as('subquery')})`
        );
      }
      
      // Get total count
      const countResult = await db.select({ count: sql`COUNT(*)` }).from(query.as('filtered_products'));
      const total = parseInt(countResult[0].count.toString());
      
      // Apply pagination
      const startIdx = (filter.page - 1) * filter.limit;
      query = query.orderBy(desc(products.trendScore)).limit(filter.limit).offset(startIdx);
      
      // Execute query
      const result = await query;
      
      return { products: result, total };
    } catch (error) {
      log(`Error getting products: ${error}`, 'storage');
      return { products: [], total: 0 };
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.query.products.findFirst({
        where: (products: typeof schema.products.$inferSelect, { eq }: { eq: any }) => eq(products.id, id)
      });
      return result;
    } catch (error) {
      log(`Error getting product: ${error}`, 'storage');
      return undefined;
    }
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(products).values(insertProduct).returning();
      return result[0];
    } catch (error) {
      log(`Error creating product: ${error}`, 'storage');
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.update(products)
        .set({ ...product, updatedAt: new Date() })
        .where(eq(products.id, id))
        .returning();
        
      return result[0];
    } catch (error) {
      log(`Error updating product: ${error}`, 'storage');
      return undefined;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      const result = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });
      return result.length > 0;
    } catch (error) {
      log(`Error deleting product: ${error}`, 'storage');
      return false;
    }
  }

  // Trend methods
  async getTrendsForProduct(productId: number): Promise<Trend[]> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(trends)
        .where(eq(trends.productId, productId))
        .orderBy(asc(trends.date));
        
      return result;
    } catch (error) {
      log(`Error getting trends for product: ${error}`, 'storage');
      return [];
    }
  }

  async createTrend(insertTrend: InsertTrend): Promise<Trend> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(trends).values(insertTrend).returning();
      return result[0];
    } catch (error) {
      log(`Error creating trend: ${error}`, 'storage');
      throw error;
    }
  }

  // Region methods
  async getRegionsForProduct(productId: number): Promise<Region[]> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(regions)
        .where(eq(regions.productId, productId))
        .orderBy(desc(regions.percentage));
        
      return result;
    } catch (error) {
      log(`Error getting regions for product: ${error}`, 'storage');
      return [];
    }
  }

  async createRegion(insertRegion: InsertRegion): Promise<Region> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(regions).values(insertRegion).returning();
      return result[0];
    } catch (error) {
      log(`Error creating region: ${error}`, 'storage');
      throw error;
    }
  }

  // Video methods
  async getVideosForProduct(productId: number): Promise<Video[]> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(videos)
        .where(eq(videos.productId, productId))
        .orderBy(desc(videos.views));
        
      return result;
    } catch (error) {
      log(`Error getting videos for product: ${error}`, 'storage');
      return [];
    }
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(videos).values(insertVideo).returning();
      return result[0];
    } catch (error) {
      log(`Error creating video: ${error}`, 'storage');
      throw error;
    }
  }

  // Dashboard
  async getDashboardSummary(): Promise<DashboardSummary> {
    try {
      const db = databaseService.getDb();
      
      // Get product count
      const productCount = await db.select({ count: sql`COUNT(*)` }).from(products);
      const trendingProductsCount = parseInt(productCount[0].count.toString());
      
      // Get average trend score
      const avgScoreResult = await db.select({ avg: sql`AVG(trend_score)` }).from(products);
      const averageTrendScore = Math.round(parseFloat(avgScoreResult[0].avg.toString()) * 10) / 10 || 0;
      
      // Get top region
      const regionsAgg = await db.select({
        country: regions.country,
        total: sql`SUM(percentage)` 
      })
      .from(regions)
      .groupBy(regions.country)
      .orderBy(desc(sql`SUM(percentage)`))
      .limit(1);
      
      const topRegion = regionsAgg.length > 0 ? regionsAgg[0].country : "";
      const topRegionPercentage = regionsAgg.length > 0 ? Math.round(parseInt(regionsAgg[0].total.toString()) / trendingProductsCount) : 0;
      
      // Get viral videos count (videos with >50k views)
      const viralVideosResult = await db.select({ count: sql`COUNT(*)` })
        .from(videos)
        .where(gte(videos.views, 50000));
        
      const viralVideosCount = parseInt(viralVideosResult[0].count.toString());
      
      // Get new videos from today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const newVideosResult = await db.select({ count: sql`COUNT(*)` })
        .from(videos)
        .where(gte(videos.uploadDate, today));
        
      const newVideosToday = parseInt(newVideosResult[0].count.toString());
      
      return {
        trendingProductsCount,
        averageTrendScore,
        topRegion,
        topRegionPercentage,
        viralVideosCount,
        newVideosToday
      };
    } catch (error) {
      log(`Error getting dashboard summary: ${error}`, 'storage');
      
      // Return default values in case of error
      return {
        trendingProductsCount: 0,
        averageTrendScore: 0,
        topRegion: "",
        topRegionPercentage: 0,
        viralVideosCount: 0,
        newVideosToday: 0
      };
    }
  }
}

// Export a singleton instance of the storage
export const storage = new DbStorage();
