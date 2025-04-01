import * as schema from '@shared/schema.js';
import { initializeDatabase, db as mainDb } from '../initialize.js';

// Simple logging function
function logMessage(message: string): void {
  console.log(`[Database] ${message}`);
}

export class DatabaseService {
  private static instance: DatabaseService;
  private initialized = false;
  private db: any;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public getDb() {
    if (!this.initialized) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      logMessage('Initializing database...');

      // Use the database initialization function from initialize.ts
      const success = await initializeDatabase();
      
      if (!success || !mainDb) {
        logMessage('Database initialization failed');
        this.initialized = false;
        return false;
      }
      
      this.db = mainDb;
      this.initialized = true;
      logMessage('Database initialized successfully!');
      return true;
    } catch (error) {
      logMessage(`Database initialization failed: ${error}`);
      this.initialized = false;
      return false;
    }
  }
}

export default DatabaseService.getInstance();
