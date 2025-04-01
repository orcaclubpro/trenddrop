/**
 * Trend Service
 * 
 * This service handles trend-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';
import type { Trend, InsertTrend } from '@shared/schema';

export class TrendService {
  /**
   * Get trends for a product
   */
  static async getTrendsForProduct(productId: number) {
    return apiRequest<Trend[]>(API.TRENDS_FOR_PRODUCT(productId));
  }

  /**
   * Create a new trend
   */
  static async createTrend(trend: InsertTrend) {
    return apiRequest<Trend>(API.TRENDS, {
      method: 'POST',
      body: JSON.stringify(trend),
      queryKey: [API.TRENDS, trend.productId]
    });
  }

  /**
   * Get trend velocities for products
   */
  static async getTrendVelocities(productIds: number[]) {
    return apiRequest<{ productId: number, velocity: number }[]>(
      `${API.TRENDS}/velocities`,
      {
        method: 'POST',
        body: JSON.stringify({ productIds })
      }
    );
  }

  /**
   * Get trend analysis for a product
   */
  static async getTrendAnalysis(productId: number) {
    return apiRequest<{
      engagementTrend: 'up' | 'down' | 'stable';
      salesTrend: 'up' | 'down' | 'stable';
      searchTrend: 'up' | 'down' | 'stable';
      overallTrend: 'up' | 'down' | 'stable';
      averageGrowthRate: number;
      forecastNextMonth: number;
    }>(`${API.TRENDS_FOR_PRODUCT(productId)}/analysis`);
  }

  /**
   * Get trend data formatted for charts
   */
  static async getTrendChartData(productId: number) {
    return apiRequest<{
      dates: string[];
      engagement: number[];
      sales: number[];
      search: number[];
    }>(`${API.TRENDS_FOR_PRODUCT(productId)}/chart`);
  }
}