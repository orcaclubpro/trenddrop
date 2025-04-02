/**
 * Controller Exports
 * 
 * This file exports all controller instances for easy access.
 */

// Export controller instances
export { productController } from './ProductController.js';
export { trendController } from './TrendController.js';
export { regionController } from './RegionController.js';
export { videoController } from './VideoController.js';
export { agentController } from './AgentController.js';

// Create and export LogController instance
import { LogController } from './LogController.js';
export const logController = new LogController();

// Export controller classes
export { ProductController } from './ProductController.js';
export { TrendController } from './TrendController.js';
export { RegionController } from './RegionController.js';
export { VideoController } from './VideoController.js';
export { AgentController } from './AgentController.js';
export { LogController } from './LogController.js';