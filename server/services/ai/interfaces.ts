/**
 * AI Service Interfaces
 * 
 * This file contains the interfaces used by the AI services.
 */

/**
 * Agent status response
 */
export interface AgentStatus {
  status: 'idle' | 'running' | 'error' | 'completed' | 'initializing';
  message: string;
  progress: number;
  error?: string;
  lastRun?: Date;
  productsFound?: number;
}

/**
 * LLM Service status
 */
export interface LLMStatus {
  available: boolean;
  provider: string;
  models: string[];
  preferredModel: string;
  error?: string;
}

/**
 * Product discovered by the AI agent
 */
export interface DiscoveredProduct {
  name: string;
  category: string;
  subcategory?: string;
  description: string;
  priceRangeLow: number;
  priceRangeHigh: number;
  trendScore?: number;
  engagementRate?: number;
  salesVelocity?: number;
  searchVolume?: number;
  geographicSpread?: number;
  aliexpressUrl?: string;
  cjdropshippingUrl?: string;
  imageUrl?: string;
  sourcePlatform?: string;
}

/**
 * Generic task response from LLM
 */
export interface TaskResponse<T> {
  result: T;
  raw: string;
}