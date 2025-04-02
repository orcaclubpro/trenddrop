/**
 * API Route Configuration
 * 
 * This file defines all API routes for the application.
 */

import { Express, Request, Response } from 'express';
import { Server } from 'http';
import * as controllers from './controllers/index.js';
import { log } from './vite.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // Create an API router
  log('Registering API routes...', 'routes');

  // Root API endpoint
  app.get('/api', (req: Request, res: Response) => {
    res.json({
      name: 'TrendDrop API',
      version: '1.0.0',
      endpoints: [
        '/api/products',
        '/api/categories',
        '/api/dashboard',
        '/api/agent'
      ]
    });
  });

  // Product routes
  app.get('/api/products', controllers.productController.getProducts.bind(controllers.productController));
  app.post('/api/products', controllers.productController.createProduct.bind(controllers.productController));
  app.get('/api/products/:id', controllers.productController.getProduct.bind(controllers.productController));
  app.put('/api/products/:id', controllers.productController.updateProduct.bind(controllers.productController));
  app.delete('/api/products/:id', controllers.productController.deleteProduct.bind(controllers.productController));

  // Category routes
  app.get('/api/categories', controllers.productController.getCategories.bind(controllers.productController));

  // Dashboard routes
  app.get('/api/dashboard', controllers.productController.getDashboardSummary.bind(controllers.productController));
  app.get('/api/dashboard/trends', controllers.trendController.getTrendsDashboard.bind(controllers.trendController));
  app.get('/api/dashboard/products', controllers.productController.getProductsDashboard.bind(controllers.productController));
  app.get('/api/dashboard/regions', controllers.regionController.getRegionsDashboard.bind(controllers.regionController));
  app.get('/api/dashboard/videos', controllers.videoController.getVideosDashboard.bind(controllers.videoController));

  // Trend routes
  app.get('/api/products/:productId/trends', controllers.trendController.getTrendsForProduct.bind(controllers.trendController));
  app.post('/api/trends', controllers.trendController.createTrend.bind(controllers.trendController));
  app.get('/api/products/:productId/trend-velocities', controllers.trendController.getTrendVelocities.bind(controllers.trendController));

  // Region routes
  app.get('/api/products/:productId/regions', controllers.regionController.getRegionsForProduct.bind(controllers.regionController));
  app.post('/api/regions', controllers.regionController.createRegion.bind(controllers.regionController));
  app.get('/api/top-regions', controllers.regionController.getTopRegions.bind(controllers.regionController));
  app.get('/api/products/:productId/geographic-spread', controllers.regionController.calculateGeographicSpread.bind(controllers.regionController));

  // Video routes
  app.get('/api/products/:productId/videos', controllers.videoController.getVideosForProduct.bind(controllers.videoController));
  app.post('/api/videos', controllers.videoController.createVideo.bind(controllers.videoController));
  app.get('/api/top-videos', controllers.videoController.getTopVideos.bind(controllers.videoController));
  app.get('/api/platform-distribution', controllers.videoController.getPlatformDistribution.bind(controllers.videoController));

  // Agent routes
  app.get('/api/agent/status', controllers.agentController.getStatus.bind(controllers.agentController));
  app.post('/api/agent/start', controllers.agentController.startAgent.bind(controllers.agentController));
  app.post('/api/agent/stop', controllers.agentController.stopAgent.bind(controllers.agentController));
  app.post('/api/agent/trigger-scraping', controllers.agentController.triggerScraping.bind(controllers.agentController));

  log('API routes registered successfully', 'routes');

  // Add error handler middleware
  app.use((err: any, req: Request, res: Response, next: any) => {
    log(`API Error: ${err.stack}`, 'routes');
    
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error',
      stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
    });
  });

  return app;
}

export default registerRoutes;