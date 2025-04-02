import express, { Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import WebSocket from 'ws';

import { registerRoutes } from './routes.js';
import { 
  databaseService, 
  initializeServices, 
  startAgentService, 
  getAgentStatus,
  shutdownServices 
} from './services/index.js';
import { setupVite, serveStatic, log } from './vite.js';
import { logService } from './services/common/LogService.js';
import { setLogService } from './vite.js';
import { eventBus } from './core/EventBus.js';
import { serviceRegistry } from './core/ServiceRegistry.js';
import { WebSocketMonitor } from './services/common/WebSocketMonitor.js';
import websocketStatsRouter from './routes/admin/websocket-stats.js';

// Constants
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 60000; // 10 minutes in milliseconds

// Create Express app
const app = express();
app.use(express.json()); // Add JSON body parsing middleware

// Create HTTP server explicitly
const httpServer = createServer(app);

// Initialize app
initializeApp();

// Graceful shutdown function
const gracefulShutdown = async () => {
  log('Graceful shutdown initiated...', 'server');
  
  try {
    // Stop all services
    await shutdownServices();
    
    // Close WebSocket server if it exists
    if ((global as any).wss) {
      log('Closing WebSocket server...', 'server');
      ((global as any).wss as WebSocket.Server).close();
    }
    
    // Close HTTP server if it exists
    if (httpServer) {
      log('Closing HTTP server...', 'server');
      await new Promise<void>((resolve, reject) => {
        httpServer.close((err) => {
          if (err) {
            log(`Error closing HTTP server: ${err}`, 'server');
            reject(err);
          } else {
            log('HTTP server closed successfully', 'server');
            resolve();
          }
        });
      });
    }
    
    log('Shutdown complete. Exiting process.', 'server');
  } catch (err) {
    log(`Error during shutdown: ${err}`, 'server');
  } finally {
    process.exit(0);
  }
};

// Register shutdown handlers
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

async function initializeApp(retryCount = 0): Promise<void> {
  try {
    log('Starting TrendDrop application...', 'server');
    
    // Broadcast initialization status to any connected clients
    const broadcastStatus = (status: string, message: string) => {
      const statusMsg = JSON.stringify({
        type: 'init_status',
        status,
        message,
        timestamp: new Date().toISOString()
      });
      
      if ((global as any).wsClients) {
        ((global as any).wsClients as Set<WebSocket>).forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(statusMsg);
          }
        });
      }
    };
    
    // Initialize all services
    log('Initializing services...', 'server');
    broadcastStatus('initializing', 'Initializing application services...');
    
    const servicesInitialized = await initializeServices();
    if (!servicesInitialized) {
      const retryMsg = `Service initialization failed. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`;
      log(retryMsg, 'server');
      broadcastStatus('error', retryMsg);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
      } else {
        log('Max initialization retries reached. Exiting.', 'server');
        process.exit(1);
      }
      return;
    }
    
    // Connect LogService to the central logger
    setLogService(logService);
    
    // Register API routes
    log('Registering API routes...', 'server');
    await registerRoutes(app);
    
    // Setup error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      log(`Error: ${err.message}`, 'server');
    });
    
    // Setup WebSocket server
    setupWebSocketServer(httpServer);
    
    // Setup Vite or static file serving
    if (process.env.NODE_ENV === 'development') {
      await setupVite(app, httpServer);
    } else {
      serveStatic(app);
    }
    
    // Initialize WebSocket monitor
    const wsMonitor = WebSocketMonitor.getInstance();
    wsMonitor.initialize();
    
    // Start the server
    const port = parseInt(process.env.PORT || '5001', 10);
    const host = process.env.HOST || '0.0.0.0';
    
    httpServer.listen(port, host, () => {
      log(`TrendDrop application running on port ${port} and host ${host}`, 'server');
      
      // Start the agent service
      log('Starting agent service...', 'server');
      startAgentService();
    });

    // Inside the server setup/routes registration
    app.use('/api/admin/websocket-stats', websocketStatsRouter);
  } catch (error) {
    log(`Error initializing application: ${error}`, 'server');
    if (retryCount < MAX_RETRIES) {
      log(`Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`, 'server');
      setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
    } else {
      log('Max initialization retries reached. Exiting.', 'server');
      process.exit(1);
    }
  }
}

