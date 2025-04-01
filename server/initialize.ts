/**
 * Database initialization and verification script
 * 
 * This script:
 * 1. Verifies the database connection
 * 2. Creates necessary tables if they don't exist
 * 3. Seeds the database with sample data if it's empty
 * 4. Schedules periodic reconnection attempts if database connection fails
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { products, trends, regions, videos } from '../shared/schema.js';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema.js';

// Database connection state
let databaseInitialized = false;
let databaseConnecting = false;
let lastConnectionAttempt = 0;
const RECONNECT_INTERVAL = 10 * 60 * 1000; // 10 minutes

// Export database instance that will be populated after successful connection
export let db: ReturnType<typeof drizzle> | null = null;

/**
 * Initialize the database
 * @returns Promise that resolves to true if initialization is successful
 */
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
    console.log('[Database] Attempting to connect to database...');
    
    // Check if DATABASE_URL environment variable is set
    if (!process.env.DATABASE_URL) {
      console.error('[Database] No DATABASE_URL environment variable found');
      databaseConnecting = false;
      return false;
    }
    
    // Create Neon PostgreSQL client
    const sql = neon(process.env.DATABASE_URL);
    
    // Create Drizzle ORM instance with query capabilities
    db = drizzle(sql, { schema });
    
    // Test connection
    console.log('[Database] Testing connection...');
    await sql`SELECT 1`;
    
    // Check if database has been initialized already
    console.log('[Database] Checking if tables exist...');
    const tableExists = await checkIfTablesExist();
    
    if (!tableExists) {
      console.log('[Database] Tables do not exist, creating schema...');
      try {
        await createSchema();
        console.log('[Database] Schema created successfully');
      } catch (error) {
        console.error('[Database] Error creating schema:', error);
        databaseConnecting = false;
        return false;
      }
    }
    
    // Check if database needs seeding (no products in it)
    const productsCount = await sql`SELECT COUNT(*) FROM products`;
    if (productsCount[0]?.count === '0' || !productsCount[0]?.count) {
      console.log('[Database] Database is empty, seeding with test data...');
      try {
        await seedDatabase();
        console.log('[Database] Database seeded successfully');
      } catch (error) {
        console.error('[Database] Error seeding database:', error);
        // Continue anyway since this is not critical
      }
    } else {
      console.log(`[Database] Database already contains ${productsCount[0]?.count} products`);
    }
    
    databaseInitialized = true;
    console.log('[Database] Database initialization completed successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    db = null;
    databaseInitialized = false;
    
    // Schedule another attempt
    console.log(`[Database] Will retry connection in ${RECONNECT_INTERVAL / 60000} minutes`);
  } finally {
    databaseConnecting = false;
  }
  
  return databaseInitialized;
}

/**
 * Check if database tables exist
 */
