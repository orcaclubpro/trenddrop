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
  static async getProducts(filter: ProductFilter = {}) {
    const queryParams = new URLSearchParams();
    
    // Add filter parameters
    if (filter.page) queryParams.append('page', filter.page.toString());
    if (filter.limit) queryParams.append('limit', filter.limit.toString());
    if (filter.search) queryParams.append('search', filter.search);
    if (filter.category) queryParams.append('category', filter.category);
    if (filter.sortBy) queryParams.append('sortBy', filter.sortBy);
    if (filter.sortDirection) queryParams.append('sortDirection', filter.sortDirection);
    
    const url = `${API.PRODUCTS}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    return apiRequest<{ products: Product[], total: number }>(url);
  }

  /**
   * Get a product by ID
   */
  static async getProduct(id: number) {
    return apiRequest<Product>(API.GET_PRODUCT(id));
  }

  /**
   * Get a product with all related details (trends, regions, videos)
   */
  static async getProductWithDetails(id: number) {
    return apiRequest<ProductWithDetails>(`${API.GET_PRODUCT(id)}/details`);
  }

  /**
   * Create a new product
   */
  static async createProduct(product: InsertProduct) {
    return apiRequest<Product>(API.PRODUCTS, {
      method: 'POST',
      body: JSON.stringify(product),
      queryKey: [API.PRODUCTS]
    });
  }

  /**
   * Update an existing product
   */
  static async updateProduct(id: number, product: Partial<InsertProduct>) {
    return apiRequest<Product>(API.GET_PRODUCT(id), {
      method: 'PATCH',
      body: JSON.stringify(product),
      queryKey: [API.PRODUCTS]
    });
  }

  /**
   * Delete a product
   */
  static async deleteProduct(id: number) {
    return apiRequest<{ success: boolean }>(API.GET_PRODUCT(id), {
      method: 'DELETE',
      queryKey: [API.PRODUCTS]
    });
  }

  /**
   * Get product categories
   */
  static async getCategories() {
    return apiRequest<string[]>(API.CATEGORIES);
  }

  /**
   * Get trending products
   */
  static async getTrendingProducts(limit: number = 5) {
    return apiRequest<Product[]>(`${API.TRENDING_PRODUCTS}?limit=${limit}`);
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(category: string, limit: number = 10) {
    return apiRequest<Product[]>(`${API.PRODUCTS_BY_CATEGORY(category)}?limit=${limit}`);
  }

  /**
   * Get products by region
   */
  static async getProductsByRegion(region: string, limit: number = 10) {
    return apiRequest<Product[]>(`${API.PRODUCTS_BY_REGION(region)}?limit=${limit}`);
  }

  /**
   * Get dashboard summary
   */
  static async getDashboardSummary() {
    return apiRequest<DashboardSummary>(API.DASHBOARD);
  }
}