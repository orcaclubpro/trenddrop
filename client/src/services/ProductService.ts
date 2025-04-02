/**
 * Product Service
 * 
 * This service handles product-related API calls to the backend.
 */

import { apiRequest } from '@/lib/queryClient';
import { API } from '@/lib/constants';
import type { ProductFilter, Product, InsertProduct, ProductWithDetails, DashboardSummary } from '@shared/schema';

export class ProductService {
  /**
   * Get all products with optional filtering
   */
  static async getProducts(filter: ProductFilter = {} as ProductFilter) {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    if (filter.page) queryParams.append('page', filter.page.toString());
    if (filter.limit) queryParams.append('limit', filter.limit.toString());
    if (filter.search) queryParams.append('search', filter.search);
    if (filter.category && filter.category !== 'all') queryParams.append('category', filter.category);
    if (filter.sortBy) queryParams.append('sortBy', filter.sortBy);
    if (filter.sortDirection) queryParams.append('sortDirection', filter.sortDirection);
    
    // Add range filters
    if (filter.priceRange) {
      queryParams.append('priceRangeLow', filter.priceRange[0].toString());
      queryParams.append('priceRangeHigh', filter.priceRange[1].toString());
    }
    if (filter.trendScore) {
      queryParams.append('trendScoreMin', filter.trendScore[0].toString());
      queryParams.append('trendScoreMax', filter.trendScore[1].toString());
    }
    if (filter.engagementRate) {
      queryParams.append('engagementRateMin', filter.engagementRate[0].toString());
      queryParams.append('engagementRateMax', filter.engagementRate[1].toString());
    }
    if (filter.salesVelocity) {
      queryParams.append('salesVelocityMin', filter.salesVelocity[0].toString());
      queryParams.append('salesVelocityMax', filter.salesVelocity[1].toString());
    }
    if (filter.searchVolume) {
      queryParams.append('searchVolumeMin', filter.searchVolume[0].toString());
      queryParams.append('searchVolumeMax', filter.searchVolume[1].toString());
    }
    if (filter.geographicSpread) {
      queryParams.append('geographicSpreadMin', filter.geographicSpread[0].toString());
      queryParams.append('geographicSpreadMax', filter.geographicSpread[1].toString());
    }
    
    const url = `${API.PRODUCTS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return apiRequest<{ products: Product[], total: number }>(url);
  }

  /**
   * Get a single product by ID
   */
  static async getProduct(id: number) {
    return apiRequest<Product>(`${API.PRODUCTS}/${id}`);
  }

  /**
   * Get a product with all related details (trends, regions, videos)
   */
  static async getProductWithDetails(id: number) {
    // This endpoint is not directly available, so we'll fetch individually
    const product = await this.getProduct(id);
    const trends = await apiRequest(API.TRENDS_FOR_PRODUCT(id));
    const regions = await apiRequest(API.REGIONS_FOR_PRODUCT(id));
    const videos = await apiRequest(API.VIDEOS_FOR_PRODUCT(id));
    
    return {
      ...product,
      trends,
      regions,
      videos,
      regionCount: regions.length,
      videoCount: videos.length
    };
  }

  /**
   * Create a new product
   */
  static async createProduct(product: InsertProduct) {
    return apiRequest<Product>(API.PRODUCTS, {
      method: 'POST',
      body: JSON.stringify(product)
    });
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: number, product: Partial<InsertProduct>) {
    return apiRequest<Product>(`${API.PRODUCTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product)
    });
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: number) {
    return apiRequest<void>(`${API.PRODUCTS}/${id}`, {
      method: 'DELETE'
    });
  }

  /**
   * Get product categories
   */
  static async getCategories() {
    return apiRequest(API.CATEGORIES);
  }

  /**
   * Get trending products
   */
  static async getTrendingProducts(limit: number = 5) {
    // Using dashboard/products since trending_products doesn't exist in routes
    return apiRequest(`${API.DASHBOARD}/products?limit=${limit}`);
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string, limit: number = 10) {
    // Update to match actual route structure from server
    return apiRequest(`${API.PRODUCTS}?category=${category}&limit=${limit}`);
  }

  /**
   * Get products by region
   */
  static async getProductsByRegion(region: string, limit: number = 10) {
    // Update to match actual route structure from server
    return apiRequest(`${API.PRODUCTS}?region=${region}&limit=${limit}`);
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary() {
    return apiRequest<DashboardSummary>(API.DASHBOARD);
  }
}