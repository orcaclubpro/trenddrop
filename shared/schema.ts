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

// Product table with supplier URL
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  priceRangeLow: real("price_range_low").notNull(),
  priceRangeHigh: real("price_range_high").notNull(),
  trendScore: integer("trend_score").notNull(),
  engagementRate: integer("engagement_rate").notNull(),
  salesVelocity: integer("sales_velocity").notNull(),
  searchVolume: integer("search_volume").notNull(),
  geographicSpread: integer("geographic_spread").notNull(),
  supplierUrl: text("supplier_url"), // Added supplier URL field
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
  trendScore: z.number().optional(),
  category: z.string().optional(),
  region: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(10),
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
  trendingProductsCount: z.number(),
  averageTrendScore: z.number(),
  topRegion: z.string(),
  topRegionPercentage: z.number(),
  viralVideosCount: z.number(),
  newVideosToday: z.number(),
});

export type DashboardSummary = z.infer<typeof dashboardSummarySchema>;