async function checkIfTablesExist(): Promise<boolean> {
  if (!db) return false;
  
  try {
    // Check if products table exists by querying it
    await sql`SELECT 1 FROM products LIMIT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create database schema
 */
async function createSchema(): Promise<void> {
  if (!db) throw new Error('Database not initialized');
  
  // This is a simple version - in a production app we would use Drizzle's
  // schema migration tools, but for this example we'll just create the tables directly

  // Create products table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT,
      price_range_low REAL NOT NULL,
      price_range_high REAL NOT NULL,
      trend_score INTEGER NOT NULL,
      engagement_rate INTEGER NOT NULL,
      sales_velocity INTEGER NOT NULL,
      search_volume INTEGER NOT NULL,
      geographic_spread INTEGER NOT NULL,
      image_url TEXT,
      description TEXT,
      source_platform TEXT,
      aliexpress_url TEXT,
      cjdropshipping_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create trends table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS trends (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      date TIMESTAMP WITH TIME ZONE NOT NULL,
      engagement_value INTEGER NOT NULL,
      sales_value INTEGER NOT NULL,
      search_value INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create regions table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS regions (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      country TEXT NOT NULL,
      percentage INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create videos table
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      platform TEXT NOT NULL,
      views INTEGER NOT NULL,
      upload_date TIMESTAMP WITH TIME ZONE NOT NULL,
      thumbnail_url TEXT,
      video_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

/**
 * Seed database with sample data
 */
async function seedDatabase(): Promise<void> {
  // Create dummy products data for testing purposes
  console.log('[Database] Inserting sample products...');
  
  // Product 1: Magnetic Phone Mount
  const product1Result = await sql`
    INSERT INTO products (
      name, category, subcategory, price_range_low, price_range_high, 
      trend_score, engagement_rate, sales_velocity, search_volume, geographic_spread,
      image_url, description, source_platform, aliexpress_url, cjdropshipping_url
    ) 
    VALUES (
      'Magnetic Phone Mount', 'Electronics', 'Phone Accessories', 12.99, 29.99,
      87, 85, 78, 92, 75,
      'https://picsum.photos/id/1/500/500', 
      'Trending magnetic phone mount with 360-degree rotation.',
      'TikTok',
      'https://www.aliexpress.com/wholesale?SearchText=magnetic+phone+mount',
      'https://cjdropshipping.com/search?q=magnetic+phone+mount'
    )
    RETURNING id
  `;
  
  const product1Id = product1Result[0]?.id;
  if (product1Id) {
    // Add regions for product 1
    await sql`
      INSERT INTO regions (product_id, country, percentage)
      VALUES 
        (${product1Id}, 'United States', 45),
        (${product1Id}, 'United Kingdom', 20),
        (${product1Id}, 'Canada', 15),
        (${product1Id}, 'Australia', 10),
        (${product1Id}, 'Germany', 10)
    `;
    
    // Add videos for product 1
    await sql`
      INSERT INTO videos (product_id, title, platform, views, upload_date, thumbnail_url, video_url)
      VALUES (
        ${product1Id}, 
        'Amazing Magnetic Phone Mount Review', 
        'TikTok', 
        ${Math.floor(Math.random() * 1000000) + 10000}, 
        ${new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)}, 
        'https://picsum.photos/id/1/320/180',
        'https://www.tiktok.com/video/magnetic-mount123'
      )
    `;
    
    // Add trend data for product 1
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Create an upward trend
      const growth = 1 + (6 - i) * 0.1; // Increases from day 1 to 7
      
      await sql`
        INSERT INTO trends (product_id, date, engagement_value, sales_value, search_value)
        VALUES (
          ${product1Id},
          ${date},
          ${Math.floor(85 * growth * (0.8 + Math.random() * 0.4))},
          ${Math.floor(78 * growth * (0.8 + Math.random() * 0.4))},
          ${Math.floor(92 * growth * (0.8 + Math.random() * 0.4))}
        )
      `;
    }
  }
  
  // Product 2: Smart LED Strip
  const product2Result = await sql`
    INSERT INTO products (
      name, category, subcategory, price_range_low, price_range_high, 
      trend_score, engagement_rate, sales_velocity, search_volume, geographic_spread,
      image_url, description, source_platform, aliexpress_url, cjdropshipping_url
    ) 
    VALUES (
      'Smart LED Strip', 'Home & Kitchen', 'Smart Home', 14.99, 39.99,
      92, 88, 92, 86, 68,
      'https://picsum.photos/id/10/500/500', 
      'WiFi-enabled LED strip with app control and voice assistant compatibility.',
      'Instagram',
      'https://www.aliexpress.com/wholesale?SearchText=smart+led+strip',
      'https://cjdropshipping.com/search?q=smart+led+strip'
    )
    RETURNING id
  `;
  
  console.log('[Database] Successfully seeded with sample data');
}

// Function to periodically attempt reconnection if database is not initialized
export function startDatabaseReconnectionLoop() {
  // Attempt immediate connection
  initializeDatabase().then(success => {
    if (!success) {
      console.log(`[Database] Scheduling reconnection attempts every ${RECONNECT_INTERVAL / 60000} minutes`);
      // Schedule periodic reconnection attempts
      setInterval(async () => {
        if (!databaseInitialized) {
          console.log('[Database] Attempting scheduled reconnection...');
          await initializeDatabase();
        }
      }, RECONNECT_INTERVAL);
    }
  });
}