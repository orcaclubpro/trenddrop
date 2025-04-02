import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@shared/schema.js';
import path from 'path';
import fs from 'fs';
import { sql, eq, desc } from 'drizzle-orm';
import { products, trends, regions, videos } from '@shared/schema.js';

// Database connection settings
const RECONNECT_INTERVAL = 60 * 1000; // 1 minute 
const MAX_RETRIES = 10;
const RETRY_DELAY = 10 * 60 * 1000; // 10 minutes in milliseconds

// Database state
let db: ReturnType<typeof drizzle> | null = null;
let databaseInitialized = false;
let databaseConnecting = false;
let lastConnectionAttempt = 0;
let connectionRetries = 0; // Track connection retry attempts

// Export the database instance
export { db };

// Check if tables exist
async function checkTablesExist(db: ReturnType<typeof drizzle>): Promise<boolean> {
  try {
    console.log('[Database] Checking if tables exist...');
    
    // Try to query the products table
    const result = await db.select({ count: sql`count(*)` }).from(products);
    
    // If we got here, the tables exist
    return true;
  } catch (error) {
    // If there's an error, most likely the tables don't exist yet
    return false;
  }
}

// Seed database with sample data
async function seedDatabase(db: ReturnType<typeof drizzle>): Promise<void> {
  console.log('[Database] Database is empty, seeding with test data...');
  
  try {
    // Insert sample products
    console.log('[Database] Inserting sample products...');
    
    // Sample categories
    const categories = ['Tech', 'Home', 'Fashion', 'Beauty', 'Fitness'];
    const subcategories = {
      'Tech': ['Gadgets', 'Electronics', 'Accessories'],
      'Home': ['Kitchen', 'Decor', 'Furniture'],
      'Fashion': ['Clothing', 'Accessories', 'Shoes'],
      'Beauty': ['Skincare', 'Makeup', 'Hair'],
      'Fitness': ['Equipment', 'Apparel', 'Supplements']
    };
    
    // Insert 5 sample products
    for (let i = 0; i < 5; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const subcategoryOptions = subcategories[category as keyof typeof subcategories];
      const subcategory = subcategoryOptions[Math.floor(Math.random() * subcategoryOptions.length)];
      
      const trendScore = 60 + Math.floor(Math.random() * 40); // 60-99
      const engagementRate = Math.floor(trendScore * 0.9);
      const salesVelocity = Math.floor(trendScore * 0.7);
      const searchVolume = Math.floor(trendScore * 0.8);
      
      const productResult = await db.insert(products).values({
        name: `Sample ${category} Product ${i + 1}`,
        category,
        subcategory,
        description: `A premium ${category} product that's trending in the market.`,
        priceRangeLow: 19.99 + (i * 5),
        priceRangeHigh: 49.99 + (i * 10),
        trendScore,
        engagementRate,
        salesVelocity,
        searchVolume,
        geographicSpread: Math.floor(Math.random() * 10) + 1,
        aliexpressUrl: `https://aliexpress.com/item/${i + 1}`,
        cjdropshippingUrl: `https://cjdropshipping.com/product/${i + 1}`,
        imageUrl: `https://picsum.photos/seed/${i + 1}/400/400`,
        sourcePlatform: Math.random() > 0.5 ? 'AliExpress' : 'CJ Dropshipping'
      }).returning();
      
      const productId = productResult[0].id;
      
      // Insert trend data
      const today = new Date();
      for (let day = 0; day < 30; day++) {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - day));
        
        // Growing trend over time
        const dayFactor = day / 29; // 0 to 1
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
        
        await db.insert(trends).values({
          productId,
          date,
          engagementValue: Math.floor((10 + (day * 2)) * randomFactor),
          salesValue: Math.floor((5 + day) * randomFactor),
          searchValue: Math.floor((8 + (day * 1.5)) * randomFactor)
        });
      }
      
      // Insert region data
      const allRegions = ['USA', 'UK', 'Canada', 'Germany', 'France', 'Australia', 'Japan'];
      const numRegions = Math.floor(Math.random() * 3) + 2; // 2-4 regions
      const productRegions = [...allRegions].sort(() => 0.5 - Math.random()).slice(0, numRegions);
      
      let remainingPercentage = 100;
      for (let j = 0; j < productRegions.length - 1; j++) {
        const percentage = Math.floor(Math.random() * (remainingPercentage - 10)) + 5;
        remainingPercentage -= percentage;
        
        await db.insert(regions).values({
          productId,
          country: productRegions[j],
          percentage
        });
      }
      
      // Last region gets remaining percentage
      await db.insert(regions).values({
        productId,
        country: productRegions[productRegions.length - 1],
        percentage: remainingPercentage
      });
      
      // Insert video data
      const platforms = ['YouTube', 'TikTok', 'Instagram'];
      const numVideos = Math.floor(Math.random() * 2) + 1; // 1-2 videos
      
      for (let j = 0; j < numVideos; j++) {
        const platform = platforms[Math.floor(Math.random() * platforms.length)];
        const uploadDate = new Date();
        uploadDate.setDate(uploadDate.getDate() - Math.floor(Math.random() * 30));
        
        await db.insert(videos).values({
          productId,
          title: `Amazing ${category} Product Review | ${platform} Trending`,
          platform,
          views: Math.floor(Math.random() * 500000) + 10000,
          uploadDate,
          thumbnailUrl: `https://picsum.photos/seed/${productId}${j}/400/300`,
          videoUrl: `https://example.com/${platform.toLowerCase()}/video/${productId}${j}`
        });
      }
    }
    
    console.log('[Database] Successfully seeded with sample data');
  } catch (error) {
    console.error('[Database] Error seeding database:', error);
    throw error;
  }
}

