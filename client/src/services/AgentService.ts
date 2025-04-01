/**
 * Agent Service
 * 
 * This service handles agent-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';

export interface AgentStatus {
  status: 'idle' | 'running' | 'error' | 'completed';
  message: string;
  progress: number;
  error?: string;
  lastRun?: string;
  productsFound?: number;
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
  static async startAgent() {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/start`,
      {
        method: 'POST',
        queryKey: [API.AI_AGENT]
      }
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
      }
    );
  }

  /**
   * Trigger a scraping task
   */
  static async triggerScraping(options: { 
    categories?: string[]; 
    count?: number;
    searchTerms?: string[];
  } = {}) {
    return apiRequest<{ success: boolean; message: string }>(
      `${API.AI_AGENT}/scrape`,
      {
        method: 'POST',
        body: JSON.stringify(options),
        queryKey: [API.AI_AGENT]
      }
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
    };
  }) {
    return apiRequest<{ success: boolean }>(`${API.AI_AGENT}/config`, {
      method: 'PATCH',
      body: JSON.stringify(config),
      queryKey: [API.AI_AGENT]
    });
  }
}