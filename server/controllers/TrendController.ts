/**
 * TrendController - Handles trend-related API routes
 * 
 * This controller handles all trend-related HTTP requests.
 */

import { Request, Response } from 'express';
import { trendService } from '../services/index.js';
import * as schema from '../../shared/schema.js';
import { log } from '../vite.js';

export class TrendController {
  /**
   * Get trends dashboard data
   */
  async getTrendsDashboard(req: Request, res: Response): Promise<void> {
    try {
      // Get trend metrics for dashboard
      const totalTrends = await trendService.getTotalTrendCount();
      const averageTrendScore = await trendService.getAverageTrendScore();
      
      // Get rising categories (categories with increasing trend scores)
      const risingCategories = await trendService.getRisingCategories();
      
      // Get top search terms
      const topSearchTerms = await trendService.getTopSearchTerms();
      
      // Get trend timeline (for time-series chart)
      const trendTimeline = await trendService.getTrendTimeline();
      
      // Return dashboard data
      res.json({
        totalTrends,
        averageTrendScore,
        risingCategories,
        topSearchTerms,
        trendTimeline
      });
    } catch (error) {
      log(`Error in getTrendsDashboard: ${error}`, 'trend-controller');
      res.status(500).json({ error: 'Failed to retrieve trends dashboard data' });
    }
  }
  
  /**
   * Get trends for a product
   */
  async getTrendsForProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Get trends from service
      const trends = await trendService.getTrendsForProduct(productId);
      
      // Process for chart if requested
      if (req.query.format === 'chart') {
        const chartData = trendService.processTrendDataForChart(trends);
        res.json(chartData);
        return;
      }
      
      // Return trends
      res.json({ trends });
    } catch (error) {
      log(`Error in getTrendsForProduct: ${error}`, 'trend-controller');
      res.status(500).json({ error: 'Failed to retrieve trends' });
    }
  }

  /**
   * Create a new trend
   */
  async createTrend(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate request body
      const trendResult = schema.insertTrendSchema.safeParse(req.body);
      
      if (!trendResult.success) {
        res.status(400).json({
          error: 'Invalid trend data',
          details: trendResult.error.errors
        });
        return;
      }
      
      // Create trend using service
      const newTrend = await trendService.createTrend(trendResult.data);
      
      // Return created trend
      res.status(201).json(newTrend);
    } catch (error) {
      log(`Error in createTrend: ${error}`, 'trend-controller');
      res.status(500).json({ error: 'Failed to create trend' });
    }
  }

  /**
   * Calculate trend velocities for a product
   */
  async getTrendVelocities(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Get trends from service
      const trends = await trendService.getTrendsForProduct(productId);
      
      // Calculate velocities
      const engagementVelocity = trendService.calculateEngagementVelocity(trends);
      const salesVelocity = trendService.calculateSalesVelocity(trends);
      const searchVelocity = trendService.calculateSearchVelocity(trends);
      
      // Return velocities
      res.json({
        engagementVelocity,
        salesVelocity,
        searchVelocity
      });
    } catch (error) {
      log(`Error in getTrendVelocities: ${error}`, 'trend-controller');
      res.status(500).json({ error: 'Failed to calculate trend velocities' });
    }
  }
}

// Export controller instance
export const trendController = new TrendController();

// Export default for convenience
export default trendController;