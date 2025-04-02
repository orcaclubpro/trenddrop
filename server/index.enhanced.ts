/**
 * TrendDrop Server - Enhanced Entry Point
 * 
 * This file is the enhanced main entry point for the TrendDrop server with
 * improved startup orchestration, error handling, and dependency management.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import session from 'express-session';
import { eventBus } from './core/EventBus.js';
import { appOrchestrator } from './core/AppOrchestrator.js';
import { enhancedDatabaseService } from './services/common/EnhancedDatabaseService.js';
import { webSocketService } from './services/common/WebSocketService.js';
import { webSocketEventHandler } from './services/common/WebSocketEventHandler.js';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';
import { enhancedAIAgentService, initializeEnhancedAIAgent, startEnhancedAIAgent } from './services/ai/EnhancedAIAgentService.js';

// Constants
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const SESSION_SECRET = process.env.SESSION_SECRET || 'trenddrop-secret-key';

// Initialize the application
initializeApp();

/**
 * Main application initialization function
 */
async function initializeApp(): Promise<void> {
  try {
    // Create Express app and HTTP server
    const app: Express = express();
    const server: Server = createServer(app);
    
    log('Starting TrendDrop application initialization...', 'express');
    
    // Configure basic middleware
    setupMiddleware(app);
    
    // Register app components with the orchestrator
    registerAppComponents(server);
    
    // Initialize the application with the orchestrator
    const success = await appOrchestrator.initialize(server);
    
    if (!success) {
      log('Application initialization failed', 'express');
      process.exit(1);
      return;
    }
    
    // Register API routes
    registerRoutes(app);
    
    // Set up Vite for development
    await setupVite(app, server);
    
    // Serve static files in production
    serveStatic(app);
    
    // Global error handler
    setupErrorHandler(app);
    
    // Start listening
    server.listen(PORT, HOST as string, () => {
      log(`TrendDrop application running on port ${PORT} and host ${HOST}`, 'express');
      
      // Now, start the AI agent if database is initialized
      if (enhancedDatabaseService.getHealthStatus().initialized) {
        startAIAgent();
      } else {
        // Set up a listener for database connection
        const dbConnectedListener = (data: any) => {
          log('Database connected, starting AI agent...', 'express');
          startAIAgent();
          eventBus.unsubscribe('db:connected', dbConnectedListener);
        };
        
        eventBus.subscribe('db:connected', dbConnectedListener);
      }
    });
  } catch (error) {
    log(`Fatal error during application initialization: ${error}`, 'express');
    process.exit(1);
  }
}

/**
 * Set up Express middleware
 */
function setupMiddleware(app: Express): void {
  // Parse JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Set up session
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
  }));
  
  // CORS headers
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });
  
  // Request logging
  app.use((req, res, next) => {
    log(`${req.method} ${req.path}`, 'express');
    next();
  });
}

/**
 * Register application components with the orchestrator
 */
function registerAppComponents(server: Server): void {
  // Register core components (database, WebSocket)
  appOrchestrator.registerCoreComponents();
  
  // Register WebSocket event handler
  appOrchestrator.registerComponent({
    name: 'websocket-event-handler',
    dependencies: ['websocket'],
    initialize: async () => {
      return webSocketEventHandler.initialize();
    }
  });
  
  // Register AI Agent
  appOrchestrator.registerComponent({
    name: 'ai-agent',
    dependencies: ['database', 'websocket'],
    initialize: async () => {
      return initializeEnhancedAIAgent();
    }
  });
}

/**
 * Set up global error handler
 */
function setupErrorHandler(app: Express): void {
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    const errorMessage = err.message || 'Internal Server Error';
    
    log(`Error: ${errorMessage}`, 'express');
    
    // Publish error event
    eventBus.publish('app:error', {
      statusCode,
      message: errorMessage,
      timestamp: new Date().toISOString()
    });
    
    // Send error response
    res.status(statusCode).json({
      error: {
        message: errorMessage,
        statusCode
      }
    });
  });
}

/**
 * Start the AI agent
 */
async function startAIAgent(): Promise<void> {
  try {
    log('Starting Enhanced AI Agent...', 'express');
    await startEnhancedAIAgent();
    log('Enhanced AI Agent started successfully', 'express');
  } catch (error) {
    log(`Error starting Enhanced AI Agent: ${error}`, 'express');
  }
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

async function handleShutdown(): Promise<void> {
  try {
    log('Received shutdown signal', 'express');
    await appOrchestrator.shutdown();
    log('Application shut down gracefully', 'express');
    process.exit(0);
  } catch (error) {
    log(`Error during shutdown: ${error}`, 'express');
    process.exit(1);
  }
}