/**
 * Service Registry
 * 
 * A lightweight service registry for managing application services.
 * This helps reduce tight coupling between components and simplifies testing.
 */

import { log } from '../vite.js';

class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();

  private constructor() {}

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  /**
   * Register a service with the registry
   */
  public register<T>(name: string, service: T): void {
    if (this.services.has(name)) {
      log(`Service '${name}' is being replaced`, 'service-registry');
    }
    
    this.services.set(name, service);
    log(`Service '${name}' registered`, 'service-registry');
  }

  /**
   * Get a service from the registry
   */
  public get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service '${name}' not found in registry`);
    }
    
    return this.services.get(name) as T;
  }

  /**
   * Check if a service exists in the registry
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * Remove a service from the registry
   */
  public remove(name: string): boolean {
    return this.services.delete(name);
  }

  /**
   * Get all registered service names
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }
}

// Export a singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();