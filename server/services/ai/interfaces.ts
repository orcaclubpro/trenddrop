/**
 * AI Layer Interfaces
 * 
 * This file contains common interfaces used across the AI layer components.
 */

import { InsertProduct, InsertTrend, InsertRegion, InsertVideo } from '@shared/schema.js';

// Re-export schema types for use in the AI layer
export { InsertProduct, InsertTrend, InsertRegion, InsertVideo };

/**
 * Interface for different LLM provider endpoints
 */
export interface LLMEndpoint {
  url: string;
  headers?: Record<string, string>;
  model?: string;
}

/**
 * Defines the source platform for trend data
 */
export type SourcePlatform = 'TikTok' | 'Instagram' | 'Facebook' | 'Pinterest' | 'YouTube' | 'Other';

/**
 * Interface for a product with validation status
 */
export interface DiscoveredProduct extends InsertProduct {
  validationSources?: ProductValidationSource[];
  validationScore?: number; // 0-100 score of how confident we are that this is a valid product
  metrics?: ProductMetrics;
}

/**
 * Interface for validation information
 */
export interface ProductValidationSource {
  source: 'AliExpress' | 'CJDropshipping' | 'Alibaba' | 'DHGate' | 'Other';
  url: string;
  priceUSD?: number;
  verified: boolean;
  verificationMethod: 'direct' | 'ai' | 'manual';
  timestamp: Date;
}

/**
 * Metrics used to calculate trend score
 */
export interface ProductMetrics {
  engagementScores: {
    tiktok?: number; // 0-100
    instagram?: number; // 0-100
    facebook?: number; // 0-100
    pinterest?: number; // 0-100
    youtube?: number; // 0-100
  };
  salesData: {
    estimatedVolume?: number; // estimated units sold
    growthRate?: number; // percentage growth
    restockFrequency?: number; // days between restocks
  };
  searchData: {
    volumeScore?: number; // 0-100
    growthTrend?: number; // percentage growth in searches
  };
  sentimentScore?: number; // -100 to 100, negative to positive
  supplierAvailability?: number; // number of suppliers carrying the product
}

/**
 * Status information for agents
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
 * Search result from a web search
 */
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
}

/**
 * Social media post information
 */
export interface SocialMediaPost {
  platform: SourcePlatform;
  url?: string;
  text?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
  };
  date?: Date;
}