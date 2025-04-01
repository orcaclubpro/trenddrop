// In server/initialize.ts - Update the initializeDatabase function

export async function initializeDatabase(): Promise<boolean> {
  // Don't retry connection too frequently
  const now = Date.now();
  if (databaseConnecting || (now - lastConnectionAttempt < RECONNECT_INTERVAL && lastConnectionAttempt !== 0)) {
    console.log('[Database] Connection attempt already in progress or too recent');
    return databaseInitialized;
  }

  databaseConnecting = true;
  lastConnectionAttempt = now;
  
  try {
    console.log('[Database] Attempting to connect to database...');
    
    // Try local database first if DATABASE_URL environment variable is not set
    if (!process.env.DATABASE_URL) {
      console.log('[Database] No DATABASE_URL environment variable found, using local SQLite database');
      process.env.DATABASE_URL = 'file:./data/trenddrop.db';
    }
    
    // Create SQL client based on the URL
    let sql;
    if (process.env.DATABASE_URL.startsWith('file:')) {
      // Local SQLite database
      const SQLite = (await import('better-sqlite3')).default;
      const dbPath = process.env.DATABASE_URL.replace('file:', '');
      
      // Ensure directory exists
      const fs = await import('fs');
      const path = await import('path');
      const dir = path.dirname(dbPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const sqlite = new SQLite(dbPath);
      sql = (query: string, params?: any[]) => {
        const stmt = sqlite.prepare(query);
        return params ? stmt.all(...params) : stmt.all();
      };
    } else {
      // PostgreSQL database
      sql = neon(process.env.DATABASE_URL);
    }
    
    // Create Drizzle ORM instance
    db = drizzle(sql, { schema });
    
    // Test connection
    console.log('[Database] Testing connection...');
    await sql`SELECT 1`;
    
    // Rest of the function remains the same...
    // ...

    databaseInitialized = true;
    console.log('[Database] Database initialization completed successfully');
  } catch (error) {
    console.error('[Database] Error initializing database:', error);
    db = null;
    databaseInitialized = false;
  } finally {
    databaseConnecting = false;
  }
  
  return databaseInitialized;
}
