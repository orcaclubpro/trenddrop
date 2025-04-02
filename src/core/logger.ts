/**
 * Logger Service
 * 
 * This service is responsible for providing logging functionality
 * throughout the application.
 */

import { injectable, inject } from 'inversify';
import { TYPES } from './types';
import { Config } from './config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  data?: Record<string, any>;
}

/**
 * Logger service - provides application-wide logging
 */
@injectable()
export class Logger {
  constructor(
    @inject(TYPES.Config) private config: Config
  ) {}
  
  /**
   * Log a debug message
   * @param message Log message
   * @param source Source of the log (e.g., 'database', 'server', etc.)
   * @param data Additional data to log
   */
  debug(message: string, source?: string, data?: Record<string, any>): void {
    this.log('debug', message, source, data);
  }
  
  /**
   * Log an info message
   * @param message Log message
   * @param source Source of the log (e.g., 'database', 'server', etc.)
   * @param data Additional data to log
   */
  info(message: string, source?: string, data?: Record<string, any>): void {
    this.log('info', message, source, data);
  }
  
  /**
   * Log a warning message
   * @param message Log message
   * @param source Source of the log (e.g., 'database', 'server', etc.)
   * @param data Additional data to log
   */
  warn(message: string, source?: string, data?: Record<string, any>): void {
    this.log('warn', message, source, data);
  }
  
  /**
   * Log an error message
   * @param message Log message
   * @param source Source of the log (e.g., 'database', 'server', etc.)
   * @param data Additional data to log
   */
  error(message: string, source?: string, data?: Record<string, any>): void {
    this.log('error', message, source, data);
  }
  
  /**
   * Internal logging method
   * @param level Log level
   * @param message Log message
   * @param source Source of the log
   * @param data Additional data
   */
  private log(level: LogLevel, message: string, source?: string, data?: Record<string, any>): void {
    // Don't log if logging is disabled
    if (!this.config.get<boolean>('logging.enabled', true)) {
      return;
    }
    
    // Don't log if the level is below the configured level
    const configLevel = this.config.get<LogLevel>('logging.level', 'info');
    if (!this.shouldLog(level, configLevel)) {
      return;
    }
    
    // Create log entry
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(source && { source }),
      ...(data && { data })
    };
    
    // Output log
    const format = this.config.get<string>('logging.format', 'json');
    switch (format) {
      case 'json':
        console.log(JSON.stringify(entry));
        break;
      case 'text':
      default:
        let logMessage = `${entry.timestamp} [${entry.level.toUpperCase()}]`;
        if (entry.source) {
          logMessage += ` [${entry.source}]`;
        }
        logMessage += `: ${entry.message}`;
        if (entry.data) {
          logMessage += ` - ${JSON.stringify(entry.data)}`;
        }
        
        switch (level) {
          case 'debug':
          case 'info':
            console.log(logMessage);
            break;
          case 'warn':
            console.warn(logMessage);
            break;
          case 'error':
            console.error(logMessage);
            break;
        }
    }
  }
  
  /**
   * Check if a log entry should be logged based on the configured level
   * @param entryLevel The level of the log entry
   * @param configLevel The configured log level
   */
  private shouldLog(entryLevel: LogLevel, configLevel: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    return levels[entryLevel] >= levels[configLevel];
  }
}