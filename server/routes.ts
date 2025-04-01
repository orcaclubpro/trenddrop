import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { productFilterSchema } from "@shared/schema.js";
import { ProductService } from "./services/product-service.js";
import { TrendService } from "./services/trend-service.js";
import { VideoService } from "./services/video-service.js";
import { log } from "./vite.js";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  const productService = new ProductService(storage);
  const trendService = new TrendService(storage);
  const videoService = new VideoService(storage);

  log("Registering API routes", "routes");

  // Dashboard summary endpoint
  app.get("/api/dashboard", async (req, res) => {
    try {
      const summary = await storage.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      console.error("Failed to get dashboard summary:", error);
      res.status(500).json({ message: "Failed to get dashboard summary" });
    }
  });

  // Get products with filtering
  app.get("/api/products", async (req, res) => {
    try {
      const filterParams = {
        trendScore: req.query.trendScore ? parseInt(req.query.trendScore as string) : undefined,
        category: req.query.category as string || undefined,
        region: req.query.region as string || undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const parseResult = productFilterSchema.safeParse(filterParams);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid filter parameters" });
      }

      const { products, total } = await storage.getProducts(parseResult.data);
      
      res.json({
        products,
        total,
        page: parseResult.data.page,
        limit: parseResult.data.limit,
        totalPages: Math.ceil(total / parseResult.data.limit)
      });
    } catch (error) {
      console.error("Failed to get products:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  });

  // Get single product with details
  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }

      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Get related data for the product
      const [trends, regions, videos] = await Promise.all([
        storage.getTrendsForProduct(productId),
        storage.getRegionsForProduct(productId),
        storage.getVideosForProduct(productId)
      ]);
      
      res.json({
        product,
        trends,
        regions,
        videos
      });
    } catch (error) {
      console.error(`Failed to get product ${req.params.id}:`, error);
      res.status(500).json({ message: `Failed to get product ${req.params.id}` });
    }
  });

  // Get categories
  app.get("/api/categories", async (req, res) => {
    try {
      const allProducts = await storage.getProducts({
        page: 1,
        limit: 1000 // Get all products for category extraction
      });
      
      // Get unique categories
      const categories = [...new Set(allProducts.products.map(p => p.category))];
      res.json(categories);
    } catch (error) {
      console.error("Failed to get categories:", error);
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  // Get regions
  app.get("/api/regions", async (req, res) => {
    try {
      const allProducts = await storage.getProducts({
        page: 1,
        limit: 100 // Get a reasonable number of products
      });
      
      // Get unique regions from all products
      const regionPromises = allProducts.products.map(product => 
        storage.getRegionsForProduct(product.id)
      );
      
      const allRegions = await Promise.all(regionPromises);
      const flatRegions = allRegions.flat();
      const uniqueRegions = [...new Set(flatRegions.map(r => r.country))];
      
      res.json(uniqueRegions);
    } catch (error) {
      console.error("Failed to get regions:", error);
      res.status(500).json({ message: "Failed to get regions" });
    }
  });

  // Export products as CSV
  app.get("/api/export", async (req, res) => {
    try {
      const filterParams = {
        trendScore: req.query.trendScore ? parseInt(req.query.trendScore as string) : undefined,
        category: req.query.category as string || undefined,
        region: req.query.region as string || undefined,
        page: 1,
        limit: 1000 // Export all filtered results
      };

      const parseResult = productFilterSchema.safeParse(filterParams);
      
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid filter parameters" });
      }

      const { products } = await storage.getProducts(parseResult.data);
      
      // Generate CSV
      const headers = [
        "ID", "Name", "Category", "Subcategory", 
        "Price Range", "Trend Score", "Engagement Rate", 
        "Sales Velocity", "Search Volume", "Geographic Spread", "Supplier URL"
      ];
      
      const rows = products.map(p => [
        p.id,
        `"${p.name}"`, // Wrap in quotes to handle commas in names
        p.category,
        p.subcategory || "",
        `$${p.priceRangeLow.toFixed(2)} - $${p.priceRangeHigh.toFixed(2)}`,
        p.trendScore,
        p.engagementRate,
        p.salesVelocity,
        p.searchVolume,
        p.geographicSpread,
        p.supplierUrl || ""
      ]);
      
      const csv = [
        headers.join(','),
        ...rows.map(r => r.join(','))
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=trending-products.csv');
      res.send(csv);
    } catch (error) {
      console.error("Failed to export products:", error);
      res.status(500).json({ message: "Failed to export products" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
