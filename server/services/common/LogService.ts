/**
 * LogService - Manage application logs
 * 
 * This service stores recent logs and allows broadcasting them to clients.
 */

import { webSocketService } from './WebSocketService.js';
import { log } from '../../vite.js';

// Maximum number of logs to keep in memory
const MAX_LOGS = 1000;

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'debug';
}

/**
 * LogService class
 */
export class LogService {
  private static instance: LogService;
  private logs: LogEntry[] = [];
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }
  
  /**
   * Add a log entry
   */
  public addLog(source: string, message: string, level: 'info' | 'warn' | 'error' | 'debug' = 'info'): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      source,
      message,
      level
    };
    
    // Add to logs array
    this.logs.unshift(entry);
    
    // Trim logs if necessary
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }
    
    // Broadcast to clients
    this.broadcastLog(entry);
  }
  
  /**
   * Get recent logs
   */
  public getRecentLogs(limit: number = 100, source?: string): LogEntry[] {
    if (source) {
      return this.logs
        .filter(entry => entry.source === source)
        .slice(0, limit);
    }
    return this.logs.slice(0, limit);
  }
  
  /**
   * Broadcast log entry to all connected clients
   */
  private broadcastLog(entry: LogEntry): void {
    webSocketService.broadcast({
      type: 'log_entry',
      entry
    });
  }
  
  /**
   * Clear all logs
   */
  public clearLogs(): void {
    this.logs = [];
    webSocketService.broadcast({
      type: 'logs_cleared',
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Register a log interceptor for standard logging
   */
  public registerLogInterceptor(): void {
    // Save the original log function
    const originalLog = global.console.log;
    const originalWarn = global.console.warn;
    const originalError = global.console.error;
    
    // Override the log function
    global.console.log = (message: any, ...args: any[]) => {
      originalLog.apply(console, [message, ...args]);
      
      try {
        // Extract source from log message if it follows our format
        const logMessageStr = String(message);
        const matches = logMessageStr.match(/\[(.*?)\](.*)/);
        
        if (matches && matches.length >= 3) {
          const source = matches[1].trim();
          const actualMessage = matches[2].trim();
          this.addLog(source, actualMessage, 'info');
        } else {
          // For unformatted logs, use "system" as the source
          this.addLog('system', logMessageStr, 'info');
        }
      } catch (error) {
        // Don't let errors in logging affect the application
        originalLog.apply(console, ['Error in log interceptor:', error]);
      }
    };
    
    // Override the warn function
    global.console.warn = (message: any, ...args: any[]) => {
      originalWarn.apply(console, [message, ...args]);
      
      try {
        this.addLog('system', String(message), 'warn');
      } catch (error) {
        originalLog.apply(console, ['Error in warn interceptor:', error]);
      }
    };
    
    // Override the error function
    global.console.error = (message: any, ...args: any[]) => {
      originalError.apply(console, [message, ...args]);
      
      try {
        this.addLog('system', String(message), 'error');
      } catch (error) {
        originalLog.apply(console, ['Error in error interceptor:', error]);
      }
    };
    
    log('Log interceptor registered', 'log-service');
  }
}

// Export singleton instance
export const logService = LogService.getInstance();

// Export default for convenience
export default logService; 