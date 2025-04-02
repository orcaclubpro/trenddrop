// Test PostgreSQL connection
import pg from 'pg';

const { Pool } = pg;

// Create a new pool instance using the DATABASE_URL from .env
const pool = new Pool({
  connectionString: 'postgres://chance@localhost:5432/trenddrop'
});

async function testConnection() {
  let client;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to PostgreSQL');
    
    // Check if the products table exists and has data
    const { rows } = await client.query('SELECT * FROM products');
    
    if (rows.length > 0) {
      console.log(`Found ${rows.length} products in the database:`);
      rows.forEach(product => {
        console.log(`- ${product.id}: ${product.name} (Category: ${product.category})`);
      });
    } else {
      console.log('No products found in the database');
    }
    
    // Check other tables
    const tableNames = ['trends', 'regions', 'videos', 'users'];
    
    for (const tableName of tableNames) {
      try {
        const result = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`Table ${tableName} exists with ${result.rows[0].count} records`);
      } catch (err) {
        console.error(`Table ${tableName} error:`, err.message);
      }
    }
  } catch (err) {
    console.error('Database connection error:', err.message);
  } finally {
    // Release the client
    if (client) {
      client.release();
    }
    
    // End the pool
    await pool.end();
  }
}

testConnection(); 