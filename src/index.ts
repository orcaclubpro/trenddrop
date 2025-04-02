/**
 * TrendDrop Core Module
 * 
 * This file exports all the core components of the TrendDrop application.
 */

// Export core services
export { TYPES } from './core/types';
export { Config } from './core/config';
export { Logger, type LogLevel, type LogEntry } from './core/logger';
export { 
  type EventBus, 
  type EventCallback,
  EventBusImpl,
  createEventBus
} from './core/event-bus';
export { container, buildContainer } from './core/container';

// Export data services
export { Database, type DatabaseStatus } from './data/database';