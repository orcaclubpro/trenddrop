import { IStorage } from "../storage";
import { InsertTrend, Trend } from "@shared/schema";

export class TrendService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async getTrendsForProduct(productId: number): Promise<Trend[]> {
    return this.storage.getTrendsForProduct(productId);
  }

  async createTrend(trend: InsertTrend): Promise<Trend> {
    return this.storage.createTrend(trend);
  }

  // Process trend data into a format suitable for charting
  processTrendDataForChart(trends: Trend[]): any {
    const sortedTrends = [...trends].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return sortedTrends.map(trend => {
      const date = new Date(trend.date);
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        engagement: trend.engagementValue,
        sales: trend.salesValue,
        search: trend.searchValue,
        total: trend.engagementValue + trend.salesValue + trend.searchValue
      };
    });
  }

  // Calculate engagement velocity (rate of change)
  calculateEngagementVelocity(trends: Trend[]): number {
    if (trends.length < 2) return 0;
    
    const sortedTrends = [...trends].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    const oldest = sortedTrends[0];
    const newest = sortedTrends[sortedTrends.length - 1];
    
    const oldestValue = oldest.engagementValue;
    const newestValue = newest.engagementValue;
    
    // If starting from zero, treat as 100% increase
    if (oldestValue === 0) return 100;
    
    const percentageChange = ((newestValue - oldestValue) / oldestValue) * 100;
    return Math.round(percentageChange);
  }

  // Similar methods for sales and search velocity
  calculateSalesVelocity(trends: Trend[]): number {
    if (trends.length < 2) return 0;
    
    const sortedTrends = [...trends].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    const oldest = sortedTrends[0];
    const newest = sortedTrends[sortedTrends.length - 1];
    
    const oldestValue = oldest.salesValue;
    const newestValue = newest.salesValue;
    
    if (oldestValue === 0) return 100;
    
    const percentageChange = ((newestValue - oldestValue) / oldestValue) * 100;
    return Math.round(percentageChange);
  }

  calculateSearchVelocity(trends: Trend[]): number {
    if (trends.length < 2) return 0;
    
    const sortedTrends = [...trends].sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
    
    const oldest = sortedTrends[0];
    const newest = sortedTrends[sortedTrends.length - 1];
    
    const oldestValue = oldest.searchValue;
    const newestValue = newest.searchValue;
    
    if (oldestValue === 0) return 100;
    
    const percentageChange = ((newestValue - oldestValue) / oldestValue) * 100;
    return Math.round(percentageChange);
  }
}
