import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema.js';
import { sql } from 'drizzle-orm';
import { initializeDatabase, db as mainDb } from '../initialize.js';
import { log } from '../vite.js';
import { eventBus } from '../core/EventBus.js';

// Log messages with a consistent format
function logMessage(message: string): void {
  log(message, 'database');
}

/**
 * Unified Database Service
 * 
 * This service provides centralized database access and connection management.
 * It consolidates the functionality from both database service implementations.
 */
export class DatabaseService {
  private static instance: DatabaseService;
  private initialized = false;
  private db: ReturnType<typeof drizzle> | null = null;
  private client: ReturnType<typeof postgres> | null = null;
  private connectionRetries = 0;
  private readonly MAX_RETRIES = 5;
  private readonly RETRY_INTERVAL = 10000; // 10 seconds

  private constructor() {}

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
   * Get the database instance
   */
  public getDb() {
    if (!this.initialized || !this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  /**
   * Check if the database is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Initialize the database
   */
  public async initialize(): Promise<boolean> {
    if (this.initialized && this.db) {
      logMessage('Database already initialized');
      return true;
    }

    try {
      logMessage('Initializing database...');

      // Use the database initialization function from initialize.ts
      const success = await initializeDatabase();
      
      if (!success || !mainDb) {
        logMessage('Database initialization failed');
        
        // Try to reconnect if we haven't exceeded max retries
        if (this.connectionRetries < this.MAX_RETRIES) {
          this.connectionRetries++;
          
          logMessage(`Retrying database connection (${this.connectionRetries}/${this.MAX_RETRIES}) in ${this.RETRY_INTERVAL/1000}s...`);
          
          // Publish event about retry
          eventBus.publish('db:retry', {
            retryCount: this.connectionRetries,
            maxRetries: this.MAX_RETRIES,
            nextRetryIn: this.RETRY_INTERVAL/1000,
            timestamp: new Date().toISOString()
          });
          
          // Schedule retry
          return new Promise(resolve => {
            setTimeout(async () => {
              const retryResult = await this.initialize();
              resolve(retryResult);
            }, this.RETRY_INTERVAL);
          });
        } else {
          logMessage('Maximum database connection retries exceeded');
          
          // Emit database error event
          eventBus.publish('db:error', {
            error: 'Maximum connection retries exceeded',
            timestamp: new Date().toISOString()
          });
          
          this.initialized = false;
          return false;
        }
      }
      
      this.db = mainDb;
      this.initialized = true;
      this.connectionRetries = 0;
      logMessage('Database initialized successfully!');
      
      // Emit database connected event
      eventBus.publish('db:connected', {
        timestamp: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      logMessage(`Database initialization failed: ${error}`);
      
      // Emit database error event
      eventBus.publish('db:error', {
        error: String(error),
        timestamp: new Date().toISOString()
      });
      
      this.initialized = false;
      return false;
    }
  }
  
  /**
   * Test the database connection
   */
  public async testConnection(): Promise<boolean> {
    if (!this.db) {
      return false;
    }

    try {
      // Try to query the database
      await this.db.select({ count: sql`count(*)` }).from(schema.products);
      return true;
    } catch (error) {
      logMessage(`Database connection test failed: ${error}`);
      return false;
    }
  }
  
  /**
   * Close the database connection
   */
  public async close(): Promise<void> {
    if (!this.initialized) {
      return;
    }
    
    this.db = null;
    this.initialized = false;
    
    logMessage('Database connection closed');
    
    // Emit database disconnected event
    eventBus.publish('db:disconnected', {
      timestamp: new Date().toISOString()
    });
  }
}

export default DatabaseService.getInstance();
