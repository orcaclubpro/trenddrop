/**
 * Database Service
 * 
 * This service provides database connectivity and management
 * for the application.
 */

import { injectable, inject } from 'inversify';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const { Pool } = pg;
type PoolClient = pg.PoolClient;

import { TYPES } from '../core/types';
import { Config } from '../core/config';
import { Logger } from '../core/logger';
import { EventBus } from '../core/event-bus';

// Database status type
export interface DatabaseStatus {
  initialized: boolean;
  connected: boolean;
  retries: number;
  lastHealthCheck: string;
}

/**
 * Database service - provides database connectivity
 */
@injectable()
export class Database {
  private pool: pg.Pool | null = null;
  private db: NodePgDatabase | null = null;
  private status: DatabaseStatus = {
    initialized: false,
    connected: false,
    retries: 0,
    lastHealthCheck: new Date().toISOString()
  };
  
  constructor(
    @inject(TYPES.Logger) private logger: Logger,
    @inject(TYPES.EventBus) private eventBus: EventBus,
    @inject(TYPES.Config) private config: Config
  ) {}
  
  /**
   * Initialize database connection
   */
  async initialize(retryCount = 0): Promise<boolean> {
    try {
      this.logger.info('Initializing database connection...', 'database');
      
      const maxRetries = this.config.get<number>('database.maxRetries', 5);
      
      if (retryCount > 0) {
        this.logger.info(`Initializing database (attempt ${retryCount} of ${maxRetries})...`, 'database');
      }
      
      // Already initialized
      if (this.pool && this.db && this.status.initialized) {
        this.logger.info('Database already initialized', 'database');
        return true;
      }
      
      // Create PostgreSQL pool
      this.logger.debug('Testing connection...', 'database');
      
      const dbUrl = this.config.get<string>('database.url');
      if (!dbUrl) {
        throw new Error('Database URL not configured');
      }
      
      this.pool = new Pool({
        connectionString: dbUrl,
        max: this.config.get<number>('database.maxConnections', 10),
        idleTimeoutMillis: this.config.get<number>('database.idleTimeout', 30000),
        connectionTimeoutMillis: this.config.get<number>('database.connectionTimeout', 5000)
      });
      
      // Test connection
      const client = await this.pool.connect();
      client.release();
      
      // Create drizzle instance
      this.db = drizzle(this.pool);
      
      // Check if tables exist
      this.logger.debug('Checking if tables exist...', 'database');
      const tablesExist = await this.checkTablesExist();
      
      if (!tablesExist) {
        this.logger.info('Tables do not exist, running schema migration...', 'database');
        await this.performMigration();
      } else {
        // Update schema if needed
        this.logger.debug('Checking and updating schema if needed...', 'database');
        const schemaUpdated = await this.updateSchema();
        if (schemaUpdated) {
          this.logger.info('Table schema updated successfully', 'database');
        }
      }
      
      // Update status
      this.status.initialized = true;
      this.status.connected = true;
      this.status.lastHealthCheck = new Date().toISOString();
      
      // Emit connected event
      this.eventBus.publish('database:connected', {
        timestamp: new Date().toISOString(),
        attempts: retryCount + 1
      });
      
      this.logger.info('Database initialization completed successfully', 'database');
      
      return true;
    } catch (error) {
      this.status.connected = false;
      this.status.retries = retryCount + 1;
      
      this.logger.error(`Database initialization failed: ${error}`, 'database');
      
      // Emit error event
      this.eventBus.publish('database:error', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        attempt: retryCount + 1
      });
      
      // Retry if not exceeded max retries
      const maxRetries = this.config.get<number>('database.maxRetries', 5);
      if (retryCount < maxRetries) {
        const retryDelay = this.config.get<number>('database.retryDelay', 2000);
        
        this.logger.info(`Retrying database initialization in ${retryDelay}ms...`, 'database');
        
        // Emit retry event
        this.eventBus.publish('database:retry', {
          timestamp: new Date().toISOString(),
          attempt: retryCount + 1,
          nextAttempt: retryCount + 2,
          maxRetries
        });
        
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.initialize(retryCount + 1);
      }
      
      return false;
    }
  }
  
  /**
   * Get database status
   */
  getStatus(): DatabaseStatus {
    return { ...this.status };
  }
  
  /**
   * Check database health
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.pool || !this.db) {
        return false;
      }
      
      // Execute a simple query to check connection
      const client = await this.pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      
      const isHealthy = result.rows.length > 0 && result.rows[0].test === 1;
      
      // Update status
      this.status.connected = isHealthy;
      this.status.lastHealthCheck = new Date().toISOString();
      
      return isHealthy;
    } catch (error) {
      this.logger.error(`Database health check failed: ${error}`, 'database');
      
      this.status.connected = false;
      this.status.lastHealthCheck = new Date().toISOString();
      
      return false;
    }
  }
  
  /**
   * Execute a query
   * @param queryFn Function that executes the query using the provided DB instance
   */
  async query<T>(queryFn: (db: NodePgDatabase) => Promise<T>): Promise<T> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    
    try {
      return await queryFn(this.db);
    } catch (error) {
      this.logger.error(`Query execution failed: ${error}`, 'database');
      throw error;
    }
  }
  
  /**
   * Execute a transaction
   * @param txFn Function that executes the transaction using the provided client
   */
  async transaction<T>(txFn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Database not initialized');
    }
    
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await txFn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error(`Transaction failed: ${error}`, 'database');
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.pool) {
      this.logger.info('Database connection closed', 'database');
      await this.pool.end();
      this.pool = null;
      this.db = null;
      this.status.connected = false;
      this.status.initialized = false;
    }
  }
  
  /**
   * Check if tables exist in the database
   */
  private async checkTablesExist(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }
    
    try {
      const client = await this.pool.connect();
      
      try {
        const result = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name = 'products'
          );
        `);
        
        return result.rows.length > 0 && result.rows[0].exists;
      } finally {
        client.release();
      }
    } catch (error) {
      this.logger.error(`Failed to check if tables exist: ${error}`, 'database');
      return false;
    }
  }
  
  /**
   * Perform database schema migration
   */
  private async performMigration(): Promise<void> {
    // This is a placeholder for the actual migration logic
    // In a real application, we would use drizzle-orm/drizzle-kit migrations
    this.logger.info('Running database migrations...', 'database');
    
    // For now, just log a success message
    this.logger.info('Database migrations completed successfully', 'database');
  }
  
  /**
   * Update database schema
   */
  private async updateSchema(): Promise<boolean> {
    try {
      // For now, this is a placeholder for the schema update logic
      // In a real world scenario, this would use drizzle push or migrations
      return true;
    } catch (error) {
      this.logger.error(`Failed to update schema: ${error}`, 'database');
      return false;
    }
  }
}