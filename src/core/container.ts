/**
 * IoC Container
 * 
 * This file sets up the dependency injection container for the application.
 * It registers all services and their dependencies.
 */

import { Container } from 'inversify';
import { EventEmitter } from 'events';

import { TYPES } from './types';
import { Config } from './config';
import { Logger } from './logger';
import { EventBus, EventBusImpl, createEventBus } from './event-bus';

/**
 * Configure and build the IoC container
 */
export function buildContainer(): Container {
  const container = new Container({
    defaultScope: 'Singleton'
  });
  
  configureContainer(container);
  
  return container;
}

/**
 * Configure the container with all services
 */
function configureContainer(container: Container): void {
  // Register core services
  registerCoreServices(container);
  
  // Register data services
  registerDataServices(container);
  
  // Register data access layer
  // This will be implemented in Phase 2
  // registerRepositories(container);
  
  // Register business services
  // This will be implemented in Phase 2
  // registerBusinessServices(container);
  
  // Register agent system
  // This will be implemented in Phase 3
  // registerAgentSystem(container);
  
  // Register API controllers
  // This will be implemented in Phase 3
  // registerControllers(container);
}

/**
 * Register core services
 */
function registerCoreServices(container: Container): void {
  // Create EventEmitter instance
  const eventEmitter = new EventEmitter();
  // Set max listeners to a higher number to avoid Node.js warnings
  eventEmitter.setMaxListeners(50);
  
  // Bind EventEmitter as constant value
  container.bind<EventEmitter>(TYPES.EventEmitter)
    .toConstantValue(eventEmitter);
  
  // Bind Config as singleton
  container.bind<Config>(TYPES.Config)
    .to(Config)
    .inSingletonScope();
  
  // Bind Logger as singleton
  container.bind<Logger>(TYPES.Logger)
    .to(Logger)
    .inSingletonScope();
  
  // Get instances from container
  const config = container.get<Config>(TYPES.Config);
  const logger = container.get<Logger>(TYPES.Logger);
  
  // Create EventBus instance
  const eventBus = createEventBus(logger);
  
  // Bind EventBus as constant value
  container.bind<EventBus>(TYPES.EventBus)
    .toConstantValue(eventBus);
}

/**
 * Register data services
 */
function registerDataServices(container: Container): void {
  // We'll handle database registration outside of this function
  // to avoid duplicate bindings
}

// Create container
export const container = buildContainer();

// Initialize database asynchronously (will be available after promise resolves)
import('../data/database').then(module => {
  // Check if already bound to avoid duplicate bindings
  if (!container.isBound(TYPES.Database)) {
    container.bind<any>(TYPES.Database)
      .to(module.Database)
      .inSingletonScope();
    
    console.log('Database service registered');
  }
}).catch(error => {
  console.error('Failed to import Database module:', error);
});