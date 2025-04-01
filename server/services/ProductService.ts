/**
 * ProductService - Business logic for products
 * 
 * This service handles product-related operations and business logic.
 */

import {
  productRepository,
  trendRepository,
  regionRepository,
  videoRepository
} from '../repositories/index.js';
import * as schema from '../../shared/schema.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class ProductService {
  /**
   * Get products with optional filtering
   */
  async getProducts(filter: schema.ProductFilter = {}): Promise<{ products: schema.Product[], total: number }> {
    try {
      const { data, total } = await productRepository.findAll(filter);
      return { products: data, total };
    } catch (error) {
      log(`Error getting products: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Get a product by ID with optional details
   */
  async getProduct(id: number, includeDetails: boolean = false): Promise<schema.ProductWithDetails | schema.Product | undefined> {
    try {
      const product = await productRepository.findById(id);
      
      if (!product) {
        return undefined;
      }
      
      // If details aren't requested, return just the product
      if (!includeDetails) {
        return product;
      }
      
      // Fetch related data for the product
      const [trends, regions, videos] = await Promise.all([
        trendRepository.findByProductId(id),
        regionRepository.findByProductId(id),
        videoRepository.findByProductId(id)
      ]);
      
      // Return product with details
      return {
        ...product,
        trends,
        regions,
        videos
      };
    } catch (error) {
      log(`Error getting product: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(productData: schema.InsertProduct): Promise<schema.Product> {
    try {
      const newProduct = await productRepository.create(productData);
      
      // Calculate initial trend score
      const trendScore = this.calculateTrendScore({
        engagementRate: productData.engagementRate || 0,
        salesVelocity: productData.salesVelocity || 0,
        searchVolume: productData.searchVolume || 0,
        geographicSpread: productData.geographicSpread || 0
      });
      
      // Update the product with the calculated trend score
      if (trendScore !== productData.trendScore) {
        await productRepository.update(newProduct.id, { trendScore });
      }
      
      return newProduct;
    } catch (error) {
      log(`Error creating product: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: number, productData: Partial<schema.InsertProduct>): Promise<schema.Product | undefined> {
    try {
      // If trend metrics are being updated, recalculate trend score
      if (
        productData.engagementRate !== undefined ||
        productData.salesVelocity !== undefined ||
        productData.searchVolume !== undefined ||
        productData.geographicSpread !== undefined
      ) {
        // Get current product data
        const currentProduct = await productRepository.findById(id);
        
        if (!currentProduct) {
          return undefined;
        }
        
        // Calculate new trend score
        const trendScore = this.calculateTrendScore({
          engagementRate: productData.engagementRate ?? currentProduct.engagementRate,
          salesVelocity: productData.salesVelocity ?? currentProduct.salesVelocity,
          searchVolume: productData.searchVolume ?? currentProduct.searchVolume,
          geographicSpread: productData.geographicSpread ?? currentProduct.geographicSpread
        });
        
        // Add trend score to update data
        productData.trendScore = trendScore;
      }
      
      return await productRepository.update(id, productData);
    } catch (error) {
      log(`Error updating product: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(id: number): Promise<boolean> {
    try {
      // Check if the product exists
      const product = await productRepository.findById(id);
      
      if (!product) {
        return false;
      }
      
      // Delete the product
      return await productRepository.delete(id);
    } catch (error) {
      log(`Error deleting product: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Get product categories
   */
  async getCategories(): Promise<string[]> {
    try {
      return await productRepository.getCategories();
    } catch (error) {
      log(`Error getting product categories: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Get top trending products
   */
  async getTopTrending(limit: number = 5): Promise<schema.Product[]> {
    try {
      return await productRepository.getTopTrending(limit);
    } catch (error) {
      log(`Error getting top trending products: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Calculate trend score from metrics
   */
  calculateTrendScore(metrics: {
    engagementRate: number;
    salesVelocity: number;
    searchVolume: number;
    geographicSpread: number;
  }): number {
    // Assign weights to different metrics
    const weights = {
      engagementRate: 0.3,
      salesVelocity: 0.4,
      searchVolume: 0.2,
      geographicSpread: 0.1
    };
    
    // Calculate weighted score
    const weightedScore = 
      (metrics.engagementRate * weights.engagementRate) +
      (metrics.salesVelocity * weights.salesVelocity) +
      (metrics.searchVolume * weights.searchVolume) +
      (metrics.geographicSpread * weights.geographicSpread);
    
    // Normalize to 0-100 scale
    return Math.round(Math.min(100, Math.max(0, weightedScore)));
  }

  /**
   * Update product trend score based on latest metrics
   */
  async updateProductTrendScore(productId: number): Promise<number> {
    try {
      // Get the product
      const product = await productRepository.findById(productId);
      
      if (!product) {
        throw new Error(`Product with ID ${productId} not found`);
      }
      
      // Get latest trend metrics
      const trendMetrics = await trendRepository.calculateTrendMetrics(productId);
      const geographicSpread = await regionRepository.calculateGeographicSpread(productId);
      
      // Calculate new trend score
      const trendScore = this.calculateTrendScore({
        ...trendMetrics,
        geographicSpread
      });
      
      // Update product with new metrics and score
      await productRepository.update(productId, {
        engagementRate: trendMetrics.engagementRate,
        salesVelocity: trendMetrics.salesVelocity,
        searchVolume: trendMetrics.searchVolume,
        geographicSpread,
        trendScore
      });
      
      return trendScore;
    } catch (error) {
      log(`Error updating product trend score: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary(): Promise<schema.DashboardSummary> {
    try {
      // Get top trending products
      const topProducts = await this.getTopTrending(5);
      
      // Get product count
      const { total: productCount } = await productRepository.findAll();
      
      // Get top regions
      const topRegions = await regionRepository.getTopRegions(5);
      
      // Get top videos
      const topVideos = await videoRepository.getTopVideos(5);
      
      // Get average trend score
      const allProducts = await productRepository.findAll();
      const avgTrendScore = allProducts.data.reduce((sum, product) => sum + product.trendScore, 0) / allProducts.data.length;
      
      // Get platform distribution
      const platformCounts = await videoRepository.getPlatformCounts();
      
      return {
        productCount,
        avgTrendScore: Math.round(avgTrendScore),
        topProducts,
        topRegions,
        topVideos,
        platformDistribution: platformCounts
      };
    } catch (error) {
      log(`Error getting dashboard summary: ${error}`, 'product-service');
      throw error;
    }
  }
}

// Export service instance
export const productService = new ProductService();

// Export default for convenience
export default productService;