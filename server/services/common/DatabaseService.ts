/**
 * DatabaseService - Unified database access
 * 
 * This service provides centralized database access and connection management.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '../../../shared/schema.js';
import { eventBus } from '../../core/EventBus.js';
import { log } from '../../vite.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private isInitialized = false;
  private connectionString: string;
  private db: ReturnType<typeof drizzle> | null = null;
  private client: ReturnType<typeof postgres> | null = null;
  private connectionRetries = 0;
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_INTERVAL = 10000; // 10 seconds

  private constructor() {
    this.connectionString = process.env.DATABASE_URL || '';
    
    if (!this.connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  /**
   * Initialize the database connection
   */
  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      log('Database service already initialized', 'db-service');
      return true;
    }

    if (!this.connectionString) {
      log('No database connection string provided', 'db-service');
      return false;
    }

    try {
      log('Connecting to database...', 'db-service');
      
      // Create Postgres client
      this.client = postgres(this.connectionString, { 
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10
      });
      
      // Create Drizzle ORM instance
      this.db = drizzle(this.client, { schema });
      
      // Test the connection
      await this.testConnection();
      
      this.isInitialized = true;
      this.connectionRetries = 0;
      
      log('Database connection successful', 'db-service');
      
      // Emit database connected event
      eventBus.publish('db:connected', {
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      log(`Database connection error: ${error}`, 'db-service');
      
      // Try to reconnect if we haven't exceeded max retries
      if (this.connectionRetries < this.MAX_RETRIES) {
        this.connectionRetries++;
        
        log(`Retrying database connection (${this.connectionRetries}/${this.MAX_RETRIES}) in ${this.RETRY_INTERVAL/1000}s...`, 'db-service');
        
        setTimeout(() => {
          this.initialize();
        }, this.RETRY_INTERVAL);
      } else {
        log('Maximum database connection retries exceeded', 'db-service');
        
        // Emit database error event
        eventBus.publish('db:error', {
          error: String(error),
          timestamp: new Date().toISOString()
        });
      }
      
      return false;
    }
  }

  /**
   * Test the database connection
   */
  private async testConnection(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Try to query the database
    await this.db.select({ count: schema.sql`count(*)` }).from(schema.products);
  }

  /**
   * Get the database instance
   */
  public getDb(): ReturnType<typeof drizzle> {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Check if the database is initialized
   */
  public isConnected(): boolean {
    return this.isInitialized;
  }

  /**
   * Run database migrations
   */
  public async runMigrations(): Promise<boolean> {
    if (!this.isInitialized || !this.db || !this.client) {
      log('Cannot run migrations, database not initialized', 'db-service');
      return false;
    }

    try {
      log('Running database migrations...', 'db-service');
      
      // Run migrations from the migrations folder
      await migrate(this.db, { migrationsFolder: './migrations' });
      
      log('Database migrations completed successfully', 'db-service');
      
      // Emit migration completed event
      eventBus.publish('db:migrations:completed', {
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      log(`Database migration error: ${error}`, 'db-service');
      
      // Emit migration error event
      eventBus.publish('db:migrations:error', {
        error: String(error),
        timestamp: new Date().toISOString()
      });
      
      return false;
    }
  }

  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (this.client) {
      await this.client.end();
      this.client = null;
    }
    this.db = null;
    this.isInitialized = false;
    
    log('Database connection closed', 'db-service');
    
    // Emit database disconnected event
    eventBus.publish('db:disconnected', {
      timestamp: new Date().toISOString()
    });
  }
}

// Export singleton instance
export const databaseService = DatabaseService.getInstance();

// Export default for convenience
export default databaseService;