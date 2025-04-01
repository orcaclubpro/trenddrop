/**
 * ServiceRegistry - Dependency Injection Container
 * 
 * This class implements a simple service registry pattern for managing
 * service lifecycle and dependencies across the application.
 */

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, any> = new Map();
  private registrationOrder: string[] = [];

  private constructor() {}

  /**
   * Get the singleton instance
   */
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
    this.services.set(name, service);
    this.registrationOrder.push(name);
    console.log(`[ServiceRegistry] Registered service: ${name}`);
  }

  /**
   * Get a service from the registry
   */
  public get<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`[ServiceRegistry] Service '${name}' not registered`);
    }
    return this.services.get(name) as T;
  }

  /**
   * Check if a service is registered
   */
  public has(name: string): boolean {
    return this.services.has(name);
  }

  /**
   * List all registered services
   */
  public listServices(): string[] {
    return [...this.registrationOrder];
  }

  /**
   * Clear all registered services (mainly used for testing)
   */
  public clear(): void {
    this.services.clear();
    this.registrationOrder = [];
  }
}

// Export singleton instance
export const serviceRegistry = ServiceRegistry.getInstance();

// Export default for convenience
export default serviceRegistry;