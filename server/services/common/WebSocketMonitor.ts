/**
 * WebSocketMonitor - Service for monitoring WebSocket connections
 * 
 * This service provides metrics and monitoring for WebSocket connections,
 * allowing for better visibility into connection health and performance.
 */

import { WebSocketService } from './WebSocketService.js';
import { log } from '../../vite.js';
import { eventBus } from '../../core/EventBus.js';

interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  connectionHistory: Array<{
    timestamp: Date;
    count: number;
  }>;
  messageCount: number;
  errorCount: number;
  disconnectCount: number;
  rateLimitExceeded: number;
  lastUpdated: Date;
}

export class WebSocketMonitor {
  private static instance: WebSocketMonitor;
  private isInitialized = false;
  private metricsInterval: NodeJS.Timeout | null = null;
  private metrics: ConnectionMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    connectionHistory: [],
    messageCount: 0,
    errorCount: 0,
    disconnectCount: 0,
    rateLimitExceeded: 0,
    lastUpdated: new Date()
  };
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): WebSocketMonitor {
    if (!WebSocketMonitor.instance) {
      WebSocketMonitor.instance = new WebSocketMonitor();
    }
    return WebSocketMonitor.instance;
  }
  
  /**
   * Initialize the WebSocket monitor
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }
    
    log('Initializing WebSocket monitor', 'ws-monitor');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Set up metrics collection interval
    this.setupMetricsCollection();
    
    this.isInitialized = true;
    log('WebSocket monitor initialized', 'ws-monitor');
    return true;
  }
  
  /**
   * Set up event listeners for connection events
   */
  private setupEventListeners(): void {
    // Listen for connection events
    eventBus.subscribe('ws:connection', () => {
      this.metrics.totalConnections++;
      this.metrics.activeConnections++;
      this.updateConnectionHistory();
    });
    
    // Listen for disconnection events
    eventBus.subscribe('ws:disconnection', () => {
      this.metrics.activeConnections = Math.max(0, this.metrics.activeConnections - 1);
      this.metrics.disconnectCount++;
      this.updateConnectionHistory();
    });
    
    // Listen for message events
    eventBus.subscribe('ws:message', () => {
      this.metrics.messageCount++;
    });
    
    // Listen for error events
    eventBus.subscribe('ws:error', () => {
      this.metrics.errorCount++;
    });
    
    // Listen for rate limit events
    eventBus.subscribe('ws:rate_limit_exceeded', () => {
      this.metrics.rateLimitExceeded++;
    });
    
    // Listen for app shutdown
    eventBus.subscribe('app:shutdown', () => {
      this.shutdown();
    });
  }
  
  /**
   * Set up metrics collection interval
   */
  private setupMetricsCollection(): void {
    // Clear any existing interval
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    
    // Collect metrics every minute
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 60000);
  }
  
  /**
   * Update connection history
   */
  private updateConnectionHistory(): void {
    const now = new Date();
    
    this.metrics.connectionHistory.push({
      timestamp: now,
      count: this.metrics.activeConnections
    });
    
    // Keep history for the last 24 hours
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.metrics.connectionHistory = this.metrics.connectionHistory.filter(
      (item) => item.timestamp > oneDayAgo
    );
    
    this.metrics.lastUpdated = now;
  }
  
  /**
   * Collect metrics from WebSocket service
   */
  private collectMetrics(): void {
    const wsService = WebSocketService.getInstance();
    
    // Update active connections
    this.metrics.activeConnections = wsService.getClientCount();
    
    // Update history
    this.updateConnectionHistory();
    
    // Broadcast metrics for monitoring
    this.broadcastMetrics();
  }
  
  /**
   * Broadcast metrics to admin clients
   */
  private broadcastMetrics(): void {
    eventBus.publish('ws:metrics', {
      ...this.metrics,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Shutdown the monitor
   */
  public shutdown(): void {
    log('Shutting down WebSocket monitor...', 'ws-monitor');
    
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    this.isInitialized = false;
    log('WebSocket monitor shut down', 'ws-monitor');
  }
} 