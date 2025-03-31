import { IStorage } from "../storage";
import { InsertProduct, Product, ProductFilter } from "@shared/schema";

export class ProductService {
  private storage: IStorage;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async getProducts(filter: ProductFilter): Promise<{ products: Product[], total: number }> {
    return this.storage.getProducts(filter);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.storage.getProduct(id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    return this.storage.createProduct(product);
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product | undefined> {
    return this.storage.updateProduct(id, product);
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.storage.deleteProduct(id);
  }

  // Calculate trend score based on component metrics
  calculateTrendScore(
    engagementRate: number, 
    salesVelocity: number, 
    searchVolume: number, 
    geographicSpread: number
  ): number {
    // Weight: 40% engagement, 30% sales, 20% search, 10% geographic
    const score = (
      (engagementRate * 0.4) + 
      (salesVelocity * 0.3) + 
      (searchVolume * 0.2) + 
      (geographicSpread * 0.1)
    );
    
    return Math.round(score);
  }
}
