/**
 * Repository - Generic repository interface
 * 
 * This interface defines the standard CRUD operations for entity repositories.
 */

export interface Repository<T, ID> {
  /**
   * Find an entity by its ID
   */
  findById(id: ID): Promise<T | undefined>;
  
  /**
   * Find all entities matching an optional filter
   */
  findAll(filter?: any): Promise<{ data: T[], total: number }>;
  
  /**
   * Create a new entity
   */
  create(entity: Omit<T, 'id'>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  update(id: ID, entity: Partial<T>): Promise<T | undefined>;
  
  /**
   * Delete an entity
   */
  delete(id: ID): Promise<boolean>;
}

/**
 * Base abstract repository class that provides common functionality
 */
export abstract class BaseRepository<T, ID> implements Repository<T, ID> {
  constructor() {}
  
  /**
   * Find an entity by its ID
   */
  abstract findById(id: ID): Promise<T | undefined>;
  
  /**
   * Find all entities matching an optional filter
   */
  abstract findAll(filter?: any): Promise<{ data: T[], total: number }>;
  
  /**
   * Create a new entity
   */
  abstract create(entity: Omit<T, 'id'>): Promise<T>;
  
  /**
   * Update an existing entity
   */
  abstract update(id: ID, entity: Partial<T>): Promise<T | undefined>;
  
  /**
   * Delete an entity
   */
  abstract delete(id: ID): Promise<boolean>;
}