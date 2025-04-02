/**
 * BaseRepository - Generic implementation of repository pattern
 * 
 * Provides a strongly-typed base implementation of common repository operations
 * to reduce code duplication and improve maintainability.
 */

import { PgTable, SQL, asc, desc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eventBus } from '../core/EventBus.js';
import { enhancedDatabaseService } from '../services/common/EnhancedDatabaseService.js';
import { log } from '../vite.js';

/**
 * FilterOptions interface for standardizing query filtering
 */
export interface FilterOptions<T = any> {
  page?: number;
  limit?: number;
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  search?: string;
  searchFields?: (keyof T)[];
  filters?: Partial<Record<keyof T, any>>;
}

/**
 * Generic repository interface
 */
export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | undefined>;
  findAll(filter?: FilterOptions<T>): Promise<{ data: T[], total: number }>;
  create(entity: Omit<T, 'id'>): Promise<T>;
  update(id: ID, entity: Partial<Omit<T, 'id'>>): Promise<T | undefined>;
  delete(id: ID): Promise<boolean>;
}

/**
 * Generic base repository implementation
 */
export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  protected table: PgTable;
  protected idColumn: SQL;
  protected entityName: string;
  protected searchableColumns: string[] = [];

  constructor(
    table: PgTable,
    idColumn: SQL,
    entityName: string,
    searchableColumns: string[] = []
  ) {
    this.table = table;
    this.idColumn = idColumn;
    this.entityName = entityName;
    this.searchableColumns = searchableColumns;
  }

  /**
   * Get the database instance
   */
  protected getDb(): ReturnType<typeof drizzle> {
    return enhancedDatabaseService.getDb();
  }

  /**
   * Find an entity by its ID
   */
  async findById(id: ID): Promise<T | undefined> {
    try {
      const db = this.getDb();
      const result = await db.select().from(this.table).where(eq(this.idColumn, id as any)).limit(1);
      return result.length > 0 ? result[0] as T : undefined;
    } catch (error) {
      log(`Error finding ${this.entityName} by ID ${id}: ${error}`, `${this.entityName}-repo`);
      throw error;
    }
  }

  /**
   * Find all entities with filtering and pagination
   */
  async findAll(options: FilterOptions<T> = {}): Promise<{ data: T[], total: number }> {
    try {
      const db = this.getDb();
      
      // Default values
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;
      
      // Build where conditions
      const whereConditions: SQL[] = [];
      
      // Add search condition if provided
      if (options.search && options.searchFields && options.searchFields.length > 0) {
        const searchConditions = options.searchFields.map(field => {
          const column = field as string;
          return sql`${this.table}.${sql.identifier(column)} ILIKE ${`%${options.search}%`}`;
        });
        
        if (searchConditions.length > 0) {
          whereConditions.push(sql`(${sql.join(searchConditions, sql` OR `)})`);
        }
      }
      
      // Add filters if provided
      if (options.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (value !== undefined && value !== null) {
            whereConditions.push(sql`${this.table}.${sql.identifier(key)} = ${value}`);
          }
        }
      }
      
      // Build final where clause
      const whereClause = whereConditions.length > 0
        ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
        : sql``;
      
      // Handle ordering
      let orderClause = sql``;
      if (options.orderBy) {
        const orderColumn = options.orderBy as string;
        const direction = options.orderDirection === 'desc' ? desc : asc;
        orderClause = sql`ORDER BY ${this.table}.${sql.identifier(orderColumn)} ${direction}`;
      }
      
      // Get total count
      const countResult = await db.execute<{ count: number }>(sql`
        SELECT COUNT(*) as count
        FROM ${this.table}
        ${whereClause}
      `);
      
      const total = Number(countResult[0].count) || 0;
      
      // Get paginated data
      const data = await db.execute<T>(sql`
        SELECT *
        FROM ${this.table}
        ${whereClause}
        ${orderClause}
        LIMIT ${limit}
        OFFSET ${offset}
      `);
      
      return { data, total };
    } catch (error) {
      log(`Error finding all ${this.entityName}: ${error}`, `${this.entityName}-repo`);
      throw error;
    }
  }

  /**
   * Create a new entity
   */
  async create(entity: Omit<T, 'id'>): Promise<T> {
    try {
      const db = this.getDb();
      const result = await db.insert(this.table).values(entity as any).returning();
      
      if (result.length === 0) {
        throw new Error(`Failed to create ${this.entityName}`);
      }
      
      const createdEntity = result[0] as T;
      
      // Publish entity created event
      eventBus.publish(`${this.entityName}:created`, {
        id: (createdEntity as any).id,
        timestamp: new Date().toISOString()
      });
      
      return createdEntity;
    } catch (error) {
      log(`Error creating ${this.entityName}: ${error}`, `${this.entityName}-repo`);
      throw error;
    }
  }

  /**
   * Update an existing entity
   */
  async update(id: ID, entity: Partial<Omit<T, 'id'>>): Promise<T | undefined> {
    try {
      const db = this.getDb();
      
      // Add updated_at timestamp if the table has this column
      const hasUpdatedAt = await this.tableHasColumn('updated_at');
      if (hasUpdatedAt) {
        (entity as any).updated_at = new Date();
      }
      
      const result = await db
        .update(this.table)
        .set(entity as any)
        .where(eq(this.idColumn, id as any))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedEntity = result[0] as T;
      
      // Publish entity updated event
      eventBus.publish(`${this.entityName}:updated`, {
        id,
        timestamp: new Date().toISOString(),
        updatedFields: Object.keys(entity)
      });
      
      return updatedEntity;
    } catch (error) {
      log(`Error updating ${this.entityName} with ID ${id}: ${error}`, `${this.entityName}-repo`);
      throw error;
    }
  }

  /**
   * Delete an entity
   */
  async delete(id: ID): Promise<boolean> {
    try {
      const db = this.getDb();
      const result = await db
        .delete(this.table)
        .where(eq(this.idColumn, id as any))
        .returning({ id: this.idColumn });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish entity deleted event
        eventBus.publish(`${this.entityName}:deleted`, {
          id,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting ${this.entityName} with ID ${id}: ${error}`, `${this.entityName}-repo`);
      throw error;
    }
  }

  /**
   * Check if a column exists in the table
   */
  private async tableHasColumn(columnName: string): Promise<boolean> {
    try {
      const db = this.getDb();
      const tableName = (this.table as any)._.name;
      
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = ${tableName}
          AND column_name = ${columnName}
        )
      `);
      
      return result[0]?.exists || false;
    } catch (error) {
      return false;
    }
  }
}

/**
 * RepositoryFactory to create repositories for different entities
 */
export class RepositoryFactory {
  /**
   * Create a repository for a specific entity
   */
  static create<T, ID>(
    table: PgTable,
    idColumn: SQL,
    entityName: string,
    searchableColumns: string[] = []
  ): BaseRepository<T, ID> {
    return new (class extends BaseRepository<T, ID> {
      constructor() {
        super(table, idColumn, entityName, searchableColumns);
      }
    })();
  }
}