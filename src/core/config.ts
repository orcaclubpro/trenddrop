/**
 * Config Service
 * 
 * This service is responsible for loading and providing access to configuration values
 * from environment variables or configuration files.
 */

import { injectable } from 'inversify';
import * as dotenv from 'dotenv';

// Initialize dotenv
dotenv.config();

// Define default configuration
const DEFAULT_CONFIG = {
  app: {
    name: 'TrendDrop',
    environment: 'development'
  },
  server: {
    host: '0.0.0.0',
    port: 3000
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/trenddrop',
    maxConnections: 10,
    idleTimeout: 30000,
    connectionTimeout: 5000
  },
  agent: {
    runInterval: 3600000, // 1 hour in milliseconds
    maxRetries: 3,
    timeout: 60000 // 1 minute in milliseconds
  },
  logging: {
    level: 'info',
    format: 'json',
    enabled: true
  }
};

/**
 * Config service - provides access to application configuration
 */
@injectable()
export class Config {
  private config: Record<string, any>;
  
  constructor() {
    this.config = this.loadConfig();
  }
  
  /**
   * Load configuration from environment and defaults
   */
  private loadConfig(): Record<string, any> {
    return {
      ...DEFAULT_CONFIG,
      app: {
        ...DEFAULT_CONFIG.app,
        environment: process.env.NODE_ENV || DEFAULT_CONFIG.app.environment
      },
      server: {
        ...DEFAULT_CONFIG.server,
        port: process.env.PORT ? parseInt(process.env.PORT, 10) : DEFAULT_CONFIG.server.port,
        host: process.env.HOST || DEFAULT_CONFIG.server.host
      },
      database: {
        ...DEFAULT_CONFIG.database,
        url: process.env.DATABASE_URL || DEFAULT_CONFIG.database.url
      },
      logging: {
        ...DEFAULT_CONFIG.logging,
        level: process.env.LOG_LEVEL || DEFAULT_CONFIG.logging.level,
        enabled: process.env.LOGGING_ENABLED ? 
          process.env.LOGGING_ENABLED.toLowerCase() === 'true' : 
          DEFAULT_CONFIG.logging.enabled
      }
    };
  }
  
  /**
   * Get configuration value by path
   * @param path Configuration path (e.g., 'database.url')
   * @param defaultValue Default value if the path doesn't exist
   */
  get<T>(path: string, defaultValue?: T): T {
    const parts = path.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return defaultValue as T;
      }
      current = current[part];
    }
    
    return (current === undefined || current === null) ? 
      (defaultValue as T) : (current as T);
  }
  
  /**
   * Set configuration value
   * @param path Configuration path
   * @param value New value
   */
  set(path: string, value: any): void {
    const parts = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      if (!(part in current)) {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * Check if configuration path exists
   * @param path Configuration path
   */
  has(path: string): boolean {
    const parts = path.split('.');
    let current: any = this.config;
    
    for (const part of parts) {
      if (current === undefined || current === null || !(part in current)) {
        return false;
      }
      current = current[part];
    }
    
    return true;
  }
}