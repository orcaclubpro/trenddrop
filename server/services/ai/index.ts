/**
 * AI Layer Services Export
 * 
 * This file exports all the AI layer services.
 */

// Export interfaces
export * from './interfaces.js';

// Export services
export { default as llmService } from './llm-service.js';
export { default as webSearchService } from './web-search-service.js';
export { default as trendAnalysisService } from './trend-analysis-service.js';
export { default as aiAgentService } from './ai-agent-service.js';

// Export functions for external use
export {
  initializeAIAgent,
  startAIAgent,
  stopAIAgent,
  getAIAgentStatus
} from './ai-agent-service.js';