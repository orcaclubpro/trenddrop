/**
 * ProductRepository - Repository for product data
 * 
 * This repository handles all product-related data operations.
 */

import { eq, and, or, between, gte, lte, desc, asc, sql } from 'drizzle-orm';
import { Product, ProductFilter } from '@shared/schema.js';
import databaseService from '../services/database-service.js';
import * as schema from '@shared/schema.js';
import { BaseRepository } from './Repository.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class ProductRepository extends BaseRepository<schema.Product, number> {
  constructor() {
    super();
  }

  /**
   * Find a product by ID
   */
  async findById(id: number): Promise<Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, id))
        .limit(1);
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding product by ID: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Find all products with filtering and pagination
   */
  async findAll(filter: ProductFilter = { page: 1, limit: 10 }): Promise<{ data: Product[], total: number }> {
    try {
      const whereConditions = [];
      
      // Add search condition if provided
      if (filter.search) {
        whereConditions.push(
          or(
            sql`LOWER(${schema.products.name}) LIKE LOWER(${'%' + filter.search + '%'})`,
            sql`LOWER(${schema.products.category}) LIKE LOWER(${'%' + filter.search + '%'})`
          )
        );
      }
      
      // Add category filter if provided
      if (filter.category) {
        whereConditions.push(eq(schema.products.category, filter.category));
      }
      
      // Add range filters if provided
      if (filter.priceRange) {
        whereConditions.push(
          and(
            gte(schema.products.priceRangeLow, filter.priceRange[0]),
            lte(schema.products.priceRangeHigh, filter.priceRange[1])
          )
        );
      }
      
      if (filter.trendScore) {
        whereConditions.push(
          between(schema.products.trendScore, filter.trendScore[0], filter.trendScore[1])
        );
      }
      
      if (filter.engagementRate) {
        whereConditions.push(
          between(schema.products.engagementRate, filter.engagementRate[0], filter.engagementRate[1])
        );
      }
      
      if (filter.salesVelocity) {
        whereConditions.push(
          between(schema.products.salesVelocity, filter.salesVelocity[0], filter.salesVelocity[1])
        );
      }
      
      if (filter.searchVolume) {
        whereConditions.push(
          between(schema.products.searchVolume, filter.searchVolume[0], filter.searchVolume[1])
        );
      }
      
      if (filter.geographicSpread) {
        whereConditions.push(
          between(schema.products.geographicSpread, filter.geographicSpread[0], filter.geographicSpread[1])
        );
      }
      
      // Add date range filters if provided
      if (filter.createdAfter) {
        whereConditions.push(gte(schema.products.createdAt, filter.createdAfter));
      }
      
      if (filter.createdBefore) {
        whereConditions.push(lte(schema.products.createdAt, filter.createdBefore));
      }
      
      // Build the query
      const db = databaseService.getDb();
      let query = db.select().from(schema.products);
      
      // Add where conditions if any exist
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      // Add sorting if provided
      if (filter.sortBy) {
        const sortColumn = schema.products[filter.sortBy as keyof typeof schema.products];
        if (sortColumn) {
          query = query.orderBy(
            filter.sortDirection === 'desc' ? desc(sortColumn) : asc(sortColumn)
          );
        }
      }
      
      // Add pagination
      const offset = (filter.page - 1) * filter.limit;
      query = query.offset(offset).limit(filter.limit);
      
      // Execute query
      const productsResult = await query;
      
      // Count total
      let countQuery = db.select({ count: sql`count(*)` }).from(schema.products);
      if (whereConditions.length > 0) {
        countQuery = countQuery.where(and(...whereConditions));
      }
      const totalResult = await countQuery;
      
      return {
        data: productsResult,
        total: Number(totalResult[0].count)
      };
    } catch (error) {
      log(`Error finding products: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async create(product: schema.InsertProduct): Promise<Product> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .insert(schema.products)
        .values(product)
        .returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create product');
      }
      
      const newProduct = result[0];
      
      // Publish product created event
      eventBus.publish('product:created', {
        productId: newProduct.id,
        product: newProduct,
        timestamp: new Date().toISOString()
      });
      
      return newProduct;
    } catch (error) {
      log(`Error creating product: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async update(id: number, product: Partial<schema.InsertProduct>): Promise<Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .update(schema.products)
        .set(product)
        .where(eq(schema.products.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedProduct = result[0];
      
      // Publish product updated event
      eventBus.publish('product:updated', {
        productId: updatedProduct.id,
        product: updatedProduct,
        timestamp: new Date().toISOString()
      });
      
      return updatedProduct;
    } catch (error) {
      log(`Error updating product: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .delete(schema.products)
        .where(eq(schema.products.id, id))
        .returning({ id: schema.products.id });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish product deleted event
        eventBus.publish('product:deleted', {
          productId: id,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting product: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .selectDistinct({ category: schema.products.category })
        .from(schema.products)
        .orderBy(asc(schema.products.category));
      
      return result.map(row => row.category);
    } catch (error) {
      log(`Error getting product categories: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Get top trending products
   */
  async getTopTrending(limit: number = 5): Promise<schema.Product[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.products)
        .orderBy(desc(schema.products.trendScore))
        .limit(limit);
    } catch (error) {
      log(`Error getting top trending products: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Get recent products
   */
  async getRecentProducts(limit: number = 10): Promise<schema.Product[]> {
    try {
      const db = databaseService.getDb();
      return await db
        .select()
        .from(schema.products)
        .orderBy(desc(schema.products.createdAt))
        .limit(limit);
    } catch (error) {
      log(`Error getting recent products: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(): Promise<{ category: string; count: number }[]> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select({
          category: schema.products.category,
          count: sql`count(*)`.mapWith(Number)
        })
        .from(schema.products)
        .groupBy(schema.products.category)
        .orderBy(desc(sql`count(*)`));
      
      return result;
    } catch (error) {
      log(`Error getting category breakdown: ${error}`, 'product-repo');
      throw error;
    }
  }
}

// Export repository instance
export const productRepository = new ProductRepository();

// Export default for convenience
export default productRepository;