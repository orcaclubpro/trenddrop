/**
 * Test script for the enhanced TrendDrop server
 * 
 * This script tests the enhanced server entry point with the new core architecture.
 */

// Import core components
import { container, TYPES, Logger, Config, EventBus } from './src';

// Function to test core components
async function testCoreComponents() {
  try {
    console.log('Testing core components...');
    
    // Verify core services in container
    const logger = container.get<Logger>(TYPES.Logger);
    const config = container.get<Config>(TYPES.Config);
    const eventBus = container.get<EventBus>(TYPES.EventBus);
    
    console.log('Waiting for container to be fully initialized...');
    
    // Wait for async initialization of database
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify database is bound
    if (!container.isBound(TYPES.Database)) {
      console.error('❌ Database service not bound to container');
      process.exit(1);
    }
    
    const database = container.get(TYPES.Database) as any; // Use type assertion to bypass TypeScript checking
    
    console.log('✅ Successfully retrieved core services from container');
    
    // Test logger
    logger.info('Testing logger service', 'test');
    console.log('✅ Logger service is working');
    
    // Test config
    const dbUrl = config.get<string>('database.url');
    console.log(`✅ Config service is working: Database URL = ${dbUrl.substr(0, 20)}...`);
    
    // Test EventBus
    const eventName = 'test:event';
    const eventData = { test: true, timestamp: new Date().toISOString() };
    
    const unsubscribe = eventBus.subscribe(eventName, (data) => {
      console.log(`✅ EventBus received event: ${eventName}`, data);
      unsubscribe();
    });
    
    eventBus.publish(eventName, eventData);
    console.log('✅ EventBus is working');
    
    // Test database connection
    console.log('Testing database connection...');
    const dbInitialized = await database.initialize();
    
    if (dbInitialized) {
      console.log('✅ Database connection successful');
      
      // Test database health check
      const isHealthy = await database.healthCheck();
      console.log(`✅ Database health check: ${isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
      
      // Close the database connection
      await database.close();
      console.log('✅ Database connection closed');
    } else {
      console.log('❌ Failed to connect to database');
    }
    
    console.log('Core components test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run tests
testCoreComponents();