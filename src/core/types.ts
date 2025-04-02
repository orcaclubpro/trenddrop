/**
 * Type definitions and constants for the dependency injection container
 */

export const TYPES = {
  // Core services
  EventEmitter: Symbol.for('EventEmitter'),
  Config: Symbol.for('Config'),
  Logger: Symbol.for('Logger'),
  EventBus: Symbol.for('EventBus'),
  
  // Data services
  Database: Symbol.for('Database'),
  
  // Business services - will be implemented in Phase 2
  ProductService: Symbol.for('ProductService'),
  RegionService: Symbol.for('RegionService'),
  TrendService: Symbol.for('TrendService'),
  VideoService: Symbol.for('VideoService'),
  
  // Agent services - will be implemented in Phase 3
  AIAgentService: Symbol.for('AIAgentService'),
  WebSearchService: Symbol.for('WebSearchService'),
  ProductVerificationService: Symbol.for('ProductVerificationService'),
  LLMService: Symbol.for('LLMService'),
  
  // UI services - will be implemented in Phase 4
  WebSocketService: Symbol.for('WebSocketService'),
  
  // Repository services - will be implemented in Phase 2
  ProductRepository: Symbol.for('ProductRepository'),
  RegionRepository: Symbol.for('RegionRepository'),
  TrendRepository: Symbol.for('TrendRepository'),
  VideoRepository: Symbol.for('VideoRepository'),
  
  // Controllers - will be implemented in Phase 3
  ProductController: Symbol.for('ProductController'),
  RegionController: Symbol.for('RegionController'),
  TrendController: Symbol.for('TrendController'),
  VideoController: Symbol.for('VideoController'),
  AgentController: Symbol.for('AgentController')
};