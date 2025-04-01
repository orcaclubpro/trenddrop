import express from 'express';
import session from 'express-session';
import MemoryStore from 'memorystore';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createServer } from 'http';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { neon } from '@neondatabase/serverless';
import { Pool } from '@neondatabase/serverless';
import * as schema from '../shared/schema.js';
import { products, trends, regions, videos } from '../shared/schema.js';
import { eq, and, like, gt, lt, gte, lte, sql } from 'drizzle-orm';

// Initialize file paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express app
const app = express();
const port = process.env.PORT || 5000;

// Initialize session store
const MemoryStoreSession = MemoryStore(session);
const sessionStore = new MemoryStoreSession({
  checkPeriod: 86400000, // prune expired entries every 24h
});

// Middleware
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'keyboard cat',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      maxAge: 86400000, // 24 hours
    },
  })
);

// Database connection
let dbConnection;
if (process.env.DATABASE_URL) {
  dbConnection = neon(process.env.DATABASE_URL);
} else {
  // Use in-memory SQLite (or other fallback) as needed
  dbConnection = () => Promise.resolve({ rows: [] });
}
const db = drizzle(dbConnection);

// Create the HTTP server
const server = createServer(app);

// Root route - serve the frontend
app.get('/', (req, res) => {
  const html = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<title>TrendDrop Product Research Tool</title>' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }' +
    'h1 { color: #333; }' +
    'a { display: inline-block; background: #0070f3; color: white; padding: 0.5rem 1rem; border-radius: 3px; text-decoration: none; margin-top: 1rem; margin-right: 0.5rem; }' +
    '.section { margin: 2rem 0; padding: 1rem; border: 1px solid #eaeaea; border-radius: 5px; }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<h1>TrendDrop Product Research Tool</h1>' +
    '<p>Welcome to the TrendDrop Product Research Tool, a platform for identifying trending dropshipping products.</p>' +
    '<div class="section">' +
    '<h2>Product Research Agent</h2>' +
    '<p>Use our AI-powered agent to discover trending products across multiple platforms.</p>' +
    '<a href="javascript:void(0);" onclick="startScraper()">Start Agent</a>' +
    '<a href="javascript:void(0);" onclick="checkStatus()">Check Status</a>' +
    '</div>' +
    '<div class="section">' +
    '<h2>API Endpoints</h2>' +
    '<ul>' +
    '<li><strong>GET /api/products</strong> - Get trending products</li>' +
    '<li><strong>GET /api/products/:id</strong> - Get product details</li>' +
    '<li><strong>GET /api/categories</strong> - Get product categories</li>' +
    '<li><strong>GET /api/regions</strong> - Get product regions</li>' +
    '<li><strong>POST /api/scraper/start</strong> - Start the scraper agent</li>' +
    '<li><strong>GET /api/scraper/status</strong> - Check scraper status</li>' +
    '</ul>' +
    '</div>' +
    '<script>' +
    'function startScraper() {' +
    '  fetch("/api/scraper/start", {' +
    '    method: "POST",' +
    '    headers: { "Content-Type": "application/json" },' +
    '    body: JSON.stringify({ count: 100 })' +
    '  })' +
    '  .then(response => response.json())' +
    '  .then(data => {' +
    '    alert("Scraper started successfully! Status: " + data.status);' +
    '  })' +
    '  .catch(error => {' +
    '    alert("Error starting scraper: " + error.message);' +
    '  });' +
    '}' +
    'function checkStatus() {' +
    '  fetch("/api/scraper/status")' +
    '  .then(response => response.json())' +
    '  .then(data => {' +
    '    var message = "Scraper Status:\\n";' +
    '    message += "Running: " + (data.running ? "Yes" : "No") + "\\n";' +
    '    message += "Progress: " + data.progress + "%\\n";' +
    '    message += "Products Found: " + data.total_found;' +
    '    if (data.error) message += "\\nError: " + data.error;' +
    '    alert(message);' +
    '  })' +
    '  .catch(error => {' +
    '    alert("Error getting scraper status: " + error.message);' +
    '  });' +
    '}' +
    '</script>' +
    '</body>' +
    '</html>';
  
  res.send(html);
});

// API Routes
app.get('/api/dashboard', async (req, res) => {
  try {
    // Get total trending products count
    const productsCount = await db.select({ count: sql`count(*)` }).from(products);
    const trendingProductsCount = productsCount[0]?.count || 0;
    
    // Get average trend score
    const avgScoreResult = await db.select({ avg: sql`avg(trend_score)` }).from(products);
    const averageTrendScore = Math.round(Number(avgScoreResult[0]?.avg || 0));
    
    // Get high-performing products (trend score > 80)
    const highPerforming = await db.select({ count: sql`count(*)` })
      .from(products)
      .where(gte(products.trendScore, 80));
    const highPerformingCount = highPerforming[0]?.count || 0;
    
    // Calculate percent change (mocked for now)
    const percentChange = 12.5; // This would be calculated from historical data
    
    return res.json({
      trendingProductsCount,
      averageTrendScore,
      highPerformingCount,
      percentChange
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const { trendScore, category, region } = req.query;
    let query = db.select().from(products);
    
    // Apply filters
    if (trendScore) {
      query = query.where(gte(products.trendScore, Number(trendScore)));
    }
    
    if (category) {
      query = query.where(eq(products.category, String(category)));
    }
    
    // Note: Region filtering would require a join with the regions table
    // This is simplified for now
    
    const result = await query.limit(100);
    return res.json({ products: result });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.select().from(products).where(eq(products.id, Number(id))).limit(1);
    
    if (!product || product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Get related trends
    const productTrends = await db.select().from(trends).where(eq(trends.productId, Number(id)));
    
    // Get regions
    const productRegions = await db.select().from(regions).where(eq(regions.productId, Number(id)));
    
    // Get videos
    const productVideos = await db.select().from(videos).where(eq(videos.productId, Number(id)));
    
    return res.json({
      product: product[0],
      trends: productTrends,
      regions: productRegions,
      videos: productVideos
    });
  } catch (error) {
    console.error('Error fetching product details:', error);
    return res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categoriesResult = await db.select({ category: products.category })
      .from(products)
      .groupBy(products.category);
    
    const categories = categoriesResult.map(item => item.category);
    return res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.get('/api/regions', async (req, res) => {
  try {
    const regionsResult = await db.select({ country: regions.country })
      .from(regions)
      .groupBy(regions.country);
    
    const regionsList = regionsResult.map(item => item.country);
    return res.json(regionsList);
  } catch (error) {
    console.error('Error fetching regions:', error);
    return res.status(500).json({ error: 'Failed to fetch regions' });
  }
});

// API endpoints to trigger the Python backend scraper agent
app.post('/api/scraper/start', async (req, res) => {
  try {
    const { count = 1000 } = req.body;
    
    // Call the Python FastAPI endpoint
    const response = await fetch('http://localhost:8000/api/scraper/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count }),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to start scraper: ${response.statusText}`);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error starting scraper:', error);
    return res.status(500).json({ error: 'Failed to start scraper job' });
  }
});

app.get('/api/scraper/status', async (req, res) => {
  try {
    // Call the Python FastAPI endpoint
    const response = await fetch('http://localhost:8000/api/scraper/status');
    
    if (!response.ok) {
      throw new Error(`Failed to get scraper status: ${response.statusText}`);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('Error getting scraper status:', error);
    return res.status(500).json({ error: 'Failed to get scraper status' });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`[express] serving on port ${port}`);
});