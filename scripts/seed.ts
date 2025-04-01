/**
 * This script seeds the database with initial data for development and testing.
 */

import { log } from '../server/vite';
import databaseService from '../server/services/database-service';
import { storage } from '../server/storage';
import { InsertProduct, InsertTrend, InsertRegion, InsertVideo } from '@shared/schema';

async function seed() {
  log('Starting database seeding...', 'seed');
  
  try {
    // Initialize database
    log('Initializing database...', 'seed');
    const initialized = await databaseService.initialize();
    
    if (!initialized) {
      log('Failed to initialize database. Exiting seed script.', 'seed');
      process.exit(1);
    }
    
    log('Database initialized successfully', 'seed');
    
    // Sample products to seed
    const products: InsertProduct[] = [
      {
        name: "Ultra Smart Coffee Maker 201",
        category: "Home",
        subcategory: "Kitchenware",
        priceRangeLow: 29.99,
        priceRangeHigh: 49.99,
        trendScore: 85,
        engagementRate: 42,
        salesVelocity: 25,
        searchVolume: 18,
        geographicSpread: 7,
        supplierUrl: "https://www.aliexpress.com/item/1005005832171462.html"
      },
      {
        name: "Portable LED Plant Grow Light 103",
        category: "Home",
        subcategory: "Decor",
        priceRangeLow: 15.99,
        priceRangeHigh: 35.99,
        trendScore: 92,
        engagementRate: 47,
        salesVelocity: 28,
        searchVolume: 17,
        geographicSpread: 8,
        supplierUrl: "https://www.aliexpress.com/item/1005005832171463.html"
      },
      {
        name: "Smart Fitness Water Bottle 504",
        category: "Fitness",
        subcategory: "Accessories",
        priceRangeLow: 19.99,
        priceRangeHigh: 39.99,
        trendScore: 78,
        engagementRate: 35,
        salesVelocity: 22,
        searchVolume: 16,
        geographicSpread: 5,
        supplierUrl: "https://www.aliexpress.com/item/1005005832171464.html"
      },
      {
        name: "Wireless LED Photo Clip String 301",
        category: "Decor",
        subcategory: "Lighting",
        priceRangeLow: 12.99,
        priceRangeHigh: 24.99,
        trendScore: 81,
        engagementRate: 38,
        salesVelocity: 24,
        searchVolume: 15,
        geographicSpread: 6,
        supplierUrl: "https://www.aliexpress.com/item/1005005832171465.html"
      },
      {
        name: "Compact HD Mini Projector 640",
        category: "Tech",
        subcategory: "Electronics",
        priceRangeLow: 89.99,
        priceRangeHigh: 129.99,
        trendScore: 89,
        engagementRate: 45,
        salesVelocity: 26,
        searchVolume: 19,
        geographicSpread: 7,
        supplierUrl: "https://www.aliexpress.com/item/1005005832171466.html"
      }
    ];
    
    // Create each product and its related data
    for (const productData of products) {
      try {
        // Insert product
        log(`Creating product: ${productData.name}`, 'seed');
        const product = await storage.createProduct(productData);
        const productId = product.id;
        
        // Create trend data (30 days)
        log(`Creating trend data for product: ${productData.name}`, 'seed');
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          
          // Generate trend data with an upward trend
          const dayFactor = (30 - i) / 30; // 0 to 1 scale
          const randomization = Math.random() * 0.2 + 0.9; // 0.9 to 1.1
          
          const engagementBase = 10 + (i * 2.5);
          const salesBase = 5 + (i * 1.2);
          const searchBase = 3 + (i * 0.8);
          
          const trend: InsertTrend = {
            productId,
            date,
            engagementValue: Math.floor(engagementBase * dayFactor * randomization),
            salesValue: Math.floor(salesBase * dayFactor * randomization),
            searchValue: Math.floor(searchBase * dayFactor * randomization)
          };
          
          await storage.createTrend(trend);
        }
        
        // Create region data
        log(`Creating region data for product: ${productData.name}`, 'seed');
        const regions: [string, number][] = productId % 2 === 0 ? 
          [["USA", 45], ["Germany", 30], ["Japan", 15], ["Canada", 10]] :
          [["Canada", 35], ["UK", 25], ["Australia", 20], ["Brazil", 20]];
        
        for (const [country, percentage] of regions) {
          const region: InsertRegion = {
            productId,
            country,
            percentage
          };
          
          await storage.createRegion(region);
        }
        
        // Create video data
        log(`Creating video data for product: ${productData.name}`, 'seed');
        const platforms = ["TikTok", "Instagram", "YouTube"];
        
        for (let i = 0; i < 3; i++) {
          const uploadDate = new Date(today);
          uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 10));
          
          const platform = platforms[i % platforms.length];
          const views = Math.floor(100000 + Math.random() * 900000);
          
          const video: InsertVideo = {
            productId,
            title: `Amazing ${productData.name} Demo`,
            platform,
            views,
            uploadDate,
            thumbnailUrl: `https://picsum.photos/seed/${productId * 10 + i}/400/225`,
            videoUrl: `https://example.com/video/${productId * 10 + i}`
          };
          
          await storage.createVideo(video);
        }
        
        log(`Successfully seeded data for product: ${productData.name}`, 'seed');
      } catch (error) {
        log(`Error seeding data for product ${productData.name}: ${error}`, 'seed');
      }
    }
    
    log('Database seeding completed successfully!', 'seed');
  } catch (error) {
    log(`Error during database seeding: ${error}`, 'seed');
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    log(`Unhandled error in seed script: ${error}`, 'seed');
    process.exit(1);
  });
