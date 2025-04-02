import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import WebSocket from 'ws';

import { initializeDatabase } from './initialize.js';
import { registerRoutes } from './routes.js';
import databaseService from './services/database-service.js';
import { startAgentService, getAgentStatus } from './services/agent-service.js';
import { initializeAIAgent, getAIAgentStatus } from './services/ai-agent-service.js';
import { setupVite, serveStatic, log } from './vite.js';

// Constants
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 600000; // 10 minutes in milliseconds

// Create Express app
const app = express();

// Initialize app
initializeApp();

async function initializeApp(retryCount = 0): Promise<void> {
  try {
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
    
    log(`Attempting database initialization (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
    broadcastStatus('initializing', `Attempting database initialization (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
    
    try {
      const initialized = await databaseService.initialize();

      if (!initialized) {
        const retryMsg = `Database initialization failed. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`;
        log(retryMsg);
        broadcastStatus('error', retryMsg);
        
        if (retryCount < MAX_RETRIES) {
          // Send more detailed status to clients with retry countdown
          const retryStatusMsg = JSON.stringify({
            type: 'database_status',
            status: 'retry_scheduled',
            timestamp: new Date().toISOString(),
            message: `Database connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}). Will retry in ${RETRY_INTERVAL / 1000 / 60} minutes.`,
            retryIn: RETRY_INTERVAL / 1000,
            attempt: retryCount + 1,
            maxRetries: MAX_RETRIES
          });
          
          if ((global as any).wsClients) {
            ((global as any).wsClients as Set<WebSocket>).forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(retryStatusMsg);
              }
            });
          }
          
          setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
          return;
        } else {
          throw new Error("Max database initialization retries reached.");
        }
      }
    } catch (error) {
      log(`Database initialization error: ${error}`);
      broadcastStatus('error', `Database error: ${error}`);
      
      if (retryCount < MAX_RETRIES) {
        const retryMsg = `Database error occurred. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes... (${retryCount + 1}/${MAX_RETRIES})`;
        log(retryMsg);
        
        setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
        return;
      } else {
        throw new Error(`Max database initialization retries reached. Last error: ${error}`);
      }
    }

    // Database initialization successful, now start the application
    const successMsg = "Database initialized successfully. Starting application...";
    log(successMsg);
    broadcastStatus('success', successMsg);
    
    // Register routes first
    const server = await registerRoutes(app);

    // Setup error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(`Error: ${err.message}`);
    });

    // Setup WebSocket server with improved reliability
    const wss = new WebSocket.Server({ 
      server,
      path: '/ws',
      // Increase the ping timeout for better reliability
      clientTracking: true,
      // Allow more connections (default is 10)
      maxPayload: 1024 * 1024, // 1MB max payload
    });
    
    // Store active WebSocket connections with metadata
    const clients = new Map<WebSocket, {
      id: string,
      connectedAt: Date,
      lastActivity: Date,
      isAlive: boolean,
      clientInfo: Record<string, any>
    }>();
    
    // Client heartbeat detection system
    const heartbeat = (ws: WebSocket) => {
      const client = clients.get(ws);
      if (client) {
        client.isAlive = true;
        client.lastActivity = new Date();
      }
    };
    
    // Ping all clients every 30 seconds to keep connections alive
    const pingInterval = setInterval(() => {
      wss.clients.forEach(ws => {
        const client = clients.get(ws);
        if (client && !client.isAlive) {
          // Client didn't respond to previous ping
          log(`Closing inactive WebSocket: ${client.id}`);
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
          log(`Error sending ping: ${error}`);
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
      
      log(`WebSocket client connected: ${clientId} (${clientIp}, ${userAgent})`);
      
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
        }
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
          }
          
          const data = JSON.parse(message.toString());
          
          // Don't log ping messages to reduce noise
          if (data.type !== "ping") {
            log(`Received client message from ${clientId}: ${JSON.stringify(data)}`);
          }
          
          // Handle client_connected message by sending current agent status
          if (data.type === "client_connected") {
            log(`Received client_connected message from ${clientId}, sending agent status`);
            
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
            
            log(`Sending status update to client ${clientId}`);
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
              log(`Error sending pong response: ${error}`);
            }
          }
        } catch (error) {
          log(`Error processing WebSocket message: ${error}`);
        }
      });
      
      ws.on("close", (code, reason) => {
        const client = clients.get(ws);
        log(`WebSocket client disconnected: ${client?.id || 'unknown'} (Code: ${code}, Reason: ${reason})`);
        clients.delete(ws);
      });
      
      ws.on("error", (error) => {
        const client = clients.get(ws);
        log(`WebSocket error for client ${client?.id || 'unknown'}: ${error}`);
        clients.delete(ws);
      });
    });

    // Expose WebSocket server to other modules for broadcasting
    (global as any).wss = wss;
    
    // Helper to broadcast from anywhere in the application
    (global as any).broadcastWebSocketMessage = (message: any) => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(messageStr);
          } catch (error) {
            log(`Error in global broadcast: ${error}`);
          }
        }
      });
      return wss.clients.size; // Return number of clients message was sent to
    };

    // Setup vite or static file serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the product tracking agent AFTER successful database initialization
    log("Starting agent service...");
    startAgentService();
    
    // Initialize the AI Agent Service
    log("Initializing AI Agent Service...");
    initializeAIAgent().then(success => {
      if (success) {
        log("AI Agent Service initialized successfully");
        // Broadcast AI agent status
        const aiAgentStatus = getAIAgentStatus();
        const aiStatusMessage = JSON.stringify({
          type: "ai_agent_status",
          status: "initialized",
          timestamp: new Date().toISOString(),
          aiAgentStatus
        });
        
        // Broadcast to all connected clients
        wss.clients.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN) {
            try {
              ws.send(aiStatusMessage);
            } catch (error) {
              log(`Error sending AI agent status: ${error}`);
            }
          }
        });
      } else {
        log("Failed to initialize AI Agent Service");
      }
    }).catch(error => {
      log(`Error initializing AI Agent Service: ${error}`);
    });
    
    // Broadcast agent start to all connected clients
    const startMessage = JSON.stringify({
      type: "agent_status",
      status: "started",
      timestamp: new Date().toISOString()
    });
    
    // Log the number of connected clients
    log(`Broadcasting agent start message to ${wss.clients.size} clients`);
    
    // Broadcast helper function
    const broadcastToClients = (message: string) => {
      wss.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
          } catch (error) {
            log(`Error broadcasting message: ${error}`);
            // The ws instance will be cleaned up by the heartbeat mechanism
          }
        }
      });
    };
    
    // Broadcast to all connected clients
    broadcastToClients(startMessage);
    
    // Set a periodic re-broadcast of status to catch any clients
    // that might have connected after the initial broadcast
    setInterval(() => {
      if (wss.clients.size > 0) {
        // Get latest status
        const agentStatus = getAgentStatus();
        const latestMessage = JSON.stringify({
          type: "agent_status",
          status: agentStatus.status || "running",
          timestamp: new Date().toISOString(),
          message: "Agent service status update",
          lastRun: agentStatus.lastRun,
          nextRun: agentStatus.nextRun
        });
        
        log(`Re-broadcasting agent status to ${wss.clients.size} clients`);
        broadcastToClients(latestMessage);
        
        // Also update connection stats for monitoring
        const connectionStats = {
          type: "connection_stats",
          timestamp: new Date().toISOString(),
          connectedClients: wss.clients.size,
          uptime: Math.floor(process.uptime()) // Server uptime in seconds
        };
        
        broadcastToClients(JSON.stringify(connectionStats));
      }
    }, 10000); // Every 10 seconds

    // Start the server
    const port = 5000;
    server.listen(port, "0.0.0.0", () => {
      log(`TrendDrop application running on port ${port} and host 0.0.0.0`);
    });
  } catch (error) {
    log(`Error initializing application: ${error}`);
    if (retryCount < MAX_RETRIES) {
      log(`Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`);
      setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
    } else {
      log("Max initialization retries reached. Exiting.");
      process.exit(1);
    }
  }
}

// Handle exit signals
process.on('SIGINT', () => {
  log('Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('Shutting down server...');
  process.exit(0);
});
