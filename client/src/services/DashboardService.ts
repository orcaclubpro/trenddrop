/**
 * Dashboard Service
 * 
 * This service handles dashboard-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';
import type { DashboardSummary, Product } from '@shared/schema';

export class DashboardService {
  /**
   * Get dashboard summary
   */
  static async getDashboardSummary() {
    return apiRequest<DashboardSummary>(API.DASHBOARD);
  }

  /**
   * Get trends summary for dashboard
   */
  static async getTrendsSummary() {
    return apiRequest<{
      totalTrends: number;
      averageTrendScore: number;
      risingCategories: { category: string; growth: number }[];
      topSearchTerms: { term: string; count: number }[];
    }>(`${API.DASHBOARD}/trends`);
  }

  /**
   * Get products summary for dashboard
   */
  static async getProductsSummary() {
    return apiRequest<{
      totalProducts: number;
      productsByCategory: { category: string; count: number }[];
      topTrending: Product[];
      recentlyAdded: Product[];
    }>(`${API.DASHBOARD}/products`);
  }

  /**
   * Get regions summary for dashboard
   */
  static async getRegionsSummary() {
    return apiRequest<{
      totalRegions: number;
      topRegions: { regionName: string; count: number }[];
      geoDistribution: { continent: string; count: number }[];
    }>(`${API.DASHBOARD}/regions`);
  }

  /**
   * Get videos summary for dashboard
   */
  static async getVideosSummary() {
    return apiRequest<{
      totalVideos: number;
      platformDistribution: { platform: string; count: number }[];
      topPerforming: { productName: string; views: number; likes: number }[];
    }>(`${API.DASHBOARD}/videos`);
  }
}