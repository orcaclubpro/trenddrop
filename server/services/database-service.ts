import * as schema from '@shared/schema';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database path
const DB_PATH = path.join(__dirname, '..', '..', 'data', 'trenddrop.db');

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

      // Ensure data directory exists
      const dataDir = path.join(__dirname, '..', '..', 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Import SQLite modules
      const { drizzle } = await import('drizzle-orm/better-sqlite3');
      const Database = (await import('better-sqlite3')).default;
      
      // Create SQLite database
      const sqlite = new Database(DB_PATH);
      this.db = drizzle(sqlite, { schema });
      
      // Create tables
      this.createTables(sqlite);

      this.initialized = true;
      logMessage('Database initialized successfully!');
      return true;
    } catch (error) {
      logMessage(`Database initialization failed: ${error}`);
      this.initialized = false;
      return false;
    }
  }

  private createTables(sqlite: any): void {
    logMessage('Creating database tables...');
    
    const tableSchema = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        price_range_low REAL NOT NULL,
        price_range_high REAL NOT NULL,
        trend_score INTEGER NOT NULL,
        engagement_rate INTEGER NOT NULL,
        sales_velocity INTEGER NOT NULL,
        search_volume INTEGER NOT NULL,
        geographic_spread INTEGER NOT NULL,
        supplier_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS trends (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        date TIMESTAMP NOT NULL,
        engagement_value INTEGER NOT NULL,
        sales_value INTEGER NOT NULL,
        search_value INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      CREATE TABLE IF NOT EXISTS regions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        country TEXT NOT NULL,
        percentage INTEGER NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        platform TEXT NOT NULL,
        views INTEGER NOT NULL,
        upload_date TIMESTAMP NOT NULL,
        thumbnail_url TEXT NOT NULL,
        video_url TEXT NOT NULL,
        FOREIGN KEY (product_id) REFERENCES products (id)
      );
    `;

    sqlite.exec(tableSchema);
    logMessage('Tables created successfully');
  }
}

export default DatabaseService.getInstance();
