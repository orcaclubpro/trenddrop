/**
 * Log Service
 * 
 * This service handles log-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';

export interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
}

export interface LogsResponse {
  logs: LogEntry[];
}

export interface ClearLogsResponse {
  success: boolean;
  message: string;
}

export class LogService {
  /**
   * Get logs
   */
  static async getLogs(limit: number = 100, source?: string) {
    const queryParams = new URLSearchParams();
    
    // Add parameters
    if (limit) queryParams.append('limit', limit.toString());
    if (source) queryParams.append('source', source);
    
    const url = `${API.LOGS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return apiRequest(url);
  }

  /**
   * Clear logs
   */
  static async clearLogs() {
    return apiRequest(
      API.LOGS,
      {
        method: 'DELETE'
      }
    );
  }

  /**
   * Get logs filtered by source
   */
  static async getLogsBySource(source: string, limit: number = 100) {
    return this.getLogs(limit, source);
  }
} 