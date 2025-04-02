/**
 * AppOrchestrator - Coordinate application startup and service lifecycle
 * 
 * This service orchestrates the initialization and shutdown of all application
 * components, ensuring proper dependency management and graceful startup/shutdown.
 */

import { Server } from 'http';
import { eventBus } from './EventBus.js';
import { enhancedDatabaseService } from '../services/common/EnhancedDatabaseService.js';
import { webSocketService } from '../services/common/WebSocketService.js';
import { log } from '../vite.js';

/**
 * Component configuration
 */
interface ComponentConfig {
  name: string;
  dependencies: string[];
  initialize: () => Promise<boolean>;
  shutdown?: () => Promise<void>;
}

/**
 * Component status
 */
type ComponentStatus = 'pending' | 'initializing' | 'initialized' | 'failed' | 'shutdown';

/**
 * Component state
 */
interface ComponentState {
  config: ComponentConfig;
  status: ComponentStatus;
  error?: any;
}

/**
 * AppOrchestrator class
 */
export class AppOrchestrator {
  private static instance: AppOrchestrator;
  private components: Map<string, ComponentState> = new Map();
  private isInitialized = false;
  private initializationOrder: string[] = [];
  
  private constructor() {}
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): AppOrchestrator {
    if (!AppOrchestrator.instance) {
      AppOrchestrator.instance = new AppOrchestrator();
    }
    return AppOrchestrator.instance;
  }
  
  /**
   * Register core components (database, WebSocket, etc.)
   */
  public registerCoreComponents(): void {
    // Register database
    this.registerComponent({
      name: 'database',
      dependencies: [],
      initialize: async () => {
        return enhancedDatabaseService.initialize();
      },
      shutdown: async () => {
        await enhancedDatabaseService.shutdown();
      }
    });
    
    // Register WebSocket
    this.registerComponent({
      name: 'websocket',
      dependencies: ['database'],
      initialize: async (server) => {
        if (!server) {
          log('Cannot initialize WebSocket service: No server provided', 'orchestrator');
          return false;
        }
        return webSocketService.initialize(server);
      },
      shutdown: async () => {
        webSocketService.shutdown();
      }
    });
  }
  
  /**
   * Register a component with the orchestrator
   */
  public registerComponent(config: ComponentConfig): void {
    if (this.components.has(config.name)) {
      log(`Component ${config.name} is already registered`, 'orchestrator');
      return;
    }
    
    // Store the component config
    this.components.set(config.name, {
      config,
      status: 'pending'
    });
    
    log(`Component ${config.name} registered with dependencies: [${config.dependencies.join(', ')}]`, 'orchestrator');
  }
  
  /**
   * Initialize all registered components in dependency order
   */
  public async initialize(server?: Server): Promise<boolean> {
    if (this.isInitialized) {
      log('Application is already initialized', 'orchestrator');
      return true;
    }
    
    log('Starting application initialization...', 'orchestrator');
    
    try {
      // Build dependency graph and initialization order
      this.buildInitializationOrder();
      
      // Initialize all components in order
      for (const componentName of this.initializationOrder) {
        const component = this.components.get(componentName);
        
        if (!component) {
          log(`Component ${componentName} not found`, 'orchestrator');
          continue;
        }
        
        // Check if all dependencies are initialized
        const dependenciesInitialized = this.checkDependenciesInitialized(component.config.dependencies);
        
        if (!dependenciesInitialized) {
          log(`Component ${componentName} skipped: dependencies not initialized`, 'orchestrator');
          component.status = 'failed';
          component.error = 'Dependencies not initialized';
          continue;
        }
        
        // Initialize the component
        log(`Initializing component ${componentName}...`, 'orchestrator');
        component.status = 'initializing';
        
        try {
          // Initialize with server if available and needed
          const success = await component.config.initialize(server);
          
          if (success) {
            component.status = 'initialized';
            log(`Component ${componentName} initialized successfully`, 'orchestrator');
            
            // Publish component initialization event
            eventBus.publish(`component:${componentName}:initialized`, {
              timestamp: new Date().toISOString()
            });
          } else {
            component.status = 'failed';
            component.error = 'Initialization returned false';
            log(`Component ${componentName} initialization failed`, 'orchestrator');
            
            // Publish component failure event
            eventBus.publish(`component:${componentName}:failed`, {
              timestamp: new Date().toISOString(),
              error: 'Initialization returned false'
            });
            
            // Exit early if a critical component fails
            if (this.isCriticalComponent(componentName)) {
              log(`Critical component ${componentName} failed, aborting initialization`, 'orchestrator');
              return false;
            }
          }
        } catch (error) {
          component.status = 'failed';
          component.error = error;
          log(`Component ${componentName} initialization error: ${error}`, 'orchestrator');
          
          // Publish component failure event
          eventBus.publish(`component:${componentName}:failed`, {
            timestamp: new Date().toISOString(),
            error: String(error)
          });
          
          // Exit early if a critical component fails
          if (this.isCriticalComponent(componentName)) {
            log(`Critical component ${componentName} failed, aborting initialization`, 'orchestrator');
            return false;
          }
        }
      }
      
      // Check if all critical components are initialized
      const allCriticalComponentsInitialized = this.checkAllCriticalComponentsInitialized();
      
      if (allCriticalComponentsInitialized) {
        this.isInitialized = true;
        log('Application initialization completed successfully', 'orchestrator');
        
        // Publish application initialized event
        eventBus.publish('app:initialized', {
          timestamp: new Date().toISOString(),
          components: Array.from(this.components.keys())
        });
        
        return true;
      } else {
        log('Application initialization failed: Not all critical components initialized', 'orchestrator');
        
        // Publish application initialization failure event
        eventBus.publish('app:initialization_failed', {
          timestamp: new Date().toISOString(),
          reason: 'Not all critical components initialized'
        });
        
        return false;
      }
    } catch (error) {
      log(`Application initialization error: ${error}`, 'orchestrator');
      
      // Publish application initialization failure event
      eventBus.publish('app:initialization_failed', {
        timestamp: new Date().toISOString(),
        error: String(error)
      });
      
      return false;
    }
  }
  
  /**
   * Build the initialization order based on dependencies
   */
  private buildInitializationOrder(): void {
    // Clear existing order
    this.initializationOrder = [];
    
    // Set of visited nodes for cycle detection
    const visited = new Set<string>();
    const visiting = new Set<string>();
    
    // Helper function for topological sort
    const visit = (componentName: string): void => {
      // Skip if already visited
      if (visited.has(componentName)) {
        return;
      }
      
      // Check for cycles
      if (visiting.has(componentName)) {
        throw new Error(`Circular dependency detected: ${componentName}`);
      }
      
      // Mark as visiting
      visiting.add(componentName);
      
      // Visit dependencies
      const component = this.components.get(componentName);
      if (component) {
        for (const dependency of component.config.dependencies) {
          // Skip if dependency doesn't exist
          if (!this.components.has(dependency)) {
            log(`Dependency ${dependency} not found for component ${componentName}`, 'orchestrator');
            continue;
          }
          
          visit(dependency);
        }
      }
      
      // Mark as visited
      visited.add(componentName);
      visiting.delete(componentName);
      
      // Add to initialization order
      this.initializationOrder.push(componentName);
    };
    
    // Visit all components
    for (const componentName of this.components.keys()) {
      if (!visited.has(componentName)) {
        visit(componentName);
      }
    }
    
    log(`Initialization order: [${this.initializationOrder.join(', ')}]`, 'orchestrator');
  }
  
  /**
   * Check if all dependencies of a component are initialized
   */
  private checkDependenciesInitialized(dependencies: string[]): boolean {
    for (const dependency of dependencies) {
      const component = this.components.get(dependency);
      
      if (!component || component.status !== 'initialized') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if all critical components are initialized
   */
  private checkAllCriticalComponentsInitialized(): boolean {
    const criticalComponents = ['database', 'websocket'];
    
    for (const componentName of criticalComponents) {
      const component = this.components.get(componentName);
      
      if (!component || component.status !== 'initialized') {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Check if a component is critical
   */
  private isCriticalComponent(componentName: string): boolean {
    return ['database', 'websocket'].includes(componentName);
  }
  
  /**
   * Get the status of all components
   */
  public getComponentStatus(): Record<string, { status: ComponentStatus, error?: any }> {
    const result: Record<string, { status: ComponentStatus, error?: any }> = {};
    
    for (const [name, component] of this.components.entries()) {
      result[name] = {
        status: component.status,
        error: component.error
      };
    }
    
    return result;
  }
  
  /**
   * Shutdown all components in reverse initialization order
   */
  public async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      log('Application not initialized, nothing to shutdown', 'orchestrator');
      return;
    }
    
    log('Starting application shutdown...', 'orchestrator');
    
    // Publish application shutdown event
    eventBus.publish('app:shutdown', {
      timestamp: new Date().toISOString()
    });
    
    // Reverse the initialization order for proper shutdown
    const shutdownOrder = [...this.initializationOrder].reverse();
    
    // Shutdown all components in order
    for (const componentName of shutdownOrder) {
      const component = this.components.get(componentName);
      
      if (!component || component.status !== 'initialized') {
        continue;
      }
      
      log(`Shutting down component ${componentName}...`, 'orchestrator');
      
      try {
        if (component.config.shutdown) {
          await component.config.shutdown();
        }
        
        component.status = 'shutdown';
        log(`Component ${componentName} shut down successfully`, 'orchestrator');
      } catch (error) {
        log(`Error shutting down component ${componentName}: ${error}`, 'orchestrator');
      }
    }
    
    this.isInitialized = false;
    log('Application shutdown completed', 'orchestrator');
  }
}

// Export singleton instance
export const appOrchestrator = AppOrchestrator.getInstance();

// Export default for convenience
export default appOrchestrator;