import { pgTable, text, serial, integer, boolean, timestamp, json, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table (kept from original schema)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Product table with full dropshipping supply chain fields
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // Added unique constraint for ON CONFLICT
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  description: text("description"),
  priceRangeLow: real("price_range_low").notNull(),
  priceRangeHigh: real("price_range_high").notNull(),
  trendScore: integer("trend_score").notNull(),
  engagementRate: integer("engagement_rate").notNull(),
  salesVelocity: integer("sales_velocity").notNull(),
  searchVolume: integer("search_volume").notNull(),
  geographicSpread: integer("geographic_spread").notNull(),
  aliexpressUrl: text("aliexpress_url"),
  cjdropshippingUrl: text("cjdropshipping_url"),
  imageUrl: text("image_url"),
  sourcePlatform: text("source_platform"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Trend metrics table
export const trends = pgTable("trends", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  date: timestamp("date").notNull(),
  engagementValue: integer("engagement_value").notNull(),
  salesValue: integer("sales_value").notNull(),
  searchValue: integer("search_value").notNull(),
});

export const insertTrendSchema = createInsertSchema(trends).omit({
  id: true,
});

export type InsertTrend = z.infer<typeof insertTrendSchema>;
export type Trend = typeof trends.$inferSelect;

// Region table for geographic trends
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  country: text("country").notNull(),
  percentage: integer("percentage").notNull(),
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true,
});

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Marketing Video table
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").notNull(),
  title: text("title").notNull(),
  platform: text("platform").notNull(),
  views: integer("views").notNull(),
  uploadDate: timestamp("upload_date").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  videoUrl: text("video_url").notNull(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
});

export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Video = typeof videos.$inferSelect;

// API Schemas for Frontend
export const productFilterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  priceRange: z.tuple([z.number(), z.number()]).optional(),
  trendScore: z.tuple([z.number(), z.number()]).optional(),
  engagementRate: z.tuple([z.number(), z.number()]).optional(),
  salesVelocity: z.tuple([z.number(), z.number()]).optional(),
  searchVolume: z.tuple([z.number(), z.number()]).optional(),
  geographicSpread: z.tuple([z.number(), z.number()]).optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
  sortBy: z.string().optional(),
  sortDirection: z.enum(['asc', 'desc']).optional(),
  createdAfter: z.date().optional(),
  createdBefore: z.date().optional(),
});

export type ProductFilter = z.infer<typeof productFilterSchema>;

export const productWithDetails = z.object({
  product: z.any(),
  trends: z.array(z.any()).optional(),
  regions: z.array(z.any()).optional(),
  videos: z.array(z.any()).optional(),
});

export type ProductWithDetails = z.infer<typeof productWithDetails>;

// Dashboard summary type
export const dashboardSummarySchema = z.object({
  // Basic metrics
  trendingProductsCount: z.number(),
  averageTrendScore: z.number(),
  topRegion: z.string(),
  topRegionPercentage: z.number(),
  viralVideosCount: z.number(),
  newVideosToday: z.number(),
  
  // Products data
  productCount: z.number(),
  newProductCount: z.number(),
  topProducts: z.array(z.any()),
  recentProducts: z.array(z.any()),
  
  // Trend metrics
  averagePrice: z.number(),
  priceChange: z.number(),
  trendScoreChange: z.number(),
  
  // Category analysis
  topCategories: z.array(z.object({
    name: z.string(),
    count: z.number(),
    percentage: z.number()
  })),
  
  // Geographic data
  regionCount: z.number(),
  countryCount: z.number(),
  topRegions: z.array(z.object({
    regionName: z.string(),
    count: z.number(),
    percentage: z.number()
  })),
  
  // Video metrics
  topVideos: z.array(z.object({
    id: z.number(),
    title: z.string(),
    platform: z.string(),
    views: z.number(),
    productId: z.number(),
    productName: z.string().optional(),
    thumbnailUrl: z.string().optional(),
  })),
  platformDistribution: z.array(z.object({
    platform: z.string(),
    count: z.number(),
    percentage: z.number()
  })),
  
  // Time series data
  trendTimeline: z.array(z.object({
    date: z.string(),
    avgTrendScore: z.number(),
    newProducts: z.number()
  })).optional(),
  
  // Performance indicators
  salesVelocityDistribution: z.array(z.object({
    range: z.string(),
    count: z.number(),
    percentage: z.number()
  })).optional(),
  
  // Market analysis
  marketOpportunities: z.array(z.object({
    category: z.string(),
    growthRate: z.number(),
    competitionLevel: z.string(),
    potentialScore: z.number()
  })).optional()
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
