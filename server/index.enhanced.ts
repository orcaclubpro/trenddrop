/**
 * TrendDrop Server - Enhanced Entry Point
 * 
 * This file is the enhanced main entry point for the TrendDrop server with
 * improved startup orchestration, error handling, and dependency management.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { Server, createServer } from 'http';
import WebSocket from 'ws';
import { injectable, inject } from 'inversify';

// Import core services from the new architecture
import { 
  container, TYPES, Logger, 
  Config, Database, EventBus 
} from '../src';
import { log, setupVite, serveStatic } from './vite';

/**
 * Main application initialization function
 */
async function initializeApp(): Promise<void> {
  try {
    // Get core services from the container
    const logger = container.get<Logger>(TYPES.Logger);
    const config = container.get<Config>(TYPES.Config);
    const database = container.get<Database>(TYPES.Database);
    const eventBus = container.get<EventBus>(TYPES.EventBus);
    
    logger.info('Starting TrendDrop server...', 'server');
    
    // Initialize the database connection
    logger.info('Initializing database...', 'server');
    const dbInitialized = await database.initialize();
    
    if (!dbInitialized) {
      throw new Error('Failed to initialize database connection');
    }
    
    // Create Express app and HTTP server
    const app: Express = express();
    const server: Server = createServer(app);
    
    // Set up middleware
    setupMiddleware(app);
    
    // Set up static file serving for production builds
    serveStatic(app);
    
    // Set up Vite middleware for development
    await setupVite(app, server);
    
    // Set up WebSocket server
    setupWebSocketServer(server, eventBus, logger);
    
    // Register components
    registerAppComponents(server);
    
    // Set up error handler
    setupErrorHandler(app);
    
    // Start the server
    const port = config.get<number>('server.port', 3000);
    const host = config.get<string>('server.host', '0.0.0.0');
    
    server.listen(port, () => {
      logger.info(`Server listening on http://${host}:${port}`, 'server');
      
      // Start optional services
      startAIAgent();
    });
  } catch (error) {
    log(`Server initialization failed: ${error}`, 'server-error');
    process.exit(1);
  }
}

/**
 * Set up Express middleware
 */
function setupMiddleware(app: Express): void {
  // Basic middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Add request logging middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    log(`${req.method} ${req.url}`, 'express');
    next();
  });
}

/**
 * Register application components with the orchestrator
 */
function registerAppComponents(server: Server): void {
  // This will be implemented in later phases as needed
}

/**
 * Set up global error handler
 */
function setupErrorHandler(app: Express): void {
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const logger = container.get<Logger>(TYPES.Logger);
    
    logger.error(`Unhandled error: ${err.message}`, 'server', {
      stack: err.stack
    });
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred'
    });
  });
}

/**
 * Set up WebSocket server
 */
function setupWebSocketServer(server: Server, eventBus: EventBus, logger: Logger): WebSocket.Server {
  const wss = new WebSocket.Server({ server });
  
  wss.on('connection', (ws: WebSocket) => {
    logger.debug('WebSocket client connected', 'websocket');
    
    ws.on('message', (message: WebSocket.Data) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug(`Received message: ${JSON.stringify(data)}`, 'websocket');
        
        // Route the message to the appropriate handler
        switch (data.type) {
          case 'client-connected':
            logger.debug('Received client connected message', 'websocket');
            eventBus.publish('client:connected', { ws, data });
            break;
          default:
            logger.warn(`Unknown message type: ${data.type}`, 'websocket');
        }
      } catch (error) {
        logger.error(`Error processing WebSocket message: ${error}`, 'websocket');
      }
    });
    
    ws.on('close', () => {
      logger.debug('WebSocket client disconnected', 'websocket');
      eventBus.publish('client:disconnected', { ws });
    });
    
    ws.on('error', (error) => {
      logger.error(`WebSocket error: ${error}`, 'websocket');
    });
  });
  
  return wss;
}

/**
 * Start the AI agent
 */
async function startAIAgent(): Promise<void> {
  // This will be implemented in Phase 3
  const logger = container.get<Logger>(TYPES.Logger);
  logger.info('AI Agent will be initialized in Phase 3', 'agent');
}

/**
 * Handle graceful shutdown
 */
async function handleShutdown(server: Server, database: Database): Promise<void> {
  const logger = container.get<Logger>(TYPES.Logger);
  
  logger.info('Shutting down server...', 'server');
  
  // Close the HTTP server
  server.close(() => {
    logger.info('HTTP server closed', 'server');
  });
  
  // Close database connection
  try {
    await database.close();
    logger.info('Database connection closed', 'server');
  } catch (error) {
    logger.error(`Error closing database connection: ${error}`, 'server');
  }
  
  // Exit the process
  process.exit(0);
}

// Set up graceful shutdown handlers
process.on('SIGTERM', () => {
  log('SIGTERM received, shutting down...', 'server');
  // We don't have server and database instances in this scope yet
  // They will be properly handled in the handleShutdown function later
});

process.on('SIGINT', () => {
  log('SIGINT received, shutting down...', 'server');
  // We don't have server and database instances in this scope yet
  // They will be properly handled in the handleShutdown function later
});

// Start the application
initializeApp();