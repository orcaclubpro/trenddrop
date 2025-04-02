/**
 * ProductRepository - Repository for product data
 * 
 * This repository handles all product-related data operations.
 */

import { eq, gte, and, desc, asc, sql, like, or } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
import { BaseRepository } from './Repository.js';
import databaseService from '../services/database-service.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class ProductRepository extends BaseRepository<schema.Product, number> {
  /**
   * Find a product by ID
   */
  async findById(id: number): Promise<schema.Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(schema.products).where(eq(schema.products.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding product by ID: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Find all products with filtering and pagination
   */
  async findAll(filter: schema.ProductFilter = { page: 1, limit: 10 }): Promise<{ data: schema.Product[], total: number }> {
    try {
      const db = databaseService.getDb();
      const {
        page = 1,
        pageSize = 10,
        category,
        minTrendScore,
        sortBy = 'trendScore',
        sortDirection = 'desc',
        search,
        createdAfter,
        createdBefore
      } = filter;

      // Build the where clause
      const whereConditions = [];

      if (category) {
        whereConditions.push(eq(schema.products.category, category));
      }

      if (minTrendScore) {
        whereConditions.push(gte(schema.products.trendScore, minTrendScore));
      }

      if (search) {
        whereConditions.push(
          or(
            like(schema.products.name, `%${search}%`),
            like(schema.products.category, `%${search}%`),
            like(schema.products.subcategory, `%${search}%`),
            like(schema.products.description, `%${search}%`)
          )
        );
      }

      if (createdAfter) {
        whereConditions.push(gte(schema.products.createdAt, createdAfter));
      }

      if (createdBefore) {
        whereConditions.push(sql`${schema.products.createdAt} <= ${createdBefore.toISOString()}`);
      }

      // Calculate pagination
      const offset = (page - 1) * pageSize;

      // Build the sort clause
      const sortColumn = sortBy === 'name' ? schema.products.name
        : sortBy === 'category' ? schema.products.category
        : sortBy === 'engagementRate' ? schema.products.engagementRate
        : sortBy === 'salesVelocity' ? schema.products.salesVelocity
        : sortBy === 'searchVolume' ? schema.products.searchVolume
        : sortBy === 'createdAt' ? schema.products.createdAt
        : schema.products.trendScore;

      const sortOrder = sortDirection === 'asc' ? asc(sortColumn) : desc(sortColumn);

      // Execute the query
      const whereClause = whereConditions.length > 0 
        ? and(...whereConditions) 
        : undefined;

      const products = await db
        .select()
        .from(schema.products)
        .where(whereClause)
        .orderBy(sortOrder)
        .limit(pageSize)
        .offset(offset);

      // Count total matching products
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(schema.products)
        .where(whereClause);

      const total = Number(totalResult[0].count);

      return { data: products, total };
    } catch (error) {
      log(`Error finding products: ${error}`, 'product-repo');
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async create(productData: schema.InsertProduct): Promise<schema.Product> {
    try {
      const db = databaseService.getDb();
      const result = await db.insert(schema.products).values(productData).returning();
      
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
  async update(id: number, productData: Partial<schema.InsertProduct>): Promise<schema.Product | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .update(schema.products)
        .set(productData)
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