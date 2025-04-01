/**
 * TrendService - Business logic for trends
 * 
 * This service handles trend-related operations and business logic.
 */

import { trendRepository } from '../repositories/index.js';
import * as schema from '../../shared/schema.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class TrendService {
  /**
   * Get trends for a product
   */
  async getTrendsForProduct(productId: number): Promise<schema.Trend[]> {
    try {
      return await trendRepository.findByProductId(productId);
    } catch (error) {
      log(`Error getting trends for product: ${error}`, 'trend-service');
      throw error;
    }
  }

  /**
   * Create a new trend record
   */
  async createTrend(trendData: schema.InsertTrend): Promise<schema.Trend> {
    try {
      const newTrend = await trendRepository.create(trendData);
      
      // Notify that trend metrics need to be recalculated
      eventBus.publish('trend:metrics:update', {
        productId: trendData.productId,
        timestamp: new Date().toISOString()
      });
      
      return newTrend;
    } catch (error) {
      log(`Error creating trend: ${error}`, 'trend-service');
      throw error;
    }
  }

  /**
   * Process trend data for chart visualization
   */
  processTrendDataForChart(trends: schema.Trend[]): {
    dates: string[];
    engagement: number[];
    sales: number[];
    search: number[];
  } {
    // Sort trends by date
    const sortedTrends = [...trends].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Extract data for charts
    const dates = sortedTrends.map(trend => {
      const date = new Date(trend.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    const engagement = sortedTrends.map(trend => trend.engagementValue);
    const sales = sortedTrends.map(trend => trend.salesValue);
    const search = sortedTrends.map(trend => trend.searchValue);
    
    return {
      dates,
      engagement,
      sales,
      search
    };
  }

  /**
   * Calculate engagement velocity (rate of change)
   */
  calculateEngagementVelocity(trends: schema.Trend[]): number {
    if (trends.length < 2) return 0;
    
    return this.calculateVelocity(trends, 'engagementValue');
  }

  /**
   * Calculate sales velocity (rate of change)
   */
  calculateSalesVelocity(trends: schema.Trend[]): number {
    if (trends.length < 2) return 0;
    
    return this.calculateVelocity(trends, 'salesValue');
  }

  /**
   * Calculate search velocity (rate of change)
   */
  calculateSearchVelocity(trends: schema.Trend[]): number {
    if (trends.length < 2) return 0;
    
    return this.calculateVelocity(trends, 'searchValue');
  }

  /**
   * Calculate velocity for a specific metric
   */
  private calculateVelocity(trends: schema.Trend[], metricKey: keyof schema.Trend): number {
    // Sort trends by date
    const sortedTrends = [...trends].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Calculate average rate of change
    let totalChange = 0;
    let totalDays = 0;
    
    for (let i = 1; i < sortedTrends.length; i++) {
      const current = sortedTrends[i];
      const previous = sortedTrends[i-1];
      
      const currentDate = new Date(current.date);
      const previousDate = new Date(previous.date);
      
      const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff > 0) {
        const currentValue = Number(current[metricKey]);
        const previousValue = Number(previous[metricKey]);
        
        const change = currentValue - previousValue;
        const changePerDay = change / daysDiff;
        
        totalChange += changePerDay;
        totalDays += daysDiff;
      }
    }
    
    // Return average daily change
    return totalDays > 0 ? totalChange / (sortedTrends.length - 1) : 0;
  }

  /**
   * Generate synthetic trend data for a new product
   */
  generateInitialTrendData(productId: number, baseTrendScore: number): schema.InsertTrend[] {
    const trends: schema.InsertTrend[] = [];
    const today = new Date();
    
    // Generate data for last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Base values on trend score with some randomness
      const baseValue = baseTrendScore * 0.8;
      const randomFactor = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      
      const engagementValue = Math.round(baseValue * randomFactor);
      const salesValue = Math.round(baseValue * randomFactor * 0.7);
      const searchValue = Math.round(baseValue * randomFactor * 0.9);
      
      trends.push({
        productId,
        date: date.toISOString().split('T')[0],
        engagementValue,
        salesValue,
        searchValue
      });
    }
    
    return trends;
  }
}

// Export service instance
export const trendService = new TrendService();

// Export default for convenience
export default trendService;