/**
 * WebSocketService - Manage WebSocket connections
 * 
 * This service handles WebSocket connections and message broadcasting
 * for real-time updates in the TrendDrop application.
 */

import WebSocket from 'ws';
import { Server } from 'http';
import { eventBus } from '../../core/EventBus.js';
import { log } from '../../vite.js';

/**
 * WebSocket client type
 */
interface WSClient extends WebSocket {
  isAlive?: boolean;
  clientId?: string;
  clientType?: string;
  connectedAt?: Date;
  lastActivity?: Date;
}

/**
 * WebSocketService class
 */
export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocket.Server | null = null;
  private isInitialized = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private clients: Set<WSClient> = new Set();
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }
  
  /**
   * Initialize the WebSocket service
   */
  public initialize(server: Server): boolean {
    try {
      if (this.isInitialized) {
        return true;
      }
      
      // Create WebSocket server
      this.wss = new WebSocket.Server({ server });
      
      // Set up connection handler
      this.setupConnectionHandler();
      
      // Set up heartbeat
      this.setupHeartbeat();
      
      // Set up event listeners
      this.setupEventListeners();
      
      this.isInitialized = true;
      log('WebSocket service initialized', 'websocket');
      
      return true;
    } catch (error) {
      log(`WebSocket service initialization error: ${error}`, 'websocket');
      return false;
    }
  }
  
  /**
   * Set up the connection handler
   */
  private setupConnectionHandler(): void {
    if (!this.wss) return;
    
    this.wss.on('connection', (ws: WSClient) => {
      // Initialize client
      ws.isAlive = true;
      ws.clientId = this.generateClientId();
      ws.connectedAt = new Date();
      ws.lastActivity = new Date();
      
      log(`Client connected: ${ws.clientId}`, 'websocket');
      
      // Add to clients set
      this.clients.add(ws);
      
      // Broadcast updated client count
      this.broadcastClientCount();
      
      // Set up message handler
      ws.on('message', (message: WebSocket.Data) => {
        ws.lastActivity = new Date();
        this.handleMessage(ws, message);
      });
      
      // Set up close handler
      ws.on('close', () => {
        this.clients.delete(ws);
        log(`Client disconnected: ${ws.clientId}`, 'websocket');
        
        // Broadcast updated client count
        this.broadcastClientCount();
      });
      
      // Set up error handler
      ws.on('error', (error) => {
        log(`WebSocket error for client ${ws.clientId}: ${error}`, 'websocket');
      });
      
      // Set up pong handler for heartbeat
      ws.on('pong', () => {
        ws.isAlive = true;
        ws.lastActivity = new Date();
      });
    });
  }
  
  /**
   * Set up heartbeat to detect and clean up stale connections
   */
  private setupHeartbeat(): void {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Set up heartbeat interval (30 seconds)
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      
      this.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          // Connection is stale, terminate it
          log(`Terminating stale connection: ${ws.clientId}`, 'websocket');
          ws.terminate();
          this.clients.delete(ws);
          return;
        }
        
        // Mark as not alive until pong received
        ws.isAlive = false;
        ws.ping();
      });
      
      // Broadcast updated client count
      this.broadcastClientCount();
    }, 30000);
  }
  
  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    eventBus.subscribe('app:shutdown', () => {
      this.shutdown();
    });
  }
  
  /**
   * Handle incoming messages
   */
  private handleMessage(ws: WSClient, message: WebSocket.Data): void {
    try {
      const data = JSON.parse(message.toString());
      log(`Received message from client ${ws.clientId}: ${JSON.stringify(data)}`, 'websocket');
      
      // Handle client identification
      if (data.type === 'client_connected') {
        ws.clientType = data.clientType || 'unknown';
        log(`Client ${ws.clientId} identified as type: ${ws.clientType}`, 'websocket');
        
        // Send current application state
        this.sendInitialState(ws);
      }
      
      // Publish message as event
      eventBus.publish('ws:message', {
        clientId: ws.clientId,
        clientType: ws.clientType,
        data
      });
    } catch (error) {
      log(`Error handling message: ${error}`, 'websocket');
    }
  }
  
  /**
   * Send initial application state to client
   */
  private sendInitialState(ws: WSClient): void {
    // Send AI agent status
    eventBus.publish('ai_agent:request_status', {
      clientId: ws.clientId,
      clientType: ws.clientType
    });
    
    // Send database status
    eventBus.publish('db:request_status', {
      clientId: ws.clientId,
      clientType: ws.clientType
    });
  }
  
  /**
   * Broadcast message to all clients
   */
  public broadcast(data: any): void {
    if (this.clients.size === 0) {
      return;
    }
    
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    log(`Broadcasting message to ${this.clients.size} clients: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`, 'websocket');
    
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  /**
   * Send message to a specific client
   */
  public sendToClient(clientId: string, data: any): boolean {
    const message = typeof data === 'string' ? data : JSON.stringify(data);
    
    for (const client of this.clients) {
      if (client.clientId === clientId && client.readyState === WebSocket.OPEN) {
        client.send(message);
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Broadcast client count
   */
  private broadcastClientCount(): void {
    this.broadcast({
      type: 'client_count',
      count: this.clients.size,
      timestamp: new Date().toISOString()
    });
    
    eventBus.publish('ws:client_count', {
      count: this.clients.size,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Generate a unique client ID
   */
  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }
  
  /**
   * Get client information (for monitoring/debugging)
   */
  public getClientInfo(): any[] {
    return Array.from(this.clients).map(client => ({
      id: client.clientId,
      type: client.clientType || 'unknown',
      connectedAt: client.connectedAt,
      lastActivity: client.lastActivity,
      isAlive: client.isAlive
    }));
  }
  
  /**
   * Shutdown the WebSocket service
   */
  public shutdown(): void {
    log('Shutting down WebSocket service...', 'websocket');
    
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Close all client connections
    this.clients.forEach((client) => {
      try {
        client.terminate();
      } catch (error) {
        // Ignore errors when closing
      }
    });
    
    // Clear clients set
    this.clients.clear();
    
    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.isInitialized = false;
    log('WebSocket service shut down', 'websocket');
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();

// Export default for convenience
export default webSocketService;