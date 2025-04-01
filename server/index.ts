import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import WebSocket from 'ws';

import { initializeDatabase } from './initialize.js';
import { registerRoutes } from './routes.js';
import databaseService from './services/database-service.js';
import { startAgentService, getAgentStatus } from './services/agent-service.js';
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
    
    log(`Attempting database initialization (attempt ${retryCount + 1})...`);
    broadcastStatus('initializing', `Attempting database initialization (attempt ${retryCount + 1})...`);
    
    const initialized = await databaseService.initialize();

    if (!initialized) {
      const retryMsg = `Database initialization failed. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`;
      log(retryMsg);
      broadcastStatus('error', retryMsg);
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
        return;
      } else {
        throw new Error("Max database initialization retries reached.");
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

    // Setup WebSocket server for real-time updates with explicit path
    const wss = new WebSocket.Server({ 
      server,
      path: '/ws' // Match client-side connection path
    });
    
    // Store active WebSocket connections
    const clients = new Set<WebSocket>();
    
    // Handle WebSocket connections
    wss.on("connection", (ws, req) => {
      log(`WebSocket client connected: ${req.url}`);
      clients.add(ws);
      
      // Send initial state to client
      ws.send(JSON.stringify({ 
        type: "connection_established", 
        message: "Connected to TrendDrop real-time updates",
        databaseStatus: "connected",
        agentStatus: "initializing"
      }));
      
      // Handle messages from client
      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message.toString());
          log(`Received client message: ${JSON.stringify(data)}`);
          
          // Handle client_connected message by sending current agent status
          if (data.type === "client_connected") {
            log("Received client_connected message, sending agent status");
            
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
            
            log(`Sending status update to client: ${JSON.stringify(statusMessage)}`);
            ws.send(JSON.stringify(statusMessage));
          }
        } catch (error) {
          log(`Error processing WebSocket message: ${error}`);
        }
      });
      
      ws.on("close", () => {
        log("WebSocket client disconnected");
        clients.delete(ws);
      });
      
      ws.on("error", (error) => {
        log(`WebSocket error: ${error}`);
        clients.delete(ws);
      });
    });

    // Expose WebSocket clients to other modules
    (global as any).wsClients = clients;

    // Setup vite or static file serving
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the product tracking agent AFTER successful database initialization
    log("Starting agent service...");
    startAgentService();
    
    // Broadcast agent start to all connected clients
    const startMessage = JSON.stringify({
      type: "agent_status",
      status: "started",
      timestamp: new Date().toISOString()
    });
    
    // Log the number of connected clients
    log(`Broadcasting agent start message to ${clients.size} clients`);
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        log(`Sending agent_status message to client`);
        client.send(startMessage);
      } else {
        log(`Client not in OPEN state: ${client.readyState}`);
      }
    });
    
    // Set a periodic re-broadcast of status to catch any clients
    // that might have connected after the initial broadcast
    setInterval(() => {
      if (clients.size > 0) {
        log(`Re-broadcasting agent status to ${clients.size} clients`);
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(startMessage);
          }
        });
      }
    }, 5000); // Every 5 seconds

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