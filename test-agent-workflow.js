#!/usr/bin/env node

/**
 * Agent Workflow Test Script
 * 
 * This script tests the Agent workflow from start to finish:
 * 1. Connects to the server
 * 2. Monitors the agent status
 * 3. Starts the agent
 * 4. Monitors the product discovery process
 * 5. Verifies that products are being added to the database
 * 6. Stops the agent
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';

// Configuration
const API_BASE = 'http://localhost:5001/api';
const WS_BASE = 'ws://localhost:5001/ws';
const TEST_TIMEOUT = 120000; // 2 minutes timeout for the entire test
const POLL_INTERVAL = 3000; // 3 seconds between status checks

// Test state
let testCompleted = false;
let testPassed = false;
let testMessages = [];
let wsConnection = null;
let initialProductCount = 0;

// Main test function
async function runTest() {
  try {
    console.log('🧪 Starting Agent Workflow Test...');
    console.log('-------------------------------------');
    
    // Step 1: Check if server is running
    console.log('Step 1: Checking server status...');
    await checkServerStatus();
    
    // Step 2: Get initial agent status
    console.log('Step 2: Getting initial agent status...');
    const initialStatus = await getAgentStatus();
    console.log(`  - Agent status: ${initialStatus.status}`);
    console.log(`  - AI capabilities: ${JSON.stringify(initialStatus.aiCapabilities)}`);
    
    // Step 3: Check initial product count
    console.log('Step 3: Getting initial product count...');
    const products = await getProducts();
    initialProductCount = products.length || 0;
    console.log(`  - Initial product count: ${initialProductCount}`);
    
    // Step 4: Skipping WebSocket connection due to authentication requirements...
    console.log('Step 4: Skipping WebSocket connection due to authentication requirements...');
    // Skip WebSocket connection for now
    
    // Step 5: Start the agent
    console.log('Step 5: Starting the agent...');
    await startAgent();
    
    // Step 6: Monitor agent progress 
    console.log('Step 6: Monitoring agent progress...');
    await monitorAgentProgress();
    
    // Step 7: Stop the agent
    console.log('Step 7: Stopping the agent...');
    await stopAgent();
    
    // Step 8: Verify results
    console.log('Step 8: Verifying results...');
    const finalProducts = await getProducts();
    const newProductCount = (finalProducts.length || 0) - initialProductCount;
    
    if (newProductCount > 0) {
      console.log(`  ✅ Test PASSED: ${newProductCount} new products added to database`);
      testPassed = true;
    } else {
      console.log(`  ❌ Test FAILED: No new products added`);
      testPassed = false;
    }
    
    testCompleted = true;
    
  } catch (error) {
    console.error(`❌ Test failed with error: ${error.message}`);
    testMessages.push(`Error: ${error.message}`);
    testPassed = false;
    testCompleted = true;
  }
}

// Helper functions
async function checkServerStatus() {
  try {
    const response = await fetch(`${API_BASE}`);
    if (response.ok) {
      console.log('  ✅ Server is running');
      return true;
    } else {
      throw new Error(`Server returned status ${response.status}`);
    }
  } catch (error) {
    console.error(`  ❌ Server check failed: ${error.message}`);
    throw new Error('Server is not running');
  }
}

async function getAgentStatus() {
  try {
    const response = await fetch(`${API_BASE}/agent/status`);
    if (response.ok) {
      const status = await response.json();
      return status;
    } else {
      throw new Error(`Failed to get agent status: ${response.status}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to get agent status: ${error.message}`);
    throw error;
  }
}

async function getProducts() {
  try {
    const response = await fetch(`${API_BASE}/products`);
    if (response.ok) {
      const products = await response.json();
      return products;
    } else {
      throw new Error(`Failed to get products: ${response.status}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to get products: ${error.message}`);
    throw error;
  }
}

function connectToWebSocket() {
  console.log('  ⚠️ WebSocket connection skipped due to authentication requirements');
  // Return dummy functions to avoid errors
  return {
    send: () => console.log('WebSocket send called (skipped)'),
    close: () => console.log('WebSocket close called (skipped)')
  };
}

async function startAgent() {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mode: 'complete',
        targetCount: 5 // Limit to 5 products for testing
      })
    };
    
    const response = await fetch(`${API_BASE}/agent/start`, options);
    if (response.ok) {
      const result = await response.json();
      console.log(`  ✅ Agent started: ${result.message}`);
      return result;
    } else {
      throw new Error(`Failed to start agent: ${response.status}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to start agent: ${error.message}`);
    throw error;
  }
}

async function stopAgent() {
  try {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await fetch(`${API_BASE}/agent/stop`, options);
    if (response.ok) {
      const result = await response.json();
      console.log(`  ✅ Agent stopped: ${result.message}`);
      return result;
    } else {
      throw new Error(`Failed to stop agent: ${response.status}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to stop agent: ${error.message}`);
    throw error;
  }
}

async function monitorAgentProgress() {
  let timeElapsed = 0;
  let productsAdded = 0;
  
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        // Get current agent status
        const status = await getAgentStatus();
        const currentProducts = await getProducts();
        const newProductCount = currentProducts.length - initialProductCount;
        
        if (newProductCount > productsAdded) {
          productsAdded = newProductCount;
          console.log(`  ✅ ${productsAdded} new products added`);
        }
        
        timeElapsed += POLL_INTERVAL;
        
        // Check if we've discovered products or exceeded timeout
        if (productsAdded > 0 || timeElapsed >= TEST_TIMEOUT) {
          clearInterval(interval);
          if (productsAdded > 0) {
            console.log(`  ✅ Product discovery successful: ${productsAdded} products added`);
            resolve();
          } else {
            console.log(`  ⚠️ Test timeout reached without new products`);
            resolve(); // Still resolve but we'll mark test as failed later
          }
        }
      } catch (error) {
        clearInterval(interval);
        reject(error);
      }
    }, POLL_INTERVAL);
  });
}

// Set timeout for entire test
const testTimeout = setTimeout(() => {
  if (!testCompleted) {
    console.error(`❌ Test timed out after ${TEST_TIMEOUT / 1000} seconds`);
    testMessages.push('Test timed out');
    testPassed = false;
    testCompleted = true;
    
    process.exit(1);
  }
}, TEST_TIMEOUT);

// Run the test
runTest().finally(() => {
  clearTimeout(testTimeout);
  
  // Print summary
  console.log('\n-------------------------------------');
  console.log('Test Summary:');
  console.log(`Status: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('Messages:');
  testMessages.forEach(msg => console.log(`  - ${msg}`));
  console.log('-------------------------------------');
  
  // Exit with appropriate code
  process.exit(testPassed ? 0 : 1);
}); 