/**
 * ProductController - Handles product-related API routes
 * 
 * This controller handles all product-related HTTP requests.
 */

import { Request, Response } from 'express';
import { productService } from '../services/index.js';
import * as schema from '../../shared/schema.js';
import { z } from 'zod';
import { log } from '../vite.js';

export class ProductController {
  /**
   * Get all products with optional filtering
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate query parameters
      const filterResult = schema.productFilterSchema.safeParse({
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        category: req.query.category,
        minTrendScore: req.query.minTrendScore ? Number(req.query.minTrendScore) : undefined,
        sortBy: req.query.sortBy,
        sortDirection: req.query.sortDirection,
        search: req.query.search
      });
      
      if (!filterResult.success) {
        res.status(400).json({
          error: 'Invalid filter parameters',
          details: filterResult.error.errors
        });
        return;
      }
      
      // Get products from service
      const { products, total } = await productService.getProducts(filterResult.data);
      
      // Return results
      res.json({
        products,
        total,
        page: filterResult.data.page || 1,
        pageSize: filterResult.data.pageSize || 10
      });
    } catch (error) {
      log(`Error in getProducts: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }

  /**
   * Get a product by ID
   */
  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Check if details are requested
      const includeDetails = req.query.details === 'true';
      
      // Get product from service
      const product = await productService.getProduct(id, includeDetails);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      // Return product
      res.json(product);
    } catch (error) {
      log(`Error in getProduct: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve product' });
    }
  }

  /**
   * Create a new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate request body
      const productResult = schema.insertProductSchema.safeParse(req.body);
      
      if (!productResult.success) {
        res.status(400).json({
          error: 'Invalid product data',
          details: productResult.error.errors
        });
        return;
      }
      
      // Create product using service
      const newProduct = await productService.createProduct(productResult.data);
      
      // Return created product
      res.status(201).json(newProduct);
    } catch (error) {
      log(`Error in createProduct: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to create product' });
    }
  }

  /**
   * Update an existing product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Parse and validate request body
      const productResult = schema.insertProductSchema.partial().safeParse(req.body);
      
      if (!productResult.success) {
        res.status(400).json({
          error: 'Invalid product data',
          details: productResult.error.errors
        });
        return;
      }
      
      // Update product using service
      const updatedProduct = await productService.updateProduct(id, productResult.data);
      
      if (!updatedProduct) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      // Return updated product
      res.json(updatedProduct);
    } catch (error) {
      log(`Error in updateProduct: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to update product' });
    }
  }

  /**
   * Delete a product
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid product ID' });
        return;
      }
      
      // Delete product using service
      const success = await productService.deleteProduct(id);
      
      if (!success) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      // Return success response
      res.json({ success: true });
    } catch (error) {
      log(`Error in deleteProduct: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  /**
   * Get product categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      // Get categories from service
      const categories = await productService.getCategories();
      
      // Return categories
      res.json({ categories });
    } catch (error) {
      log(`Error in getCategories: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve categories' });
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      // Get dashboard summary from service
      const summary = await productService.getDashboardSummary();
      
      // Return summary
      res.json(summary);
    } catch (error) {
      log(`Error in getDashboardSummary: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve dashboard summary' });
    }
  }
}

// Export controller instance
export const productController = new ProductController();

// Export default for convenience
export default productController;