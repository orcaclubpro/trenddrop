/**
 * BaseService - Generic service layer abstraction
 * 
 * Provides a standard service layer pattern for domain logic that sits
 * between controllers and repositories.
 */

import { FilterOptions, IRepository } from '../repositories/BaseRepository.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

/**
 * Generic service interface
 */
export interface IService<T, ID, CreateDTO = Omit<T, 'id'>, UpdateDTO = Partial<Omit<T, 'id'>>> {
  findById(id: ID): Promise<T | undefined>;
  findAll(filter?: FilterOptions<T>): Promise<{ data: T[], total: number }>;
  create(data: CreateDTO): Promise<T>;
  update(id: ID, data: UpdateDTO): Promise<T | undefined>;
  delete(id: ID): Promise<boolean>;
}

/**
 * Generic base service implementation
 */
export abstract class BaseService<T, ID, CreateDTO = Omit<T, 'id'>, UpdateDTO = Partial<Omit<T, 'id'>>> 
  implements IService<T, ID, CreateDTO, UpdateDTO> {
  
  protected repository: IRepository<T, ID>;
  protected entityName: string;

  constructor(repository: IRepository<T, ID>, entityName: string) {
    this.repository = repository;
    this.entityName = entityName;
  }

  /**
   * Find an entity by ID
   */
  async findById(id: ID): Promise<T | undefined> {
    try {
      const entity = await this.repository.findById(id);
      
      if (entity) {
        // Hook for post-processing the entity
        return await this.processEntityAfterRead(entity);
      }
      
      return undefined;
    } catch (error) {
      log(`Error in ${this.entityName} service findById: ${error}`, `${this.entityName}-service`);
      throw error;
    }
  }

  /**
   * Find all entities with filtering and pagination
   */
  async findAll(filter?: FilterOptions<T>): Promise<{ data: T[], total: number }> {
    try {
      const result = await this.repository.findAll(filter);
      
      // Process each entity if needed
      const processedData = await Promise.all(
        result.data.map(entity => this.processEntityAfterRead(entity))
      );
      
      return {
        data: processedData,
        total: result.total
      };
    } catch (error) {
      log(`Error in ${this.entityName} service findAll: ${error}`, `${this.entityName}-service`);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async create(data: CreateDTO): Promise<T> {
    try {
      // Pre-process data before creation
      const processedData = await this.processDataBeforeCreate(data);
      const entity = await this.repository.create(processedData as Omit<T, 'id'>);
      
      // Broadcast creation event
      eventBus.publish(`${this.entityName}:created:service`, {
        id: (entity as any).id,
        timestamp: new Date().toISOString()
      });
      
      // Post-process the entity
      return await this.processEntityAfterCreate(entity);
    } catch (error) {
      log(`Error in ${this.entityName} service create: ${error}`, `${this.entityName}-service`);
      throw error;
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: ID, data: UpdateDTO): Promise<T | undefined> {
    try {
      // Verify entity exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        return undefined;
      }
      
      // Pre-process data before update
      const processedData = await this.processDataBeforeUpdate(id, data, existing);
      const updated = await this.repository.update(id, processedData as Partial<Omit<T, 'id'>>);
      
      if (updated) {
        // Broadcast update event
        eventBus.publish(`${this.entityName}:updated:service`, {
          id,
          timestamp: new Date().toISOString(),
          updatedFields: Object.keys(data)
        });
        
        // Post-process the entity
        return await this.processEntityAfterUpdate(updated);
      }
      
      return undefined;
    } catch (error) {
      log(`Error in ${this.entityName} service update: ${error}`, `${this.entityName}-service`);
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: ID): Promise<boolean> {
    try {
      // Verify entity exists
      const existing = await this.repository.findById(id);
      if (!existing) {
        return false;
      }
      
      // Pre-delete processing
      await this.processBeforeDelete(id, existing);
      
      const result = await this.repository.delete(id);
      
      if (result) {
        // Broadcast deletion event
        eventBus.publish(`${this.entityName}:deleted:service`, {
          id,
          timestamp: new Date().toISOString()
        });
        
        // Post-delete processing
        await this.processAfterDelete(id, existing);
      }
      
      return result;
    } catch (error) {
      log(`Error in ${this.entityName} service delete: ${error}`, `${this.entityName}-service`);
      throw error;
    }
  }

  /**
   * Hook to process entity after read operations
   * Override in derived classes as needed
   */
  protected async processEntityAfterRead(entity: T): Promise<T> {
    return entity;
  }

  /**
   * Hook to process data before create operations
   * Override in derived classes as needed
   */
  protected async processDataBeforeCreate(data: CreateDTO): Promise<CreateDTO> {
    return data;
  }

  /**
   * Hook to process entity after create operations
   * Override in derived classes as needed
   */
  protected async processEntityAfterCreate(entity: T): Promise<T> {
    return entity;
  }

  /**
   * Hook to process data before update operations
   * Override in derived classes as needed
   */
  protected async processDataBeforeUpdate(id: ID, data: UpdateDTO, existing: T): Promise<UpdateDTO> {
    return data;
  }

  /**
   * Hook to process entity after update operations
   * Override in derived classes as needed
   */
  protected async processEntityAfterUpdate(entity: T): Promise<T> {
    return entity;
  }

  /**
   * Hook to process entity before delete operations
   * Override in derived classes as needed
   */
  protected async processBeforeDelete(id: ID, entity: T): Promise<void> {
    // Default implementation is empty
  }

  /**
   * Hook to process after delete operations
   * Override in derived classes as needed
   */
  protected async processAfterDelete(id: ID, entity: T): Promise<void> {
    // Default implementation is empty
  }
}

/**
 * ServiceFactory to create services for different entities
 */
export class ServiceFactory {
  /**
   * Create a service for a specific entity
   */
  static create<T, ID, CreateDTO = Omit<T, 'id'>, UpdateDTO = Partial<Omit<T, 'id'>>>(
    repository: IRepository<T, ID>,
    entityName: string
  ): BaseService<T, ID, CreateDTO, UpdateDTO> {
    return new (class extends BaseService<T, ID, CreateDTO, UpdateDTO> {
      constructor() {
        super(repository, entityName);
      }
    })();
  }
}