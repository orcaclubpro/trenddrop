import express, { Request, Response, NextFunction } from 'express';
import { Server } from 'http';
import WebSocket from 'ws';

import { initializeDatabase } from './initialize.js';
import { registerRoutes } from './routes.js';
import databaseService from './services/database-service.js';
import { startAgentService } from './services/agent-service.js';
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
    log(`Attempting database initialization (attempt ${retryCount + 1})...`);
    const initialized = await databaseService.initialize();

    if (!initialized) {
      if (retryCount < MAX_RETRIES) {
        log(`Database initialization failed. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`);
        setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
        return;
      } else {
        throw new Error("Max database initialization retries reached.");
      }
    }

    // Database initialization successful, now start the application
    log("Database initialized successfully. Starting application...");
    
    // Register routes first
    const server = await registerRoutes(app);

    // Setup error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
      console.error(`Error: ${err.message}`);
    });

    // Setup WebSocket server for real-time updates
    const wss = new WebSocket.Server({ server });
    
    // Store active WebSocket connections
    const clients = new Set<WebSocket>();
    
    // Handle WebSocket connections
    wss.on("connection", (ws) => {
      log("WebSocket client connected");
      clients.add(ws);
      
      // Send initial state to client
      ws.send(JSON.stringify({ 
        type: "connection_established", 
        message: "Connected to TrendDrop real-time updates",
        databaseStatus: "connected",
        agentStatus: "initializing"
      }));
      
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
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(startMessage);
      }
    });

    // Start the server
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0"
    }, () => {
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