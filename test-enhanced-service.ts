/**
 * Test script for enhanced database service
 */

import { enhancedDatabaseService } from './server/services/common/EnhancedDatabaseService.js';
import { log } from './server/vite.js';
import { eventBus } from './server/core/EventBus.js';

// Set up event listeners
eventBus.subscribe('db:connected', (data) => {
  log(`Database connected: ${JSON.stringify(data)}`, 'test');
});

eventBus.subscribe('db:error', (data) => {
  log(`Database error: ${JSON.stringify(data)}`, 'test');
});

eventBus.subscribe('db:failed', (data) => {
  log(`Database initialization failed: ${JSON.stringify(data)}`, 'test');
});

async function testEnhancedDatabase() {
  log('Testing enhanced database service...', 'test');
  
  try {
    // Initialize the database
    const success = await enhancedDatabaseService.initialize();
    
    if (success) {
      log('Database initialization successful!', 'test');
      
      // Get the database instance
      const db = enhancedDatabaseService.getDb();
      
      // Execute a simple query
      const result = await db.execute('SELECT 1 as test');
      log(`Query result: ${JSON.stringify(result)}`, 'test');
      
      // Get health status
      const healthStatus = enhancedDatabaseService.getHealthStatus();
      log(`Health status: ${JSON.stringify(healthStatus)}`, 'test');
      
      // Shutdown the database
      await enhancedDatabaseService.shutdown();
      log('Database shutdown complete', 'test');
    } else {
      log('Database initialization failed', 'test');
    }
  } catch (error) {
    log(`Test error: ${error}`, 'test');
  }
}

// Run the test
testEnhancedDatabase().catch(console.error);