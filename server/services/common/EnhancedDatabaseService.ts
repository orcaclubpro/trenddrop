/**
 * EnhancedDatabaseService - Improved database connectivity with retry and monitoring
 * 
 * This service provides enhanced database connectivity with error handling,
 * connection pooling, monitoring, and retry capabilities.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as schema from '../../../shared/schema.js';
import { eventBus } from '../../core/EventBus.js';
import { log } from '../../vite.js';

/**
 * EnhancedDatabaseService class
 */
export class EnhancedDatabaseService {
  private static instance: EnhancedDatabaseService;
  
  // Connection state
  private client: postgres.Sql<{}> | null = null;
  private db: ReturnType<typeof drizzle> | null = null;
  private isInitialized = false;
  private isConnected = false;
  private lastHealthCheck: Date | null = null;
  private connectionMonitorInterval: NodeJS.Timeout | null = null;
  private connectionAttempts = 0;
  
  // Connection settings
  private readonly connectionString: string;
  private readonly MAX_RETRIES = 10;
  private readonly MIN_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 30000; // 30 seconds
  
  private constructor() {
    // Get connection string from environment
    this.connectionString = process.env.DATABASE_URL || '';
    
    if (!this.connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): EnhancedDatabaseService {
    if (!EnhancedDatabaseService.instance) {
      EnhancedDatabaseService.instance = new EnhancedDatabaseService();
    }
    return EnhancedDatabaseService.instance;
  }
  
  /**
   * Initialize the database connection with retry
   */
  public async initialize(): Promise<boolean> {
    log('Initializing database...', 'database');
    
    // Reset state
    this.connectionAttempts = 0;
    this.isInitialized = false;
    this.isConnected = false;
    
    // Publish initialization event
    eventBus.publish('db:initializing', { attempt: this.connectionAttempts + 1, maxRetries: this.MAX_RETRIES });

    while (this.connectionAttempts < this.MAX_RETRIES) {
      try {
        // Increment attempts counter
        this.connectionAttempts++;
        
        // Log attempt information
        log(`Initializing database (attempt ${this.connectionAttempts} of ${this.MAX_RETRIES})...`, 'database');
        
        // Test the connection first
        log('Testing connection...', 'database');
        const testClient = postgres(this.connectionString, { max: 1 });
        // Execute a test query to check the connection
        await testClient`SELECT 1 as test`;
        await testClient.end({ timeout: 5 });
        
        // Create the main client with connection pool
        this.client = postgres(this.connectionString, {
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10
        });
        
        // Initialize Drizzle
        this.db = drizzle(this.client, { schema });
        
        // Check if tables exist and create/validate them
        log('Checking if tables exist...', 'database');
        const tablesExist = await this.checkTablesExist();
        
        if (!tablesExist) {
          // Create tables if they don't exist (should be done via migrations in production)
          log('Tables do not exist, running initial migration...', 'database');
          await this.migrateSchema();
        } else {
          // Validate existing schema
          log('Checking and updating schema if needed...', 'database');
          await this.validateAndUpdateSchema();
        }
        
        // Set up connection health monitoring
        this.setupConnectionMonitoring();
        
        // Mark as initialized
        this.isInitialized = true;
        this.isConnected = true;
        
        // Publish success event
        eventBus.publish('db:connected', { 
          timestamp: new Date().toISOString(),
          attempts: this.connectionAttempts 
        });
        
        log('Database initialization completed successfully', 'database');
        return true;
      } catch (error) {
        // Calculate retry delay with exponential backoff (with jitter)
        const baseDelay = Math.min(
          this.MAX_RETRY_DELAY,
          this.MIN_RETRY_DELAY * Math.pow(2, this.connectionAttempts - 1)
        );
        
        // Add jitter (±20%) to prevent thundering herd
        const jitter = 0.2;
        const jitterAmount = baseDelay * jitter;
        const delay = baseDelay + (Math.random() * jitterAmount * 2) - jitterAmount;
        
        // Log the error and retry delay
        log(`Database initialization failed (attempt ${this.connectionAttempts}): ${error}`, 'database');
        log(`Retrying in ${Math.round(delay / 1000)} seconds...`, 'database');
        
        // Publish error event
        eventBus.publish('db:error', {
          error: String(error),
          attempt: this.connectionAttempts,
          nextRetry: new Date(Date.now() + delay).toISOString(),
          maxRetries: this.MAX_RETRIES
        });
        
        // Wait before the next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // If we got here, all attempts failed
    log(`Database initialization failed after ${this.MAX_RETRIES} attempts`, 'database');
    eventBus.publish('db:failed', { maxRetries: this.MAX_RETRIES });
    return false;
  }

  /**
   * Get the Drizzle DB instance
   */
  public getDb(): ReturnType<typeof drizzle> {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Check if database tables exist
   */
  private async checkTablesExist(): Promise<boolean> {
    try {
      if (!this.db || !this.client) return false;
      
      // Query to check for the existence of the 'products' table
      const result = await this.client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'products'
        )
      `;
      
      return result[0]?.exists || false;
    } catch (error) {
      log(`Error checking tables: ${error}`, 'database');
      return false;
    }
  }

  /**
   * Perform schema migration
   */
  private async migrateSchema(): Promise<void> {
    try {
      if (!this.db || !this.client) {
        throw new Error('Database connection not established');
      }
      
      // In a real production app, you might use Drizzle migrations:
      // await migrate(this.db, { migrationsFolder: './drizzle' });
      
      // For this implementation, we'll use a direct approach
      const tableQueries = [
        this.client`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        this.client`
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT NOT NULL,
            price_range_low NUMERIC(10, 2) NOT NULL,
            price_range_high NUMERIC(10, 2) NOT NULL,
            trend_score NUMERIC(5, 2) DEFAULT 0,
            engagement_rate NUMERIC(5, 2) DEFAULT 0,
            sales_velocity NUMERIC(5, 2) DEFAULT 0,
            search_volume INTEGER DEFAULT 0,
            geographic_spread NUMERIC(5, 2) DEFAULT 0,
            image_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        this.client`
          CREATE TABLE IF NOT EXISTS trends (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            value NUMERIC(10, 2) NOT NULL,
            source TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        this.client`
          CREATE TABLE IF NOT EXISTS regions (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            country TEXT NOT NULL,
            interest_level NUMERIC(5, 2) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `,
        this.client`
          CREATE TABLE IF NOT EXISTS videos (
            id SERIAL PRIMARY KEY,
            product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            platform TEXT NOT NULL,
            views INTEGER DEFAULT 0,
            upload_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          )
        `
      ];
      
      // Execute all table creation queries
      for (const query of tableQueries) {
        await query;
      }
      
      log('Database schema created successfully', 'database');
      eventBus.publish('db:schema:created', { timestamp: new Date().toISOString() });
    } catch (error) {
      log(`Error migrating schema: ${error}`, 'database');
      throw error;
    }
  }

  /**
   * Validate and update existing schema if needed
   */
  private async validateAndUpdateSchema(): Promise<void> {
    try {
      if (!this.db || !this.client) {
        throw new Error('Database connection not established');
      }
      
      // Check for and add missing columns
      await this.addMissingColumns();
      
      log('Table schema updated successfully', 'database');
      eventBus.publish('db:schema:updated', { timestamp: new Date().toISOString() });
    } catch (error) {
      log(`Error updating schema: ${error}`, 'database');
      throw error;
    }
  }

  /**
   * Add missing columns to existing tables
   */
  private async addMissingColumns(): Promise<void> {
    if (!this.client) return;
    
    // Check and add missing columns to the products table
    const productColumns = await this.client`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products'
    `;
    
    const existingProductColumns = productColumns.map(col => col.column_name);
    
    // Check for specific columns and add if missing
    if (!existingProductColumns.includes('engagement_rate')) {
      await this.client`
        ALTER TABLE products 
        ADD COLUMN engagement_rate NUMERIC(5, 2) DEFAULT 0
      `;
      log('Added missing column: products.engagement_rate', 'database');
    }
    
    if (!existingProductColumns.includes('sales_velocity')) {
      await this.client`
        ALTER TABLE products 
        ADD COLUMN sales_velocity NUMERIC(5, 2) DEFAULT 0
      `;
      log('Added missing column: products.sales_velocity', 'database');
    }
    
    if (!existingProductColumns.includes('search_volume')) {
      await this.client`
        ALTER TABLE products 
        ADD COLUMN search_volume INTEGER DEFAULT 0
      `;
      log('Added missing column: products.search_volume', 'database');
    }
    
    if (!existingProductColumns.includes('geographic_spread')) {
      await this.client`
        ALTER TABLE products 
        ADD COLUMN geographic_spread NUMERIC(5, 2) DEFAULT 0
      `;
      log('Added missing column: products.geographic_spread', 'database');
    }
    
    // Perform similar checks for other tables if needed
  }

  /**
   * Set up periodic connection health monitoring
   */
  private setupConnectionMonitoring(): void {
    // Clear any existing interval
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    // Set up a new monitoring interval (check every 30 seconds)
    this.connectionMonitorInterval = setInterval(async () => {
      try {
        if (!this.client) return;
        
        // Perform a simple query to check connection health
        await this.client`SELECT 1`;
        
        // Update health check timestamp
        this.lastHealthCheck = new Date();
        
        // If the connection was previously down, notify that it's back up
        if (!this.isConnected) {
          this.isConnected = true;
          log('Database connection restored', 'database');
          eventBus.publish('db:reconnected', { timestamp: this.lastHealthCheck.toISOString() });
        }
      } catch (error) {
        // Mark connection as down
        this.isConnected = false;
        log(`Database connection health check failed: ${error}`, 'database');
        eventBus.publish('db:disconnected', { 
          error: String(error),
          lastHealthCheck: this.lastHealthCheck?.toISOString()
        });
        
        // Attempt to reconnect
        this.attemptReconnect();
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Attempt to reconnect to the database
   */
  private async attemptReconnect(): Promise<void> {
    try {
      log('Attempting to reconnect to database...', 'database');
      
      // Close existing client if it exists
      if (this.client) {
        try {
          await this.client.end();
        } catch (error) {
          // Ignore errors when closing
        }
      }
      
      // Create a new client
      this.client = postgres(this.connectionString, {
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10
      });
      
      // Initialize Drizzle with the new client
      this.db = drizzle(this.client, { schema });
      
      // Test the connection
      await this.client`SELECT 1`;
      
      // Update connection status
      this.isConnected = true;
      this.lastHealthCheck = new Date();
      
      log('Successfully reconnected to database', 'database');
      eventBus.publish('db:reconnected', { timestamp: this.lastHealthCheck.toISOString() });
    } catch (error) {
      log(`Failed to reconnect to database: ${error}`, 'database');
      eventBus.publish('db:reconnect_failed', { error: String(error) });
    }
  }

  /**
   * Shutdown the database service
   */
  public async shutdown(): Promise<void> {
    log('Shutting down database service...', 'database');
    
    // Clear the connection monitoring interval
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
      this.connectionMonitorInterval = null;
    }
    
    // Close the database connection
    if (this.client) {
      try {
        await this.client.end();
        this.client = null;
        this.db = null;
        this.isInitialized = false;
        this.isConnected = false;
        log('Database connection closed', 'database');
      } catch (error) {
        log(`Error closing database connection: ${error}`, 'database');
      }
    }
    
    eventBus.publish('db:shutdown', { timestamp: new Date().toISOString() });
  }

  /**
   * Get connection health status
   */
  public getHealthStatus(): any {
    return {
      initialized: this.isInitialized,
      connected: this.isConnected,
      lastHealthCheck: this.lastHealthCheck?.toISOString(),
      connectionAttempts: this.connectionAttempts
    };
  }
}

// Export singleton instance
export const enhancedDatabaseService = EnhancedDatabaseService.getInstance();

// Export default for convenience
export default enhancedDatabaseService;