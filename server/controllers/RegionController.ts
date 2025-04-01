/**
 * RegionController - Handles region-related API routes
 * 
 * This controller handles all region-related HTTP requests.
 */

import { Request, Response } from 'express';
import { regionService } from '../services/index.js';
import * as schema from '../../shared/schema.js';
import { log } from '../vite.js';

export class RegionController {
  /**
   * Get regions for a product
   */
  async getRegionsForProduct(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Get regions from service
      const regions = await regionService.getRegionsForProduct(productId);
      
      // Process for map if requested
      if (req.query.format === 'map') {
        const mapData = regionService.processRegionDataForMap(regions);
        res.json(mapData);
        return;
      }
      
      // Return regions
      res.json({ regions });
    } catch (error) {
      log(`Error in getRegionsForProduct: ${error}`, 'region-controller');
      res.status(500).json({ error: 'Failed to retrieve regions' });
    }
  }

  /**
   * Create a new region
   */
  async createRegion(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate request body
      const regionResult = schema.insertRegionSchema.safeParse(req.body);
      
      if (!regionResult.success) {
        res.status(400).json({
          error: 'Invalid region data',
          details: regionResult.error.errors
        });
        return;
      }
      
      // Create region using service
      const newRegion = await regionService.createRegion(regionResult.data);
      
      // Return created region
      res.status(201).json(newRegion);
    } catch (error) {
      log(`Error in createRegion: ${error}`, 'region-controller');
      res.status(500).json({ error: 'Failed to create region' });
    }
  }

  /**
   * Get top regions
   */
  async getTopRegions(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 5;
      
      if (isNaN(limit) || limit < 1 || limit > 20) {
        res.status(400).json({ error: 'Invalid limit parameter' });
        return;
      }
      
      // Get top regions from service
      const topRegions = await regionService.getTopRegions(limit);
      
      // Return top regions
      res.json({ topRegions });
    } catch (error) {
      log(`Error in getTopRegions: ${error}`, 'region-controller');
      res.status(500).json({ error: 'Failed to retrieve top regions' });
    }
  }

  /**
   * Calculate geographic spread for a product
   */
  async calculateGeographicSpread(req: Request, res: Response): Promise<void> {
    try {
      const productId = Number(req.params.productId);
      
      if (isNaN(productId)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Calculate geographic spread using service
      const geographicSpread = await regionService.calculateGeographicSpread(productId);
      
      // Return geographic spread
      res.json({ geographicSpread });
    } catch (error) {
      log(`Error in calculateGeographicSpread: ${error}`, 'region-controller');
      res.status(500).json({ error: 'Failed to calculate geographic spread' });
    }
  }
}

// Export controller instance
export const regionController = new RegionController();

// Export default for convenience
export default regionController;