// Setup WebSocket server
function setupWebSocketServer(server: Server): void {
  // Setup WebSocket server with improved reliability
  const wss = new WebSocket.Server({ 
    server,
    path: '/ws',
    clientTracking: true,
    maxPayload: 1024 * 1024, // 1MB max payload,
    // WebSocket server inherits sessions from Express
    verifyClient: (info, callback) => {
      // Get session cookie from the request
      const cookies = info.req.headers.cookie;
      if (!cookies) {
        callback(false, 401, 'Unauthorized: No session cookie');
        return;
      }
      
      // For production, verify the session matches one in your session store
      // This is a basic example - implement proper session verification
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('connect.sid='));
      if (!sessionCookie) {
        callback(false, 401, 'Unauthorized: Invalid session');
        return;
      }
      
      // For more secure implementations:
      // 1. Parse the session ID from the cookie
      // 2. Verify it against your session store
      // 3. Check if the user has permission to connect
      
      // Allow connection to proceed
      callback(true);
    }
  });
  
  // Store active WebSocket connections with metadata
  const clients = new Map<WebSocket, {
    id: string,
    connectedAt: Date,
    lastActivity: Date,
    isAlive: boolean,
    clientInfo: Record<string, any>,
    messageCount: number,
    lastMessageTime: number,
    rateLimit: {
      messages: number,
      interval: number, // milliseconds
      lastResetTime: number
    }
  }>();
  
  // Client heartbeat detection system
  const heartbeat = (ws: WebSocket) => {
    const client = clients.get(ws);
    if (client) {
      client.isAlive = true;
      client.lastActivity = new Date();
    }
  };
  
  // Rate limiting function to prevent abuse
  const checkRateLimit = (ws: WebSocket): boolean => {
    const client = clients.get(ws);
    if (!client) return false;
    
    const now = Date.now();
    
    // Reset counter if interval has passed
    if (now - client.rateLimit.lastResetTime > client.rateLimit.interval) {
      client.rateLimit.messages = 0;
      client.rateLimit.lastResetTime = now;
    }
    
    // Increment message count
    client.rateLimit.messages++;
    
    // Check if rate limit exceeded (default: 30 messages per 5 seconds)
    if (client.rateLimit.messages > 30) {
      log(`Rate limit exceeded for client ${client.id}`, 'websocket');
      return false;
    }
    
    return true;
  };
  
  // Ping all clients every 30 seconds to keep connections alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach(ws => {
      const client = clients.get(ws);
      if (client && !client.isAlive) {
        // Client didn't respond to previous ping
        log(`Closing inactive WebSocket: ${client.id}`, 'websocket');
        clients.delete(ws);
        return ws.terminate();
      }
      
      // Mark as not alive until we get a pong response
      if (client) {
        client.isAlive = false;
      }
      
      // Send ping (handled automatically by WebSocket protocol)
      try {
        ws.ping();
      } catch (error) {
        log(`Error sending ping: ${error}`, 'websocket');
        clients.delete(ws);
        ws.terminate();
      }
    });
  }, 30000);
  
  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(pingInterval);
  });
  
  // Handle WebSocket connections
  wss.on("connection", (ws, req) => {
    const clientId = `client-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const clientIp = req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    log(`WebSocket client connected: ${clientId} (${clientIp}, ${userAgent})`, 'websocket');
    
    // Store client info
    clients.set(ws, {
      id: clientId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isAlive: true,
      clientInfo: {
        ip: clientIp,
        userAgent,
        url: req.url
      },
      messageCount: 0,
      lastMessageTime: Date.now(),
      rateLimit: {
        messages: 0,
        interval: 5000, // 5 seconds
        lastResetTime: Date.now()
      }
    });
    
    // Emit connection event for monitoring
    eventBus.publish('ws:connection', {
      clientId,
      clientIp,
      userAgent,
      timestamp: new Date().toISOString()
    });
    
    // Send initial state to client
    ws.send(JSON.stringify({ 
      type: "connection_established", 
      clientId: clientId,
      message: "Connected to TrendDrop real-time updates",
      databaseStatus: "connected",
      agentStatus: "initializing",
      timestamp: new Date().toISOString()
    }));
    
    // Setup pong response handler (client is still alive)
    ws.on('pong', () => {
      heartbeat(ws);
    });
    
    // Handle messages from client
    ws.on("message", (message) => {
      try {
        // Update client activity timestamp
        const client = clients.get(ws);
        if (client) {
          client.lastActivity = new Date();
          client.isAlive = true;
          client.messageCount++;
          client.lastMessageTime = Date.now();
        }
        
        // Check rate limiting
        if (!checkRateLimit(ws)) {
          // Rate limit exceeded, send warning and ignore message
          ws.send(JSON.stringify({
            type: "error",
            code: "RATE_LIMIT_EXCEEDED",
            message: "You're sending messages too quickly. Please slow down.",
            timestamp: new Date().toISOString()
          }));
          
          // Emit rate limit event for monitoring
          eventBus.publish('ws:rate_limit_exceeded', {
            clientId: client?.id || clientId,
            timestamp: new Date().toISOString()
          });
          
          return;
        }
        
        const data = JSON.parse(message.toString());
        
        // Don't log ping messages to reduce noise
        if (data.type !== "ping") {
          log(`Received client message from ${clientId}: ${JSON.stringify(data)}`, 'websocket');
          
          // Emit message event for monitoring (except pings)
          eventBus.publish('ws:message', {
            clientId: client?.id || clientId,
            type: data.type,
            timestamp: new Date().toISOString()
          });
        }
        
        // Handle client_connected message by sending current agent status
        if (data.type === "client_connected") {
          log(`Received client_connected message from ${clientId}, sending agent status`, 'websocket');
          
          // Get current agent status
          const agentStatus = getAgentStatus();
          const statusMessage = {
            type: "agent_status",
            status: agentStatus.status || "started", // Default to started if undefined
            timestamp: new Date().toISOString(),
            message: "Agent service status update",
            lastRun: agentStatus.lastRun,
            nextRun: agentStatus.nextRun
          };
          
          // Update client info if provided
          if (data.clientId && client) {
            client.clientInfo.clientId = data.clientId;
          }
          
          log(`Sending status update to client ${clientId}`, 'websocket');
          ws.send(JSON.stringify(statusMessage));
        }
        
        // Handle ping messages with a pong response
        if (data.type === "ping") {
          try {
            const pongMessage = {
              type: "pong",
              timestamp: new Date().toISOString(),
              clientId: data.clientId || clientId
            };
            ws.send(JSON.stringify(pongMessage));
          } catch (error) {
            log(`Error sending pong response: ${error}`, 'websocket');
          }
        }
      } catch (error) {
        log(`Error processing WebSocket message: ${error}`, 'websocket');
      }
    });
    
    ws.on("close", (code, reason) => {
      const client = clients.get(ws);
      log(`WebSocket client disconnected: ${client?.id || 'unknown'} (Code: ${code}, Reason: ${reason})`, 'websocket');
      clients.delete(ws);
      
      // Emit disconnection event for monitoring
      eventBus.publish('ws:disconnection', {
        clientId: client?.id || 'unknown',
        code,
        reason,
        timestamp: new Date().toISOString()
      });
    });
    
    ws.on("error", (error) => {
      const client = clients.get(ws);
      log(`WebSocket error for client ${client?.id || 'unknown'}: ${error}`, 'websocket');
      clients.delete(ws);
      
      // Emit error event for monitoring
      eventBus.publish('ws:error', {
        clientId: client?.id || 'unknown',
        error: error.toString(),
        timestamp: new Date().toISOString()
      });
    });
    
    // Subscribe to EventBus for broadcasting updates
    eventBus.subscribe('agent:status', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({
            type: 'agent_status',
            ...data
          }));
        } catch (error) {
          log(`Error sending agent status update: ${error}`, 'websocket');
        }
      }
    });
  });

  // Expose WebSocket server to other modules for broadcasting
  (global as any).wss = wss;
  
  // Helper to broadcast from anywhere in the application
  (global as any).broadcastWebSocketMessage = (message: any) => {
    const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
    let clientCount = 0;
    
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          clientCount++;
        } catch (error) {
          log(`Error in global broadcast: ${error}`, 'websocket');
        }
      }
    });
    
    return clientCount; // Return number of clients message was sent to
  };
  
  // Register WebSocket service with the service registry
  serviceRegistry.register('webSocketServer', wss);
}