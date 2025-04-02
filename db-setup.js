// PostgreSQL database setup script
import pg from 'pg';
import fs from 'fs';
import 'dotenv/config';

const { Pool } = pg;

// Check if DATABASE_URL exists in environment
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL not found in environment variables. Please check your .env file.');
  process.exit(1);
}

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function setupDatabase() {
  let client;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('🔌 Successfully connected to PostgreSQL');
    
    // Drop existing tables if they exist
    console.log('🧹 Cleaning up existing tables...');
    const dropTablesSQL = `
      DROP TABLE IF EXISTS videos CASCADE;
      DROP TABLE IF EXISTS regions CASCADE;
      DROP TABLE IF EXISTS trends CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    await client.query(dropTablesSQL);
    console.log('✅ Existing tables dropped successfully');
    
    // Read the SQL script file
    const sqlScript = fs.readFileSync('./init-db.sql', 'utf8');
    
    // Execute the SQL script
    console.log('🗃️ Initializing database schema and sample data...');
    await client.query(sqlScript);
    
    // Verify tables were created
    const tables = ['products', 'trends', 'regions', 'videos', 'users'];
    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`✅ Table ${table} created with ${result.rows[0].count} records`);
    }
    
    console.log('🚀 Database setup completed successfully!');
  } catch (err) {
    console.error('❌ Database setup error:', err.message);
    process.exit(1);
  } finally {
    // Release the client
    if (client) {
      client.release();
    }
    
    // End the pool
    await pool.end();
  }
}

setupDatabase(); 