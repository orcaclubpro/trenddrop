/**
 * TrendRepository - Repository for trend data
 * 
 * This repository handles all trend-related data operations.
 */

import { eq, desc, asc, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
import { BaseRepository } from './Repository.js';
import { databaseService } from '../services/common/DatabaseService.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class TrendRepository extends BaseRepository<schema.Trend, number> {
  /**
   * Find a trend by ID
   */
  async findById(id: number): Promise<schema.Trend | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(schema.trends).where(eq(schema.trends.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding trend by ID: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Find all trends with optional filtering
   */
  async findAll(filter: any = {}): Promise<{ data: schema.Trend[], total: number }> {
    try {
      const db = databaseService.getDb();
      const { productId, page = 1, pageSize = 50 } = filter;

      // Calculate pagination
      const offset = (page - 1) * pageSize;

      // Build the query
      let query = db.select().from(schema.trends);
      
      // Add product filter if specified
      if (productId) {
        query = query.where(eq(schema.trends.productId, productId));
      }
      
      // Add sorting and pagination
      const trends = await query
        .orderBy(asc(schema.trends.date))
        .limit(pageSize)
        .offset(offset);

      // Count total
      let countQuery = db.select({ count: sql`count(*)` }).from(schema.trends);
      
      if (productId) {
        countQuery = countQuery.where(eq(schema.trends.productId, productId));
      }
      
      const totalResult = await countQuery;
      const total = Number(totalResult[0].count);

      return { data: trends, total };
    } catch (error) {
      log(`Error finding trends: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Create a new trend
   */
  async create(trendData: schema.InsertTrend): Promise<schema.Trend> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(schema.trends).values(trendData).returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create trend');
      }
      
      const newTrend = result[0];
      
      // Publish trend created event
      eventBus.publish('trend:created', {
        trendId: newTrend.id,
        productId: newTrend.productId,
        trend: newTrend,
        timestamp: new Date().toISOString()
      });
      
      return newTrend;
    } catch (error) {
      log(`Error creating trend: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Update an existing trend
   */
  async update(id: number, trendData: Partial<schema.InsertTrend>): Promise<schema.Trend | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .update(schema.trends)
        .set(trendData)
        .where(eq(schema.trends.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedTrend = result[0];
      
      // Publish trend updated event
      eventBus.publish('trend:updated', {
        trendId: updatedTrend.id,
        productId: updatedTrend.productId,
        trend: updatedTrend,
        timestamp: new Date().toISOString()
      });
      
      return updatedTrend;
    } catch (error) {
      log(`Error updating trend: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Delete a trend
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      
      // Get the trend first to retrieve the productId
      const trend = await this.findById(id);
      
      if (!trend) {
        return false;
      }
      
      const result = await db
        .delete(schema.trends)
        .where(eq(schema.trends.id, id))
        .returning({ id: schema.trends.id });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish trend deleted event
        eventBus.publish('trend:deleted', {
          trendId: id,
          productId: trend.productId,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting trend: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Find trends for a specific product
   */
  async findByProductId(productId: number): Promise<schema.Trend[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.trends)
        .where(eq(schema.trends.productId, productId))
        .orderBy(asc(schema.trends.date));
    } catch (error) {
      log(`Error finding trends for product: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Calculate trend metrics for a product
   */
  async calculateTrendMetrics(productId: number): Promise<{
    engagementRate: number;
    salesVelocity: number;
    searchVolume: number;
  }> {
    try {
      const trends = await this.findByProductId(productId);
      
      if (trends.length === 0) {
        return {
          engagementRate: 0,
          salesVelocity: 0,
          searchVolume: 0
        };
      }
      
      // Calculate average values
      const engagementRate = trends.reduce((sum, trend) => sum + trend.engagementValue, 0) / trends.length;
      const salesVelocity = trends.reduce((sum, trend) => sum + trend.salesValue, 0) / trends.length;
      const searchVolume = trends.reduce((sum, trend) => sum + trend.searchValue, 0) / trends.length;
      
      return {
        engagementRate,
        salesVelocity,
        searchVolume
      };
    } catch (error) {
      log(`Error calculating trend metrics: ${error}`, 'trend-repo');
      throw error;
    }
  }

  /**
   * Calculate trend velocity (rate of change)
   */
  async calculateTrendVelocity(productId: number): Promise<{
    engagementVelocity: number;
    salesVelocity: number;
    searchVelocity: number;
  }> {
    try {
      const trends = await this.findByProductId(productId);
      
      if (trends.length < 2) {
        return {
          engagementVelocity: 0,
          salesVelocity: 0,
          searchVelocity: 0
        };
      }
      
      // Sort trends by date
      trends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate velocity as the average rate of change
      let engagementVelocity = 0;
      let salesVelocity = 0;
      let searchVelocity = 0;
      
      for (let i = 1; i < trends.length; i++) {
        const daysDiff = (new Date(trends[i].date).getTime() - new Date(trends[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysDiff > 0) {
          engagementVelocity += (trends[i].engagementValue - trends[i-1].engagementValue) / daysDiff;
          salesVelocity += (trends[i].salesValue - trends[i-1].salesValue) / daysDiff;
          searchVelocity += (trends[i].searchValue - trends[i-1].searchValue) / daysDiff;
        }
      }
      
      const numPoints = trends.length - 1;
      
      return {
        engagementVelocity: engagementVelocity / numPoints,
        salesVelocity: salesVelocity / numPoints,
        searchVelocity: searchVelocity / numPoints
      };
    } catch (error) {
      log(`Error calculating trend velocity: ${error}`, 'trend-repo');
      throw error;
    }
  }
}

// Export repository instance
export const trendRepository = new TrendRepository();

// Export default for convenience
export default trendRepository;