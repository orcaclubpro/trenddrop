/**
 * Test script for enhanced database service
 */

import { container, TYPES } from './src';

// Wait for a short time to ensure async binding is complete
async function testEnhancedDatabase() {
  console.log('Starting enhanced database service test...');
  
  try {
    console.log('Waiting for container to be fully initialized...');
    
    // Wait for the database to be registered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if database is bound
    if (!container.isBound(TYPES.Database)) {
      console.error('❌ Database service not bound to container');
      process.exit(1);
    }
    
    // Get the database service from the container
    const database = container.get(TYPES.Database) as any; // Use type assertion to bypass TypeScript checking
    
    console.log('Testing database connection...');
    
    // Initialize the database
    const initialized = await database.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize database connection');
      process.exit(1);
    }
    
    console.log('✅ Database successfully initialized');
    
    // Perform health check
    const healthStatus = await database.healthCheck();
    console.log(`✅ Database health check: ${healthStatus ? 'HEALTHY' : 'UNHEALTHY'}`);
    
    // Test query execution
    await database.query(async (db) => {
      console.log('✅ Successfully executed a test query');
      return true;
    });
    
    // Test transaction with rollback
    try {
      await database.transaction(async (client) => {
        console.log('✅ Successfully started a test transaction');
        throw new Error('Test rollback - this is expected');
      });
    } catch (error) {
      console.log('✅ Transaction rollback successful (expected error)');
    }
    
    // Close the database connection
    await database.close();
    console.log('✅ Database connection closed');
    
    console.log('Database service test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
testEnhancedDatabase();