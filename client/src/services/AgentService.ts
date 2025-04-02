/**
 * Agent Service
 * 
 * This service handles agent-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';

// Extend RequestInit to include queryKey for the apiRequest function
interface ExtendedRequestInit extends RequestInit {
  queryKey?: string[];
}

export type AgentStateType = 'idle' | 'product_discovery' | 'trend_analysis' | 'error' | 'completed';

export interface AgentStatus {
  status: AgentStateType;
  message: string;
  progress: number;
  error?: string;
  lastRun?: string;
  productsFound?: number;
  totalProducts?: number;
  currentPhase?: string;
  isRunning?: boolean;
  agentState?: {
    currentState: AgentStateType;
    totalProductsAdded: number;
    maxProducts: number;
  };
  productDiscovery?: {
    discoveredProducts: number;
    validatedProducts: number;
  };
  aiCapabilities?: {
    openai: boolean;
    lmstudio: boolean;
    aiInitialized: boolean;
  };
}

export class AgentService {
  /**
   * Get agent status
   */
  static async getStatus() {
    return apiRequest<AgentStatus>(`${API.AI_AGENT}/status`);
  }

  /**
   * Start the agent
   */
  static async startAgent(options?: {
    mode?: 'discovery_only' | 'analysis_only' | 'complete';
    targetCount?: number;
  }) {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/start`,
      {
        method: 'POST',
        body: options ? JSON.stringify(options) : undefined,
        queryKey: [API.AI_AGENT]
      } as ExtendedRequestInit
    );
  }

  /**
   * Stop the agent
   */
  static async stopAgent() {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/stop`,
      {
        method: 'POST',
        queryKey: [API.AI_AGENT]
      } as ExtendedRequestInit
    );
  }

  /**
   * Trigger a scraping task
   */
  static async triggerScraping(options: { 
    categories?: string[]; 
    count?: number;
    searchTerms?: string[];
    mode?: 'discovery_only' | 'analysis_only' | 'complete';
  } = {}) {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/scrape`,
      {
        method: 'POST',
        body: JSON.stringify(options),
        queryKey: [API.AI_AGENT]
      } as ExtendedRequestInit
    );
  }

  /**
   * Get agent configuration
   */
  static async getAgentConfig() {
    return apiRequest<{
      providers: {
        openai: boolean;
        lmStudio: boolean;
        grok: boolean;
      };
      autoUpdateInterval: number;
      scraperOptions: {
        maxProductsPerRun: number;
        defaultCategories: string[];
        maxProducts: number;
      };
    }>(`${API.AI_AGENT}/config`);
  }

  /**
   * Update agent configuration
   */
  static async updateAgentConfig(config: {
    autoUpdateInterval?: number;
    scraperOptions?: {
      maxProductsPerRun?: number;
      defaultCategories?: string[];
      maxProducts?: number;
    };
  }) {
    return apiRequest<{ success: boolean }>(`${API.AI_AGENT}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
      queryKey: [API.AI_AGENT]
    } as ExtendedRequestInit);
  }
  
  /**
   * Reset agent database counter (for testing purposes)
   */
  static async resetAgentCounter() {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/reset-counter`,
      {
        method: 'POST',
        queryKey: [API.AI_AGENT]
      } as ExtendedRequestInit
    );
  }
}