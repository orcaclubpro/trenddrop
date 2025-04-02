/**
 * RegionRepository - Repository for regional data
 * 
 * This repository handles all region-related data operations.
 */

import { eq, desc, asc, sql } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
import { BaseRepository } from './Repository.js';
import databaseService from '../services/database-service.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class RegionRepository extends BaseRepository<schema.Region, number> {
  /**
   * Find a region by ID
   */
  async findById(id: number): Promise<schema.Region | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(schema.regions).where(eq(schema.regions.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding region by ID: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Find all regions with optional filtering
   */
  async findAll(filter: any = {}): Promise<{ data: schema.Region[], total: number }> {
    try {
      const db = databaseService.getDb();
      const { productId, page = 1, pageSize = 50 } = filter;

      // Calculate pagination
      const offset = (page - 1) * pageSize;

      // Build the query
      let query = db.select().from(schema.regions);
      
      // Add product filter if specified
      if (productId) {
        query = query.where(eq(schema.regions.productId, productId));
      }
      
      // Add sorting and pagination
      const regions = await query
        .orderBy(desc(schema.regions.percentage)) // Use percentage instead of interestLevel
        .limit(pageSize)
        .offset(offset);

      // Count total
      let countQuery = db.select({ count: sql`count(*)` }).from(schema.regions);
      
      if (productId) {
        countQuery = countQuery.where(eq(schema.regions.productId, productId));
      }
      
      const totalResult = await countQuery;
      const total = Number(totalResult[0].count);

      return { data: regions, total };
    } catch (error) {
      log(`Error finding regions: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Create a new region
   */
  async create(regionData: schema.InsertRegion): Promise<schema.Region> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(schema.regions).values(regionData).returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create region');
      }
      
      const newRegion = result[0];
      
      // Publish region created event
      eventBus.publish('region:created', {
        regionId: newRegion.id,
        productId: newRegion.productId,
        region: newRegion,
        timestamp: new Date().toISOString()
      });
      
      return newRegion;
    } catch (error) {
      log(`Error creating region: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Update an existing region
   */
  async update(id: number, regionData: Partial<schema.InsertRegion>): Promise<schema.Region | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .update(schema.regions)
        .set(regionData)
        .where(eq(schema.regions.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedRegion = result[0];
      
      // Publish region updated event
      eventBus.publish('region:updated', {
        regionId: updatedRegion.id,
        productId: updatedRegion.productId,
        region: updatedRegion,
        timestamp: new Date().toISOString()
      });
      
      return updatedRegion;
    } catch (error) {
      log(`Error updating region: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Delete a region
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      
      // Get the region first to retrieve the productId
      const region = await this.findById(id);
      
      if (!region) {
        return false;
      }
      
      const result = await db
        .delete(schema.regions)
        .where(eq(schema.regions.id, id))
        .returning({ id: schema.regions.id });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish region deleted event
        eventBus.publish('region:deleted', {
          regionId: id,
          productId: region.productId,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting region: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Find regions for a specific product
   */
  async findByProductId(productId: number): Promise<schema.Region[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.regions)
        .where(eq(schema.regions.productId, productId))
        .orderBy(desc(schema.regions.percentage));
    } catch (error) {
      log(`Error finding regions for product: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Calculate geographic spread for a product
   */
  async calculateGeographicSpread(productId: number): Promise<number> {
    try {
      const regions = await this.findByProductId(productId);
      
      if (regions.length === 0) {
        return 0;
      }
      
      // Calculate variance of percentage as a measure of spread (using the correct field)
      const avgPercentage = regions.reduce((sum, region) => sum + region.percentage, 0) / regions.length;
      const variance = regions.reduce((sum, region) => sum + Math.pow(region.percentage - avgPercentage, 2), 0) / regions.length;
      
      // Normalize to 0-100 scale (higher variance means more spread)
      const normalizedSpread = Math.min(100, variance / 10);
      
      return normalizedSpread;
    } catch (error) {
      log(`Error calculating geographic spread: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Get top regions by interest level
   */
  async getTopRegions(limit: number = 5): Promise<{ regionName: string; count: number }[]> {
    try {
      const db = databaseService.getDb();
      
      // Group by country (which is the correct field in the schema) and count occurrences
      const result = await db
        .select({
          regionName: schema.regions.country,
          count: sql`count(${schema.regions.id})`
        })
        .from(schema.regions)
        .groupBy(schema.regions.country)
        .orderBy(desc(sql`count(${schema.regions.id})`))
        .limit(limit);
      
      return result.map(row => ({
        regionName: row.regionName,
        count: Number(row.count)
      }));
    } catch (error) {
      log(`Error getting top regions: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Get total count of regions
   */
  async getTotalCount(): Promise<number> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select({ count: sql`count(*)` })
        .from(schema.regions);
      
      return Number(result[0].count);
    } catch (error) {
      log(`Error getting total region count: ${error}`, 'region-repo');
      throw error;
    }
  }

  /**
   * Get unique country count
   */
  async getUniqueCountryCount(): Promise<number> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .selectDistinct({ country: schema.regions.country })
        .from(schema.regions);
      
      return result.length;
    } catch (error) {
      log(`Error getting unique country count: ${error}`, 'region-repo');
      throw error;
    }
  }
}

// Export repository instance
export const regionRepository = new RegionRepository();

// Export default for convenience
export default regionRepository;