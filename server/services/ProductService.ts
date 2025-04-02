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
  async getProducts(filter: schema.ProductFilter = { page: 1, limit: 10 }): Promise<{ products: schema.Product[], total: number }> {
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
  async createProduct(product: schema.InsertProduct): Promise<schema.Product> {
    try {
      const newProduct = await productRepository.create(product);
      
      // Publish event
      eventBus.publish('product:created', { productId: newProduct.id });
      
      return newProduct;
    } catch (error) {
      log(`Error creating product: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Update a product
   */
  async updateProduct(id: number, product: Partial<schema.InsertProduct>): Promise<schema.Product | undefined> {
    try {
      // Check if the product exists
      const existingProduct = await productRepository.findById(id);
      
      if (!existingProduct) {
        return undefined;
      }
      
      // Update the product
      const updatedProduct = await productRepository.update(id, product);
      
      // Publish event
      if (updatedProduct) {
        eventBus.publish('product:updated', { productId: id });
      }
      
      return updatedProduct;
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
   * Recalculate product trend scores
   */
  async recalculateTrendScores(): Promise<number> {
    try {
      // Get all products
      const { products } = await this.getProducts({ page: 1, limit: 9999 });
      let updatedCount = 0;
      
      // Update each product's trend score
      for (const product of products) {
        const trends = await trendRepository.findByProductId(product.id);
        const averageTrendScore = this.calculateAverageTrendScore(trends);
        
        if (averageTrendScore !== product.trendScore) {
          await this.updateProduct(product.id, { trendScore: averageTrendScore });
          updatedCount++;
        }
      }
      
      return updatedCount;
    } catch (error) {
      log(`Error recalculating trend scores: ${error}`, 'product-service');
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
   * Get recently added products
   */
  async getRecentProducts(limit: number = 5): Promise<schema.Product[]> {
    try {
      return await productRepository.getRecentProducts(limit);
    } catch (error) {
      log(`Error getting recent products: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Calculate average trend score for a product based on its trend data
   */
  private calculateAverageTrendScore(trends: schema.Trend[]): number {
    if (trends.length === 0) {
      return 0;
    }
    
    // Calculate the average of the combined trend values for each data point
    const sum = trends.reduce((acc, trend) => {
      // Combine engagement, sales and search values with custom weights
      const combinedValue = 
        (trend.engagementValue * 0.3) + 
        (trend.salesValue * 0.5) + 
        (trend.searchValue * 0.2);
      return acc + combinedValue;
    }, 0);
    
    return Math.round(sum / trends.length);
  }

  /**
   * Get total product count
   */
  async getTotalProductCount(): Promise<number> {
    try {
      const { total } = await this.getProducts({ page: 1, limit: 1 });
      return total;
    } catch (error) {
      log(`Error getting total product count: ${error}`, 'product-service');
      return 0;
    }
  }

  /**
   * Get products grouped by category
   */
  async getProductsByCategory(): Promise<{ category: string; count: number }[]> {
    try {
      return await productRepository.getCategoryBreakdown();
    } catch (error) {
      log(`Error getting products by category: ${error}`, 'product-service');
      return [];
    }
  }

  /**
   * Get sales velocity distribution
   */
  async getSalesVelocityDistribution(): Promise<{ range: string; count: number }[]> {
    try {
      // This is a placeholder implementation
      // In a real system, this would query actual sales data
      return [
        { range: '0-10', count: 15 },
        { range: '11-20', count: 25 },
        { range: '21-30', count: 35 },
        { range: '31-40', count: 20 },
        { range: '41+', count: 5 }
      ];
    } catch (error) {
      log(`Error getting sales velocity distribution: ${error}`, 'product-service');
      return [];
    }
  }

  /**
   * Get market opportunities analysis
   */
  async getMarketOpportunities(): Promise<{ category: string; score: number; potential: string }[]> {
    try {
      // This is a placeholder implementation
      // In a real system, this would involve complex calculations
      const categories = await this.getProductsByCategory();
      return categories.slice(0, 5).map(cat => ({
        category: cat.category,
        score: Math.floor(Math.random() * 100),
        potential: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)]
      }));
    } catch (error) {
      log(`Error getting market opportunities: ${error}`, 'product-service');
      return [];
    }
  }

  /**
   * Get dashboard summary data
   */
  async getDashboardSummary(): Promise<schema.DashboardSummary> {
    try {
      // Get all products for dashboard calculations
      const { products, total: productCount } = await this.getProducts({ page: 1, limit: 1000 });
      
      // Calculate basic metrics
      const trendingProductsCount = products.filter(p => (p.trendScore || 0) >= 80).length;
      const averageTrendScore = products.length 
        ? products.reduce((sum, p) => sum + (p.trendScore || 0), 0) / products.length 
        : 0;
      
      // Get top trending and recent products
      const topProducts = await this.getTopTrending(5);
      const recentProducts = await this.getRecentProducts(5);
      
      // Get new product count (last 24 hours)
      const newProductCount = products.filter(p => {
        const createdAt = new Date(p.createdAt || Date.now());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return createdAt >= yesterday;
      }).length;
      
      // Get category data
      const categoriesData = await this.getProductsByCategory();
      const topCategories = categoriesData.slice(0, 5).map(c => ({
        name: c.category,
        count: c.count,
        percentage: Math.round((c.count / productCount) * 100)
      }));
      
      // Get price data
      const averagePrice = products.length
        ? products.reduce((sum, p) => sum + (p.priceRangeLow || 0), 0) / products.length
        : 0;
      
      // Placeholder values for data we don't have yet
      const topRegion = "United States";
      const topRegionPercentage = 35;
      const viralVideosCount = 12;
      const newVideosToday = 5;
      const priceChange = 0;
      const trendScoreChange = 0;
      const regionCount = 12;
      const countryCount = 45;
      
      // Placeholder region data
      const topRegions = [
        { regionName: "North America", count: 150, percentage: 35 },
        { regionName: "Europe", count: 120, percentage: 28 },
        { regionName: "Asia", count: 100, percentage: 23 },
        { regionName: "South America", count: 50, percentage: 14 }
      ];
      
      // Placeholder video data
      const topVideos = [
        {
          id: 1,
          title: "Product Review",
          platform: "YouTube",
          views: 50000,
          productId: 1,
          productName: products.length > 0 ? products[0].name : "Sample Product",
          thumbnailUrl: "https://example.com/thumbnail.jpg"
        }
      ];
      
      const platformDistribution = [
        { platform: "YouTube", count: 50, percentage: 60 },
        { platform: "TikTok", count: 30, percentage: 30 },
        { platform: "Instagram", count: 20, percentage: 10 }
      ];
      
      // Placeholder trend timeline data
      const trendTimeline = [
        { date: "2024-01-01", avgTrendScore: 75, newProducts: 10 },
        { date: "2024-01-02", avgTrendScore: 78, newProducts: 12 },
        { date: "2024-01-03", avgTrendScore: 82, newProducts: 15 }
      ];
      
      // Get sales velocity distribution
      const salesVelocityDistributionData = await this.getSalesVelocityDistribution();
      // Convert to match the required schema type
      const salesVelocityDistribution = salesVelocityDistributionData.map(item => ({
        range: item.range,
        count: item.count,
        percentage: Math.round((item.count / products.length) * 100)
      }));
      
      // Get market opportunities
      const marketOpportunitiesData = await this.getMarketOpportunities();
      // Convert to match the required schema type
      const marketOpportunities = marketOpportunitiesData.map(item => ({
        category: item.category,
        growthRate: item.score / 10, // Convert score to growth rate
        competitionLevel: item.potential,
        potentialScore: item.score
      }));
      
      return {
        trendingProductsCount,
        averageTrendScore,
        topRegion,
        topRegionPercentage,
        viralVideosCount,
        newVideosToday,
        productCount,
        newProductCount,
        topProducts,
        recentProducts,
        averagePrice,
        priceChange,
        trendScoreChange,
        topCategories,
        regionCount,
        countryCount,
        topRegions,
        topVideos,
        platformDistribution,
        trendTimeline,
        salesVelocityDistribution,
        marketOpportunities
      };
    } catch (error) {
      log(`Error getting dashboard summary: ${error}`, 'product-service');
      throw error;
    }
  }

  /**
   * Get all available product categories
   */
  async getCategories(): Promise<string[]> {
    try {
      const { products } = await this.getProducts({ page: 1, limit: 1000 });
      
      // Extract unique categories
      const categorySet = new Set<string>();
      products.forEach(product => {
        if (product.category) {
          categorySet.add(product.category);
        }
      });
      
      // Convert to array and sort alphabetically
      return Array.from(categorySet).sort();
    } catch (error) {
      log(`Error getting categories: ${error}`, 'product-service');
      return [];
    }
  }
}

// Export service instance
export const productService = new ProductService();

// Export default for convenience
export default productService;