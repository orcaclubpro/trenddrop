/**
 * WebSocketEventHandler - Handle database events and push to WebSocket clients
 * 
 * This service listens for database events and sends real-time updates to
 * connected WebSocket clients.
 */

import { eventBus } from '../../core/EventBus.js';
import { webSocketService } from './WebSocketService.js';
import { log } from '../../vite.js';

export class WebSocketEventHandler {
  private static instance: WebSocketEventHandler;
  private isInitialized = false;
  private entityTypes = ['product', 'trend', 'region', 'video'];
  private eventTypes = ['created', 'updated', 'deleted'];

  private constructor() {}

  /**
   * Get the singleton instance
   */
  public static getInstance(): WebSocketEventHandler {
    if (!WebSocketEventHandler.instance) {
      WebSocketEventHandler.instance = new WebSocketEventHandler();
    }
    return WebSocketEventHandler.instance;
  }

  /**
   * Initialize the WebSocket event handler
   */
  public initialize(): boolean {
    if (this.isInitialized) {
      return true;
    }
    
    log('Initializing WebSocket event handler', 'ws-event-handler');
    
    // Set up event listeners for database events
    this.setupEventListeners();
    
    this.isInitialized = true;
    log('WebSocket event handler initialized', 'ws-event-handler');
    return true;
  }

  /**
   * Set up event listeners for database events
   */
  private setupEventListeners(): void {
    // Listen for database connection events
    eventBus.subscribe('db:connected', () => {
      this.broadcastDatabaseStatus('connected');
    });
    
    eventBus.subscribe('db:disconnected', () => {
      this.broadcastDatabaseStatus('disconnected');
    });
    
    eventBus.subscribe('db:reconnected', () => {
      this.broadcastDatabaseStatus('reconnected');
    });
    
    // Listen for entity events
    for (const entity of this.entityTypes) {
      for (const eventType of this.eventTypes) {
        // Listen for repository events
        eventBus.subscribe(`${entity}:${eventType}`, (data) => {
          this.broadcastEntityEvent(entity, eventType, data);
        });
        
        // Listen for service layer events
        eventBus.subscribe(`${entity}:${eventType}:service`, (data) => {
          this.broadcastEntityEvent(entity, eventType, data, true);
        });
      }
    }
    
    // Listen for AI agent events
    eventBus.subscribe('ai-agent:status', (data) => {
      this.broadcastAIAgentStatus(data);
    });
    
    eventBus.subscribe('product:verification:complete', (data) => {
      if (data.qualityScore >= 90) {
        this.broadcastHighQualityProductVerified(data);
      }
    });
    
    // Listen for application events
    eventBus.subscribe('app:startup:complete', (data) => {
      this.broadcastApplicationEvent('startup_complete', data);
    });
    
    eventBus.subscribe('app:startup:failed', (data) => {
      this.broadcastApplicationEvent('startup_failed', data);
    });
    
    eventBus.subscribe('app:shutdown:begin', (data) => {
      this.broadcastApplicationEvent('shutdown_begin', data);
    });
    
    eventBus.subscribe('app:shutdown:complete', (data) => {
      this.broadcastApplicationEvent('shutdown_complete', data);
    });
  }

  /**
   * Broadcast database status events
   */
  private broadcastDatabaseStatus(status: string, data: any = {}): void {
    webSocketService.broadcast({
      type: 'database_status',
      status,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Broadcast entity events (create, update, delete)
   */
  private broadcastEntityEvent(
    entity: string, 
    eventType: string, 
    data: any = {}, 
    fromService = false
  ): void {
    const eventSource = fromService ? 'service' : 'repository';
    
    webSocketService.broadcast({
      type: 'entity_event',
      entity,
      eventType,
      source: eventSource,
      timestamp: new Date().toISOString(),
      ...data
    });
    
    // Also broadcast a specific event type for direct subscriptions
    webSocketService.broadcast({
      type: `${entity}_${eventType}`,
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Broadcast AI agent status updates
   */
  private broadcastAIAgentStatus(data: any = {}): void {
    webSocketService.broadcast({
      type: 'ai_agent_status',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Broadcast when a high-quality product is verified
   */
  private broadcastHighQualityProductVerified(data: any = {}): void {
    webSocketService.broadcast({
      type: 'high_quality_product_verified',
      timestamp: new Date().toISOString(),
      ...data
    });
  }

  /**
   * Broadcast application events
   */
  private broadcastApplicationEvent(eventType: string, data: any = {}): void {
    webSocketService.broadcast({
      type: 'application_event',
      eventType,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

// Export singleton instance
export const webSocketEventHandler = WebSocketEventHandler.getInstance();

// Export default for convenience
export default webSocketEventHandler;