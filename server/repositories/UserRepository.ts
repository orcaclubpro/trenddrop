/**
 * UserRepository - Repository for user data
 * 
 * This repository handles all user-related data operations.
 */

import { eq } from 'drizzle-orm';
import * as schema from '../../shared/schema.js';
import { BaseRepository } from './Repository.js';
import databaseService from '../services/database-service.js';
import { eventBus } from '../core/EventBus.js';
import { log } from '../vite.js';

export class UserRepository extends BaseRepository<schema.User, number> {
  /**
   * Find a user by ID
   */
  async findById(id: number): Promise<schema.User | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding user by ID: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Find all users
   */
  async findAll(): Promise<{ data: schema.User[], total: number }> {
    try {
      const db = databaseService.getDb();
      const users = await db.select().from(schema.users);
      
      // Return the users and total count
      return { 
        data: users, 
        total: users.length 
      };
    } catch (error) {
      log(`Error finding all users: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Find a user by username
   */
  async findByUsername(username: string): Promise<schema.User | undefined> {
    try {
      const db = databaseService.getDb();
      const result = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, username))
        .limit(1);
      
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      log(`Error finding user by username: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Create a new user
   */
  async create(userData: schema.InsertUser): Promise<schema.User> {
    try {
      const db = databaseService.getDb();
      
      // Check if username already exists
      const existingUser = await this.findByUsername(userData.username);
      
      if (existingUser) {
        throw new Error('Username already exists');
      }
      
      const result = await db.insert(schema.users).values(userData).returning();
      
      if (result.length === 0) {
        throw new Error('Failed to create user');
      }
      
      const newUser = result[0];
      
      // Publish user created event
      eventBus.publish('user:created', {
        userId: newUser.id,
        username: newUser.username,
        timestamp: new Date().toISOString()
      });
      
      return newUser;
    } catch (error) {
      log(`Error creating user: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Update an existing user
   */
  async update(id: number, userData: Partial<schema.InsertUser>): Promise<schema.User | undefined> {
    try {
      const db = databaseService.getDb();
      
      // If username is being updated, check if it already exists
      if (userData.username) {
        const existingUser = await this.findByUsername(userData.username);
        
        if (existingUser && existingUser.id !== id) {
          throw new Error('Username already exists');
        }
      }
      
      const result = await db
        .update(schema.users)
        .set(userData)
        .where(eq(schema.users.id, id))
        .returning();
      
      if (result.length === 0) {
        return undefined;
      }
      
      const updatedUser = result[0];
      
      // Publish user updated event
      eventBus.publish('user:updated', {
        userId: updatedUser.id,
        username: updatedUser.username,
        timestamp: new Date().toISOString()
      });
      
      return updatedUser;
    } catch (error) {
      log(`Error updating user: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Delete a user
   */
  async delete(id: number): Promise<boolean> {
    try {
      const db = databaseService.getDb();
      
      // Get the user first to retrieve the username
      const user = await this.findById(id);
      
      if (!user) {
        return false;
      }
      
      const result = await db
        .delete(schema.users)
        .where(eq(schema.users.id, id))
        .returning({ id: schema.users.id });
      
      const success = result.length > 0;
      
      if (success) {
        // Publish user deleted event
        eventBus.publish('user:deleted', {
          userId: id,
          username: user.username,
          timestamp: new Date().toISOString()
        });
      }
      
      return success;
    } catch (error) {
      log(`Error deleting user: ${error}`, 'user-repo');
      throw error;
    }
  }

  /**
   * Authenticate a user with username and password
   */
  async authenticate(username: string, password: string): Promise<schema.User | null> {
    try {
      const user = await this.findByUsername(username);
      
      // If user doesn't exist or password doesn't match
      if (!user || user.password !== password) {
        return null;
      }
      
      // Return the user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as schema.User;
    } catch (error) {
      log(`Error authenticating user: ${error}`, 'user-repo');
      throw error;
    }
  }
}

// Export repository instance
export const userRepository = new UserRepository();

// Export default for convenience
export default userRepository;