// Function to ensure database table schema is up to date
async function updateTableSchema(db: ReturnType<typeof drizzle>): Promise<boolean> {
  try {
    console.log('[Database] Checking and updating schema if needed...');

    // Add a unique constraint to the products table for the name column
    await db.execute(sql`
      DO $$
      BEGIN
        -- Check if the unique constraint exists
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'products_name_key'
        ) THEN
          -- Add unique constraint if it doesn't exist
          ALTER TABLE products
          ADD CONSTRAINT products_name_key UNIQUE (name);
        END IF;

        -- Add new columns if they don't exist
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'description'
        ) THEN
          ALTER TABLE products ADD COLUMN description TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'aliexpress_url'
        ) THEN
          ALTER TABLE products ADD COLUMN aliexpress_url TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'cjdropshipping_url'
        ) THEN
          ALTER TABLE products ADD COLUMN cjdropshipping_url TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'image_url'
        ) THEN
          ALTER TABLE products ADD COLUMN image_url TEXT;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'source_platform'
        ) THEN
          ALTER TABLE products ADD COLUMN source_platform TEXT;
        END IF;

        -- Remove old supplier_url column if it exists and the new columns are present
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'supplier_url'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'aliexpress_url'
        ) AND EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'products' AND column_name = 'cjdropshipping_url'
        ) THEN
          -- Move data from supplier_url to aliexpress_url if aliexpress_url is null
          UPDATE products
          SET aliexpress_url = supplier_url
          WHERE aliexpress_url IS NULL AND supplier_url IS NOT NULL;

          -- Now it's safe to drop the column
          ALTER TABLE products DROP COLUMN IF EXISTS supplier_url;
        END IF;
      END
      $$;
    `);

    console.log('[Database] Table schema updated successfully');
    return true;
  } catch (error) {
    console.error('[Database] Error updating schema:', error);
    return false;
  }
}

