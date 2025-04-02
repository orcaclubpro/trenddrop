/**
 * Test script for the enhanced database service
 */

import 'reflect-metadata';
import { Config } from './core/config';
import { Logger } from './core/logger';
import { EventBus, createEventBus } from './core/event-bus';
import { Database } from './data/database';

async function testEnhancedDatabase() {
  try {
    console.log('Starting enhanced database test...');
    
    // Create core services manually (without container for simplicity in the test)
    const config = new Config();
    const logger = new Logger(config);
    const eventBus = createEventBus(logger);
    
    // Subscribe to database events
    eventBus.subscribe('database:connected', (data) => {
      console.log(`Database connected event received: ${JSON.stringify(data)}`);
    });
    
    eventBus.subscribe('database:error', (data) => {
      console.log(`Database error event received: ${JSON.stringify(data)}`);
    });
    
    eventBus.subscribe('database:retry', (data) => {
      console.log(`Database retry event received: ${JSON.stringify(data)}`);
    });
    
    // Create and initialize database service
    const database = new Database(logger, eventBus, config);
    
    console.log('Initializing database...');
    const initialized = await database.initialize();
    
    if (initialized) {
      console.log('Database initialized successfully');
      const status = database.getStatus();
      console.log('Database status:', status);
      
      // Check database health
      const isHealthy = await database.healthCheck();
      console.log('Database health check:', isHealthy ? 'HEALTHY' : 'UNHEALTHY');
      
      // Close database connection
      await database.close();
      console.log('Database connection closed');
    } else {
      console.error('Failed to initialize database');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testEnhancedDatabase().catch(console.error);