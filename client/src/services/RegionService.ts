/**
 * Region Service
 * 
 * This service handles region-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';
import type { Region, InsertRegion } from '@shared/schema';

export class RegionService {
  /**
   * Get regions for a product
   */
  static async getRegionsForProduct(productId: number) {
    return apiRequest<Region[]>(API.REGIONS_FOR_PRODUCT(productId));
  }

  /**
   * Create a new region
   */
  static async createRegion(region: InsertRegion) {
    return apiRequest<Region>(API.REGIONS, {
      method: 'POST',
      body: JSON.stringify(region),
      queryKey: [API.REGIONS, region.productId]
    });
  }

  /**
   * Get top regions
   */
  static async getTopRegions(limit: number = 5) {
    return apiRequest<{ regionName: string; count: number }[]>(`${API.REGIONS}/top?limit=${limit}`);
  }

  /**
   * Calculate geographic spread for a product
   */
  static async calculateGeographicSpread(productId: number) {
    return apiRequest<{ spread: number }>(`${API.REGIONS_FOR_PRODUCT(productId)}/spread`);
  }

  /**
   * Get region data formatted for maps
   */
  static async getRegionMapData(productId: number) {
    return apiRequest<{
      regions: { country: string; interestLevel: number }[];
      average: number;
      max: number;
    }>(`${API.REGIONS_FOR_PRODUCT(productId)}/map`);
  }
}