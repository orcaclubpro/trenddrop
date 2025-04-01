/**
 * TrendDrop Server - Main Entry Point
 * 
 * This file is the main entry point for the TrendDrop server.
 */

import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer, Server } from 'http';
import { eventBus } from './core/EventBus.js';
import { serviceRegistry } from './core/ServiceRegistry.js';
import { databaseService, webSocketService, startAgentService } from './services/index.js';
import { registerRoutes } from './routes.js';
import { setupVite, serveStatic, log } from './vite.js';

async function initializeApp(retryCount = 0): Promise<void> {
  try {
    log('Initializing TrendDrop server...', 'server');
    
    // Create Express app
    const app: Express = express();
    
    // Configure middleware
    app.use(express.json());
    
    // Create HTTP server
    const server: Server = createServer(app);
    
    // Register services in the registry
    serviceRegistry.register('eventBus', eventBus);
    serviceRegistry.register('webSocketService', webSocketService);
    serviceRegistry.register('databaseService', databaseService);
    
    // Initialize database
    log('Initializing database service...', 'server');
    const dbInitialized = await databaseService.initialize();
    
    if (!dbInitialized) {
      if (retryCount < 5) {
        log(`Database initialization failed, retrying (${retryCount + 1}/5)...`, 'server');
        setTimeout(() => initializeApp(retryCount + 1), 10000);
        return;
      } else {
        log('Database initialization failed after multiple attempts', 'server');
        // Continue without database, error will be displayed to the client
      }
    }
    
    // Initialize WebSocket service
    log('Initializing WebSocket service...', 'server');
    webSocketService.initialize(server);
    
    // Publish app initialized event
    eventBus.publish('app:initialized', {
      timestamp: new Date().toISOString()
    });
    
    // Register API routes
    await registerRoutes(app);
    
    // Setup Vite or static file serving
    if (process.env.NODE_ENV === 'production') {
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }
    
    // Add error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      log(`Error handling request: ${err}`, 'server');
      
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        status: err.status || 500
      });
    });
    
    // Determine port
    const port = process.env.PORT || 3000;
    
    // Start the server
    server.listen(port, () => {
      log(`TrendDrop server listening on port ${port}`, 'server');
      
      // Start agent service after server is running
      if (dbInitialized) {
        startAgentService();
      }
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      log('SIGTERM received, shutting down gracefully', 'server');
      
      // Close server
      server.close(() => {
        log('HTTP server closed', 'server');
        
        // Close database connection
        databaseService.close().then(() => {
          log('Database connection closed', 'server');
          process.exit(0);
        }).catch(err => {
          log(`Error closing database connection: ${err}`, 'server');
          process.exit(1);
        });
      });
    });
  } catch (error) {
    log(`Error initializing server: ${error}`, 'server');
    
    if (retryCount < 5) {
      log(`Retrying initialization (${retryCount + 1}/5)...`, 'server');
      setTimeout(() => initializeApp(retryCount + 1), 10000);
    } else {
      log('Server initialization failed after multiple attempts', 'server');
      process.exit(1);
    }
  }
}

// Start the application
initializeApp();