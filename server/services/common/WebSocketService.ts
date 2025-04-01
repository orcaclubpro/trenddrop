/**
 * WebSocketService - Unified WebSocket management
 * 
 * This service handles WebSocket connections, client management and message broadcasting.
 */

import WebSocket from 'ws';
import { Server } from 'http';
import { eventBus } from '../../core/EventBus.js';
import { log } from '../../vite.js';

// Client information type
interface ClientInfo {
  id: string;
  connectedAt: Date;
  lastActivity: Date;
  isAlive: boolean;
  clientInfo: Record<string, any>;
}

// WebSocket message type
export interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketService {
  private static instance: WebSocketService;
  private wss: WebSocket.Server | null = null;
  private clients = new Map<WebSocket, ClientInfo>();
  private pingInterval?: NodeJS.Timeout;
  private isInitialized = false;

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
    if (this.isInitialized) {
      log('WebSocket service already initialized', 'ws-service');
      return true;
    }

    try {
      // Create WebSocket server
      this.wss = new WebSocket.Server({
        server,
        path: '/ws',
        clientTracking: true,
        maxPayload: 1024 * 1024 // 1MB
      });

      // Setup connection handler
      this.wss.on('connection', this.handleConnection.bind(this));

      // Setup ping interval for heartbeat
      this.pingInterval = setInterval(this.pingClients.bind(this), 30000);

      // Setup close handler
      this.wss.on('close', () => {
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
        }
      });

      this.isInitialized = true;
      log('WebSocket service initialized successfully', 'ws-service');
      return true;
    } catch (error) {
      log(`Error initializing WebSocket service: ${error}`, 'ws-service');
      return false;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const clientIp = req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    log(`WebSocket client connected: ${clientId} (${clientIp})`, 'ws-service');

    // Store client info
    this.clients.set(ws, {
      id: clientId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isAlive: true,
      clientInfo: {
        ip: clientIp,
        userAgent,
        url: req.url
      }
    });

    // Send initial state to client
    ws.send(JSON.stringify({
      type: "connection_established",
      clientId: clientId,
      message: "Connected to TrendDrop real-time updates",
      timestamp: new Date().toISOString()
    }));

    // Setup pong response handler
    ws.on('pong', () => {
      this.heartbeat(ws);
    });

    // Handle client messages
    ws.on('message', (message) => {
      try {
        // Update client activity timestamp
        const client = this.clients.get(ws);
        if (client) {
          client.lastActivity = new Date();
        }

        // Parse message
        const parsedMessage = JSON.parse(message.toString()) as WebSocketMessage;
        
        // Handle client_connected message
        if (parsedMessage.type === 'client_connected') {
          log(`Received client_connected message from ${clientId}`, 'ws-service');
          
          // Publish event for services to respond
          eventBus.publish('ws:client_connected', { clientId, ws });
          
          // No need to broadcast this message
          return;
        }
        
        // Forward message to event bus
        eventBus.publish(`ws:message:${parsedMessage.type}`, { 
          message: parsedMessage, 
          clientId,
          ws
        });
        
        // Also publish to a general message event
        eventBus.publish('ws:message', { 
          message: parsedMessage, 
          clientId,
          ws
        });
      } catch (error) {
        log(`Error processing WebSocket message: ${error}`, 'ws-service');
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      log(`WebSocket client disconnected: ${clientId}`, 'ws-service');
      this.clients.delete(ws);
      
      // Publish client disconnected event
      eventBus.publish('ws:client_disconnected', { clientId });
    });

    // Handle errors
    ws.on('error', (error) => {
      log(`WebSocket error for client ${clientId}: ${error}`, 'ws-service');
      
      // Publish error event
      eventBus.publish('ws:error', { clientId, error });
    });
  }

  /**
   * Update client heartbeat
   */
  private heartbeat(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (client) {
      client.isAlive = true;
      client.lastActivity = new Date();
    }
  }

  /**
   * Ping all clients to check aliveness
   */
  private pingClients(): void {
    this.clients.forEach((client, ws) => {
      if (!client.isAlive) {
        log(`Closing inactive WebSocket: ${client.id}`, 'ws-service');
        this.clients.delete(ws);
        return ws.terminate();
      }

      // Mark as not alive until pong received
      client.isAlive = false;

      // Send ping
      try {
        ws.ping();
      } catch (error) {
        log(`Error sending ping: ${error}`, 'ws-service');
        this.clients.delete(ws);
        ws.terminate();
      }
    });

    // Broadcast status to all clients every 30 seconds
    this.broadcastAgentStatus();
  }

  /**
   * Broadcast a message to all connected clients
   */
  public broadcast(message: WebSocketMessage): number {
    if (!this.isInitialized || !this.wss) {
      log('WebSocket service not initialized', 'ws-service');
      return 0;
    }

    const messageStr = JSON.stringify(message);
    let clientCount = 0;

    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
        clientCount++;
      }
    });

    return clientCount;
  }

  /**
   * Send a message to a specific client
   */
  public sendToClient(clientId: string, message: WebSocketMessage): boolean {
    let sent = false;

    this.clients.forEach((client, ws) => {
      if (client.id === clientId && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
        sent = true;
      }
    });

    return sent;
  }

  /**
   * Get the number of connected clients
   */
  public getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Get client information
   */
  public getClientInfo(): { count: number, clients: any[] } {
    const clientList = Array.from(this.clients.entries()).map(([ws, info]) => ({
      id: info.id,
      connectedAt: info.connectedAt,
      lastActivity: info.lastActivity,
      ip: info.clientInfo.ip,
      userAgent: info.clientInfo.userAgent,
      readyState: ws.readyState
    }));

    return {
      count: this.clients.size,
      clients: clientList
    };
  }

  /**
   * Broadcast the current agent status to all clients
   */
  private broadcastAgentStatus(): void {
    // This will be filled in later when integrated with the agent service
    const agentStatus = {
      type: 'agent_status',
      status: 'running',
      timestamp: new Date().toISOString()
    };

    // Publish the agent status to the event bus
    eventBus.publish('agent:status', agentStatus);
    
    // The actual broadcast will be handled by event subscribers
  }

  /**
   * Shutdown the WebSocket service
   */
  public shutdown(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }

    this.clients.clear();
    this.isInitialized = false;
    log('WebSocket service shutdown', 'ws-service');
  }
}

// Export singleton instance
export const webSocketService = WebSocketService.getInstance();

// Export default for convenience
export default webSocketService;