// Initialize database function
export async function initializeDatabase(): Promise<boolean> {
  // Don't retry connection too frequently
  const now = Date.now();
  if (databaseConnecting || (now - lastConnectionAttempt < RECONNECT_INTERVAL && lastConnectionAttempt !== 0)) {
    console.log('[Database] Connection attempt already in progress or too recent');
    return databaseInitialized;
  }

  databaseConnecting = true;
  lastConnectionAttempt = now;
  
  try {
    // Increment retry counter
    connectionRetries++;
    
    console.log(`[Database] Initializing database (attempt ${connectionRetries} of ${MAX_RETRIES})...`);
    
    // Show retry notice if this is a retry attempt
    if (connectionRetries > 1) {
      console.log(`[Database] Retrying connection after previous failure. Will retry ${MAX_RETRIES - connectionRetries} more times if needed.`);
      
      // Broadcast retry status to WebSocket clients if available
      if ((global as any).wsClients) {
        const retryMessage = JSON.stringify({
          type: 'database_status',
          status: 'retrying',
          attempt: connectionRetries,
          maxRetries: MAX_RETRIES,
          timestamp: new Date().toISOString(),
          message: `Retrying database connection (attempt ${connectionRetries}/${MAX_RETRIES})`,
          nextRetryIn: connectionRetries < MAX_RETRIES ? RETRY_DELAY / 1000 : null
        });
        
        ((global as any).wsClients as Set<WebSocket>).forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(retryMessage);
          }
        });
      }
    }
    
    // Try local database first if DATABASE_URL environment variable is not set
    if (!process.env.DATABASE_URL) {
      console.log('[Database] No DATABASE_URL environment variable found, using local SQLite database');
      process.env.DATABASE_URL = 'file:./data/trenddrop.db';
    }
    
    // Create SQL client based on the URL or USE_SQLITE flag
    let client;
    if (process.env.USE_SQLITE === 'true' || (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:'))) {
      // Local SQLite database
      console.log('[Database] Using SQLite database');
      const SQLite = (await import('better-sqlite3')).default;
      const dbPath = process.env.DATABASE_URL?.replace('file:', '') || './data/trenddrop.db';
      
      // Ensure directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      client = new SQLite(dbPath);
      const sqliteDb = drizzle(client);
      db = sqliteDb;
    } else {
      // PostgreSQL database - use postgres.js
      console.log('[Database] Using PostgreSQL database:', process.env.DATABASE_URL);
      client = postgres(process.env.DATABASE_URL, { 
        max: 10, // Maximum pool size
        idle_timeout: 20, // Timeout after 20 seconds of inactivity
        prepare: false, // Don't prepare statements (can cause issues with some admin tasks)
        connect_timeout: 10, // 10 second connection timeout
      });
      db = drizzle(client, { schema });
    }
    
    // Test connection
    console.log('[Database] Testing connection...');
    await db.execute(sql`SELECT 1`);
    
    // Connection successful, reset retry counter
    connectionRetries = 0;
    
    // Check if tables exist, if not create them
    const tablesExist = await checkTablesExist(db);
    
    if (!tablesExist) {
      console.log('[Database] Tables do not exist, creating schema...');
      
      // For PostgreSQL: create all tables
      if (!process.env.DATABASE_URL.startsWith('file:')) {
        // Create tables using SQL directly
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            subcategory TEXT,
            description TEXT,
            price_range_low REAL NOT NULL,
            price_range_high REAL NOT NULL,
            trend_score INTEGER NOT NULL,
            engagement_rate INTEGER NOT NULL,
            sales_velocity INTEGER NOT NULL,
            search_volume INTEGER NOT NULL,
            geographic_spread INTEGER NOT NULL,
            aliexpress_url TEXT,
            cjdropshipping_url TEXT,
            image_url TEXT,
            source_platform TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          );
          
          CREATE TABLE IF NOT EXISTS trends (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL,
            date TIMESTAMP NOT NULL,
            engagement_value INTEGER NOT NULL,
            sales_value INTEGER NOT NULL,
            search_value INTEGER NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS regions (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL,
            country TEXT NOT NULL,
            percentage INTEGER NOT NULL
          );
          
          CREATE TABLE IF NOT EXISTS videos (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            platform TEXT NOT NULL,
            views INTEGER NOT NULL,
            upload_date TIMESTAMP NOT NULL,
            thumbnail_url TEXT NOT NULL,
            video_url TEXT NOT NULL
          );
        `);
        
        // Seed the database with initial data
        await seedDatabase(db);
        console.log('[Database] Database seeded successfully');
      }
    } else {
      // Tables exist - check and update schema if needed
      if (!process.env.DATABASE_URL.startsWith('file:')) {
        await updateTableSchema(db);
      }
    }
    
    databaseInitialized = true;
    console.log('[Database] Database initialization completed successfully');
    
    // Broadcast success to WebSocket clients if available
    if ((global as any).wsClients) {
      const successMessage = JSON.stringify({
        type: 'database_status',
        status: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Database connected and initialized successfully'
      });
      
      ((global as any).wsClients as Set<WebSocket>).forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(successMessage);
        }
      });
    }
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    db = null;
    databaseInitialized = false;
    
    // Set up a retry if we haven't reached the maximum
    if (connectionRetries < MAX_RETRIES) {
      const retryDelayMs = RETRY_DELAY;
      console.log(`[Database] Will retry in ${retryDelayMs / 1000 / 60} minutes (attempt ${connectionRetries} of ${MAX_RETRIES})`);
      
      // Schedule the next retry
      setTimeout(() => {
        console.log('[Database] Retry timeout elapsed, attempting reconnection...');
        initializeDatabase();
      }, retryDelayMs);
      
      // Broadcast retry info to WebSocket clients if available
      if ((global as any).wsClients) {
        const retryMessage = JSON.stringify({
          type: 'database_status',
          status: 'retry_scheduled',
          attempt: connectionRetries,
          maxRetries: MAX_RETRIES,
          timestamp: new Date().toISOString(),
          message: `Database connection failed, will retry in ${retryDelayMs / 1000 / 60} minutes`,
          error: String(error),
          nextRetryIn: retryDelayMs / 1000
        });
        
        ((global as any).wsClients as Set<WebSocket>).forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(retryMessage);
          }
        });
      }
    } else {
      console.error(`[Database] Maximum retry attempts (${MAX_RETRIES}) reached. Giving up.`);
      
      // Broadcast failure to WebSocket clients if available
      if ((global as any).wsClients) {
        const failureMessage = JSON.stringify({
          type: 'database_status',
          status: 'failed',
          timestamp: new Date().toISOString(),
          message: `Database connection failed after ${MAX_RETRIES} attempts`,
          error: String(error)
        });
        
        ((global as any).wsClients as Set<WebSocket>).forEach(client => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(failureMessage);
          }
        });
      }
    }
  } finally {
    databaseConnecting = false;
  }
  
  return databaseInitialized;
}
