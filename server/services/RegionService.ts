/**
 * RegionService - Business logic for regions
 * 
 * This service handles region-related operations and business logic.
 */

import { regionRepository } from '../repositories/index.js';
import * as schema from '../../shared/schema.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class RegionService {
  /**
   * Get regions for a product
   */
  async getRegionsForProduct(productId: number): Promise<schema.Region[]> {
    try {
      return await regionRepository.findByProductId(productId);
    } catch (error) {
      log(`Error getting regions for product: ${error}`, 'region-service');
      throw error;
    }
  }

  /**
   * Create a new region record
   */
  async createRegion(regionData: schema.InsertRegion): Promise<schema.Region> {
    try {
      const newRegion = await regionRepository.create(regionData);
      
      // Notify that geographic spread needs to be recalculated
      eventBus.publish('region:metrics:update', {
        productId: regionData.productId,
        timestamp: new Date().toISOString()
      });
      
      return newRegion;
    } catch (error) {
      log(`Error creating region: ${error}`, 'region-service');
      throw error;
    }
  }

  /**
   * Process region data for map visualization
   */
  processRegionDataForMap(regions: schema.Region[]): {
    regionNames: string[];
    interestLevels: number[];
    colors: string[];
  } {
    // Sort regions by interest level (descending)
    const sortedRegions = [...regions].sort((a, b) => b.interestLevel - a.interestLevel);
    
    // Extract data for map
    const regionNames = sortedRegions.map(region => region.regionName);
    const interestLevels = sortedRegions.map(region => region.interestLevel);
    
    // Generate colors based on interest level
    const colors = interestLevels.map(level => this.getColorForInterestLevel(level));
    
    return {
      regionNames,
      interestLevels,
      colors
    };
  }

  /**
   * Get color for interest level (for visualization)
   */
  private getColorForInterestLevel(level: number): string {
    if (level >= 80) return '#FF4D4D'; // High interest (red)
    if (level >= 60) return '#FFA64D'; // Medium-high interest (orange)
    if (level >= 40) return '#FFDD4D'; // Medium interest (yellow)
    if (level >= 20) return '#85FF4D'; // Medium-low interest (light green)
    return '#4DFFD2';                  // Low interest (teal)
  }

  /**
   * Calculate geographic spread for a product
   */
  async calculateGeographicSpread(productId: number): Promise<number> {
    try {
      return await regionRepository.calculateGeographicSpread(productId);
    } catch (error) {
      log(`Error calculating geographic spread: ${error}`, 'region-service');
      throw error;
    }
  }

  /**
   * Get top regions
   */
  async getTopRegions(limit: number = 5): Promise<{ regionName: string; count: number }[]> {
    try {
      return await regionRepository.getTopRegions(limit);
    } catch (error) {
      log(`Error getting top regions: ${error}`, 'region-service');
      throw error;
    }
  }

  /**
   * Generate initial region data for a new product
   */
  generateInitialRegionData(productId: number, baseTrendScore: number): schema.InsertRegion[] {
    // Regions with population weights
    const regions = [
      { name: 'North America', weight: 1.0 },
      { name: 'Europe', weight: 0.9 },
      { name: 'Asia', weight: 1.2 },
      { name: 'Oceania', weight: 0.7 },
      { name: 'South America', weight: 0.8 },
      { name: 'Africa', weight: 0.6 }
    ];
    
    // Generate weighted interest levels based on trend score
    return regions.map(region => {
      // Calculate interest level with some randomness
      const baseInterest = baseTrendScore * 0.7 * region.weight;
      const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      const interestLevel = Math.min(100, Math.round(baseInterest * randomFactor));
      
      return {
        productId,
        regionName: region.name,
        interestLevel,
        regionCode: region.name.substring(0, 2).toUpperCase()
      };
    });
  }
}

// Export service instance
export const regionService = new RegionService();

// Export default for convenience
export default regionService;