import { Request, Response } from 'express';
import { ProductService } from '../services/product-service.js';
import { ProductFilter } from '@shared/schema.js';
import { log } from '../vite.js';

export class ProductController {
  private productService: ProductService;

  constructor(productService: ProductService) {
    this.productService = productService;
  }

  /**
   * Get all products with filtering
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const filter: ProductFilter = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 10,
        search: req.query.search as string,
        category: req.query.category as string,
        sortBy: req.query.sortBy as string,
        sortDirection: req.query.sortDirection as 'asc' | 'desc',
        priceRange: req.query.priceRange ? JSON.parse(req.query.priceRange as string) : undefined,
        trendScore: req.query.trendScore ? JSON.parse(req.query.trendScore as string) : undefined,
        engagementRate: req.query.engagementRate ? JSON.parse(req.query.engagementRate as string) : undefined,
        salesVelocity: req.query.salesVelocity ? JSON.parse(req.query.salesVelocity as string) : undefined,
        searchVolume: req.query.searchVolume ? JSON.parse(req.query.searchVolume as string) : undefined,
        geographicSpread: req.query.geographicSpread ? JSON.parse(req.query.geographicSpread as string) : undefined,
        createdAfter: req.query.createdAfter ? new Date(req.query.createdAfter as string) : undefined,
        createdBefore: req.query.createdBefore ? new Date(req.query.createdBefore as string) : undefined
      };

      const result = await this.productService.getProducts(filter);
      res.json(result);
    } catch (error) {
      log(`Error in getProducts: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve products' });
    }
  }

  /**
   * Get a single product by ID
   */
  async getProduct(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const product = await this.productService.getProduct(id);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
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
      const product = await this.productService.createProduct(req.body);
      res.status(201).json(product);
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
      const id = parseInt(req.params.id);
      const product = await this.productService.updateProduct(id, req.body);
      
      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      res.json(product);
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
      const id = parseInt(req.params.id);
      const success = await this.productService.deleteProduct(id);
      
      if (!success) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      log(`Error in deleteProduct: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  /**
   * Get dashboard summary
   */
  async getDashboardSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await this.productService.getDashboardSummary();
      res.json(summary);
    } catch (error) {
      log(`Error in getDashboardSummary: ${error}`, 'product-controller');
      res.status(500).json({ error: 'Failed to retrieve dashboard summary' });
    }
  }
} 