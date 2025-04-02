/**
 * Service Index
 * 
 * This file exports all services and provides helper functions 
 * for initializing services in the correct order.
 */

import { serviceRegistry } from '../core/ServiceRegistry.js';
import { eventBus } from '../core/EventBus.js';
import databaseService from './database-service.js';
import agentService, { 
  startAgentService, 
  stopAgentService, 
  triggerScraping, 
  getAgentStatus 
} from './agent-service.js';
import { logService } from './common/LogService.js';
import { TrendService } from './trend-service.js';
import { ProductService } from './ProductService.js';
import { RegionService } from './RegionService.js';
import { VideoService } from './VideoService.js'; 
import { DbStorage } from '../storage.js';

// Create storage instance
const dbStorage = new DbStorage();

// Create service instances
export const productService = new ProductService();
export const trendService = new TrendService(dbStorage);
export const regionService = new RegionService();
export const videoService = new VideoService();

// Export all services
export {
  databaseService,
  agentService,
  logService,
  startAgentService,
  stopAgentService,
  triggerScraping,
  getAgentStatus,
  // Export classes for dependency injection
  ProductService,
  TrendService,
  RegionService,
  VideoService
};

/**
 * Initialize all application services in the correct order
 * 
 * @returns Promise that resolves when all services are initialized
 */
export async function initializeServices(): Promise<boolean> {
  try {
    // Register services with the registry
    serviceRegistry.register('eventBus', eventBus);
    serviceRegistry.register('databaseService', databaseService);
    serviceRegistry.register('agentService', agentService);
    serviceRegistry.register('logService', logService);
    serviceRegistry.register('productService', productService);
    serviceRegistry.register('trendService', trendService); 
    serviceRegistry.register('regionService', regionService);
    serviceRegistry.register('videoService', videoService);
    serviceRegistry.register('dbStorage', dbStorage);
    
    // Initialize the database first
    const dbInitialized = await databaseService.initialize();
    if (!dbInitialized) {
      console.error('Failed to initialize database service');
      return false;
    }
    
    // Initialize logging service
    logService.registerLogInterceptor();
    
    // Everything was initialized successfully
    return true;
  } catch (error) {
    console.error(`Error initializing services: ${error}`);
    return false;
  }
}

/**
 * Gracefully shut down all services
 */
export async function shutdownServices(): Promise<void> {
  try {
    // Stop the agent service
    stopAgentService();
    
    // Close database connections
    await databaseService.close();
  } catch (error) {
    console.error(`Error shutting down services: ${error}`);
  }
}