/**
 * Service Exports
 * 
 * This file exports all service classes for easy access.
 */

// Export common services
export { webSocketService } from './common/WebSocketService.js';
export { default as databaseService } from './database-service.js';

// Export domain services
export { productService } from './ProductService.js';
export { trendService } from './TrendService.js';
export { regionService } from './RegionService.js';
export { videoService } from './VideoService.js';
export { agentService } from './AgentService.js';

// Export service classes
export { ProductService } from './ProductService.js';
export { TrendService } from './TrendService.js';
export { RegionService } from './RegionService.js';
export { VideoService } from './VideoService.js';
export { AgentService } from './AgentService.js';

// Export agent control functions
export {
  startAgentService,
  stopAgentService,
  triggerScraping,
  getAgentStatus
} from './AgentService.js';