import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { products, trends, regions, videos } from '../shared/schema.js';
import { sql } from 'drizzle-orm';

// For testing purposes
const setupTestData = async () => {
  // Connect to the database
  const db = drizzle(neon(process.env.DATABASE_URL || ''));

  try {
    // Create dummy products data for testing purposes
    const dummyProducts = [
      {
        name: 'Magnetic Phone Mount',
        category: 'Electronics',
        subcategory: 'Phone Accessories',
        priceRangeLow: 12.99,
        priceRangeHigh: 29.99,
        trendScore: 87,
        engagementRate: 85,
        salesVelocity: 78,
        searchVolume: 92,
        geographicSpread: 75,
        imageUrl: 'https://picsum.photos/id/1/500/500',
        description: 'Trending magnetic phone mount with 360-degree rotation.',
        sourcePlatform: 'TikTok',
        aliexpressUrl: 'https://www.aliexpress.com/wholesale?SearchText=magnetic+phone+mount',
        cjdropshippingUrl: 'https://cjdropshipping.com/search?q=magnetic+phone+mount'
      },
      {
        name: 'Smart LED Strip',
        category: 'Home & Kitchen',
        subcategory: 'Smart Home',
        priceRangeLow: 14.99,
        priceRangeHigh: 39.99,
        trendScore: 92,
        engagementRate: 88,
        salesVelocity: 92,
        searchVolume: 86,
        geographicSpread: 68,
        imageUrl: 'https://picsum.photos/id/10/500/500',
        description: 'WiFi-enabled LED strip with app control and voice assistant compatibility.',
        sourcePlatform: 'Instagram',
        aliexpressUrl: 'https://www.aliexpress.com/wholesale?SearchText=smart+led+strip',
        cjdropshippingUrl: 'https://cjdropshipping.com/search?q=smart+led+strip'
      },
      {
        name: 'Pet Hair Remover Brush',
        category: 'Pet Supplies',
        subcategory: 'Grooming',
        priceRangeLow: 9.99,
        priceRangeHigh: 24.99,
        trendScore: 81,
        engagementRate: 77,
        salesVelocity: 85,
        searchVolume: 78,
        geographicSpread: 72,
        imageUrl: 'https://picsum.photos/id/20/500/500',
        description: 'Self-cleaning pet hair remover brush for furniture and clothing.',
        sourcePlatform: 'TikTok',
        aliexpressUrl: 'https://www.aliexpress.com/wholesale?SearchText=pet+hair+remover+brush',
        cjdropshippingUrl: 'https://cjdropshipping.com/search?q=pet+hair+remover+brush'
      }
    ];
    
    for (const product of dummyProducts) {
      // Insert the product
      const insertedProduct = await db.insert(products).values(product).returning();
      
      if (insertedProduct.length === 0) continue;
      
      const productId = insertedProduct[0].id;
      
      // Create regions for the product
      const regionData = [
        { productId, country: 'United States', percentage: 45 },
        { productId, country: 'United Kingdom', percentage: 20 },
        { productId, country: 'Canada', percentage: 15 },
        { productId, country: 'Australia', percentage: 10 },
        { productId, country: 'Germany', percentage: 10 }
      ];
      
      await db.insert(regions).values(regionData);
      
      // Create videos for the product
      const videoData = [
        {
          productId,
          title: `Amazing ${product.name} Review`,
          platform: product.sourcePlatform,
          views: Math.floor(Math.random() * 1000000) + 10000,
          uploadDate: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          thumbnailUrl: `https://picsum.photos/id/${Math.floor(Math.random() * 100)}/320/180`,
          videoUrl: `https://www.${product.sourcePlatform.toLowerCase()}.com/video/${Math.random().toString(36).substring(2, 15)}`
        }
      ];
      
      await db.insert(videos).values(videoData);
      
      // Create trend data for the product (7 days)
      const now = new Date();
      const trendData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Create an upward trend
        const growth = 1 + (6 - i) * 0.1; // Increases from day 1 to 7
        
        trendData.push({
          productId,
          date,
          engagementValue: Math.floor(product.engagementRate * growth * (0.8 + Math.random() * 0.4)),
          salesValue: Math.floor(product.salesVelocity * growth * (0.8 + Math.random() * 0.4)),
          searchValue: Math.floor(product.searchVolume * growth * (0.8 + Math.random() * 0.4))
        });
      }
      
      await db.insert(trends).values(trendData);
    }
    
    console.log('✅ Test data created successfully');
  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
};

setupTestData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
  });