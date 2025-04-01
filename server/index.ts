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
import { eq, and, like, gt, lt, gte, lte } from 'drizzle-orm';
import { sql as drizzleSql } from 'drizzle-orm';

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
const sql = process.env.DATABASE_URL 
  ? neon(process.env.DATABASE_URL)
  : null;

// Create Drizzle client
const db = sql ? drizzle(sql) : null;

// Create the HTTP server
const server = createServer(app);

// Redirect /trendtracker to the frontend SPA route
app.get('/trendtracker', (req, res) => {
  res.redirect('/');
});

// Root route - serve the frontend
app.get('/', (req, res) => {
  const html = '<!DOCTYPE html>' +
    '<html>' +
    '<head>' +
    '<title>TrendDrop - Trendtracker | Product Research Tool</title>' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<style>' +
    'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; line-height: 1.6; background-color: #f9fafb; color: #333; }' +
    'h1 { color: #2563eb; font-size: 2.5rem; margin-bottom: 0.5rem; }' +
    'h2 { color: #1e40af; margin-top: 0; }' +
    'a.button { display: inline-block; background: #2563eb; color: white; padding: 0.7rem 1.2rem; border-radius: 5px; font-weight: 600; text-decoration: none; margin-top: 1rem; margin-right: 0.8rem; transition: all 0.2s; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.1); }' +
    'a.button:hover { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 6px 10px rgba(37, 99, 235, 0.2); }' +
    'a.button.secondary { background: #4b5563; }' +
    'a.button.secondary:hover { background: #374151; }' +
    '.section { margin: 2.5rem 0; padding: 1.5rem; border-radius: 8px; background: white; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }' +
    '.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; margin-top: 1.5rem; }' +
    '.card { padding: 1.2rem; border-radius: 8px; background: #f0f9ff; border: 1px solid #bae6fd; }' +
    '.tag { display: inline-block; font-size: 0.75rem; font-weight: 600; background: #dbeafe; color: #1e40af; padding: 0.2rem 0.6rem; border-radius: 9999px; margin-right: 0.5rem; }' +
    '.logo { font-weight: 800; letter-spacing: -0.5px; }' +
    '.header { display: flex; align-items: center; justify-content: space-between; }' +
    '.status { display: inline-block; font-size: 0.875rem; margin-left: 0.5rem; padding: 0.2rem 0.6rem; border-radius: 9999px; }' +
    '.status.idle { background: #e0e7ff; color: #4338ca; }' +
    '.status.running { background: #dcfce7; color: #15803d; animation: pulse 2s infinite; }' +
    '.api-list { list-style-type: none; padding-left: 0; }' +
    '.api-list li { margin-bottom: 0.8rem; padding: 0.7rem 1rem; background: #f1f5f9; border-radius: 4px; }' +
    '.api-list li strong { color: #0f172a; display: inline-block; margin-right: 0.4rem; }' +
    '.api-method { font-size: 0.7rem; font-weight: bold; padding: 0.15rem 0.4rem; border-radius: 4px; margin-right: 0.5rem; background: #e0f2fe; color: #0369a1; }' +
    '.api-method.post { background: #d1fae5; color: #047857; }' +
    '.footer { margin-top: 3rem; text-align: center; font-size: 0.875rem; color: #6b7280; }' +
    '.progress-container { margin: 1.5rem 0; background: #e5e7eb; border-radius: 9999px; overflow: hidden; height: 0.5rem; }' +
    '.progress-bar { height: 100%; width: 0%; background: linear-gradient(90deg, #3b82f6, #2563eb); transition: width 0.5s ease; }' +
    '@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }' +
    '@media (max-width: 640px) { .card-grid { grid-template-columns: 1fr; } }' +
    '</style>' +
    '</head>' +
    '<body>' +
    '<div class="header">' +
    '<h1 class="logo">TrendDrop <span style="font-weight: 400; font-size: 1.8rem;">Trendtracker</span></h1>' +
    '<div><span id="statusIndicator" class="status idle">IDLE</span></div>' +
    '</div>' +
    '<p>A comprehensive product research platform for identifying high-potential dropshipping opportunities and trending markets.</p>' +
    
    '<div class="section">' +
    '<h2>Product Research Intelligence</h2>' +
    '<p>Leverage our AI-powered research agent to discover trending products across social media platforms, wholesaler sites, and ecommerce marketplaces.</p>' +
    '<div class="progress-container">' +
    '<div id="progressBar" class="progress-bar"></div>' +
    '</div>' +
    '<div id="stats">' +
    '<div><strong>Status:</strong> <span id="statusText">Not Running</span></div>' +
    '<div><strong>Progress:</strong> <span id="progressText">0%</span></div>' +
    '<div><strong>Products Found:</strong> <span id="productsFoundText">0</span></div>' +
    '</div>' +
    '<div>' +
    '<a href="javascript:void(0);" onclick="startScraper()" class="button">Start Research Agent</a>' +
    '<a href="javascript:void(0);" onclick="checkStatus()" class="button secondary">Check Status</a>' +
    '</div>' +
    '</div>' +
    
    '<div class="section">' +
    '<h2>API Documentation</h2>' +
    '<p>Integrate TrendDrop Trendtracker data into your own systems with our comprehensive API.</p>' +
    '<ul class="api-list">' +
    '<li><span class="api-method">GET</span> <strong>/api/products</strong> - Retrieve trending products with optional filtering</li>' +
    '<li><span class="api-method">GET</span> <strong>/api/products/:id</strong> - Get detailed information about a specific product</li>' +
    '<li><span class="api-method">GET</span> <strong>/api/categories</strong> - List all product categories</li>' +
    '<li><span class="api-method">GET</span> <strong>/api/regions</strong> - Retrieve geographic distribution data</li>' +
    '<li><span class="api-method post">POST</span> <strong>/api/scraper/start</strong> - Trigger the product research agent</li>' +
    '<li><span class="api-method">GET</span> <strong>/api/scraper/status</strong> - Check current agent status</li>' +
    '</ul>' +
    '</div>' +
    
    '<div class="footer">' +
    '&copy; ' + new Date().getFullYear() + ' TrendDrop - Trendtracker. All rights reserved.' +
    '</div>' +
    
    '<script>' +
    'let isRunning = false;' +
    
    'function updateUI(data) {' +
    '  const statusIndicator = document.getElementById("statusIndicator");' +
    '  const progressBar = document.getElementById("progressBar");' +
    '  const statusText = document.getElementById("statusText");' +
    '  const progressText = document.getElementById("progressText");' +
    '  const productsFoundText = document.getElementById("productsFoundText");' +
    '  ' +
    '  if (data.running) {' +
    '    statusIndicator.className = "status running";' +
    '    statusIndicator.textContent = "RUNNING";' +
    '    statusText.textContent = "Active";' +
    '    isRunning = true;' +
    '  } else {' +
    '    statusIndicator.className = "status idle";' +
    '    statusIndicator.textContent = "IDLE";' +
    '    statusText.textContent = "Not Running";' +
    '    isRunning = false;' +
    '  }' +
    '  ' +
    '  progressBar.style.width = data.progress + "%";' +
    '  progressText.textContent = data.progress + "%";' +
    '  productsFoundText.textContent = data.total_found || "0";' +
    '}' +
    
    'function startScraper() {' +
    '  fetch("/api/scraper/start", {' +
    '    method: "POST",' +
    '    headers: { "Content-Type": "application/json" },' +
    '    body: JSON.stringify({ count: 100 })' +
    '  })' +
    '  .then(response => {' +
    '    if (!response.ok) {' +
    '      if (response.status === 502 || response.status === 503 || response.status === 504) {' +
    '        throw new Error("Backend service unavailable. The research agent will be available soon.");' +
    '      }' +
    '      return response.json().then(err => { throw new Error(err.message || "Server error"); });' +
    '    }' +
    '    return response.json();' +
    '  })' +
    '  .then(data => {' +
    '    updateUI({ running: true, progress: 0, total_found: 0 });' +
    '    alert("Research agent started successfully!" + (data.message ? "\\n" + data.message : ""));' +
    '  })' +
    '  .catch(error => {' +
    '    console.error("Error:", error);' +
    '    alert("Note: " + error.message);' +
    '  });' +
    '}' +
    
    'function checkStatus() {' +
    '  fetch("/api/scraper/status")' +
    '  .then(response => {' +
    '    if (!response.ok) {' +
    '      if (response.status === 502 || response.status === 503 || response.status === 504) {' +
    '        throw new Error("Backend service unavailable. The research agent will be available soon.");' +
    '      }' +
    '      return response.json().then(err => { throw new Error(err.message || "Server error"); });' +
    '    }' +
    '    return response.json();' +
    '  })' +
    '  .then(data => {' +
    '    updateUI(data);' +
    '    var message = "Research Agent Status:\\n";' +
    '    message += "Running: " + (data.running ? "Yes" : "No") + "\\n";' +
    '    message += "Progress: " + data.progress + "%\\n";' +
    '    message += "Products Found: " + (data.total_found || "0");' +
    '    if (data.error) message += "\\nError: " + data.error;' +
    '    if (data.message) message += "\\nMessage: " + data.message;' +
    '    alert(message);' +
    '  })' +
    '  .catch(error => {' +
    '    console.error("Error:", error);' +
    '    alert("Note: " + error.message);' +
    '  });' +
    '}' +
    
    // Auto-check status on page load
    'setTimeout(function() {' +
    '  fetch("/api/scraper/status")' +
    '  .then(response => response.ok ? response.json() : { running: false, progress: 0, total_found: 0 })' +
    '  .then(data => updateUI(data))' +
    '  .catch(() => console.log("Initial status check failed"));' +
    '}, 500);' +
    '</script>' +
    '</body>' +
    '</html>';
  
  res.send(html);
});

// API Routes
app.get('/api/dashboard', async (req, res) => {
  try {
    if (!db) {
      return res.json({
        trendingProductsCount: 0,
        averageTrendScore: 0,
        highPerformingCount: 0,
        percentChange: 0
      });
    }
    
    // Get total trending products count
    const productsCount = await db.select({ count: drizzleSql`count(*)` }).from(products);
    const trendingProductsCount = productsCount[0]?.count || 0;
    
    // Get average trend score
    const avgScoreResult = await db.select({ avg: drizzleSql`avg(trend_score)` }).from(products);
    const averageTrendScore = Math.round(Number(avgScoreResult[0]?.avg || 0));
    
    // Get high-performing products (trend score > 80)
    const highPerforming = await db.select({ count: drizzleSql`count(*)` })
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
    if (!db) {
      return res.json({ products: [] });
    }
    
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
    if (!db) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
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
    if (!db) {
      return res.json([]);
    }
    
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
    if (!db) {
      return res.json([]);
    }
    
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

// Keep track of the scraper status for development mode
let scraperMockStatus = {
  running: false,
  progress: 0,
  total_found: 0,
  start_time: null as string | null,
  message: 'Scraper service in development mode',
};

let progressInterval: NodeJS.Timeout | null = null;

// API endpoints to trigger the Python backend scraper agent
app.post('/api/scraper/start', async (req, res) => {
  try {
    const { count = 1000 } = req.body;
    
    // Try to call the Python FastAPI endpoint
    try {
      // Create a timeout promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const fetchPromise = fetch('http://localhost:8000/api/scraper/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      
      const response = await Promise.race([fetchPromise, timeout]) as Response;
      
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.log('Python backend not available, using development mode');
    }
    
    // Fallback for development mode - simulate scraper behavior
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    scraperMockStatus = {
      running: true,
      progress: 0,
      total_found: 0,
      start_time: new Date().toISOString(),
      message: 'Scraper service running in development mode',
    };
    
    // Simulate progress updates
    progressInterval = setInterval(() => {
      if (scraperMockStatus.running && scraperMockStatus.progress < 100) {
        const increment = Math.floor(Math.random() * 5) + 1;
        const newProgress = Math.min(scraperMockStatus.progress + increment, 100);
        const newFound = Math.floor(newProgress / 100 * count);
        
        scraperMockStatus.progress = newProgress;
        scraperMockStatus.total_found = newFound;
        
        if (newProgress >= 100) {
          scraperMockStatus.running = false;
          scraperMockStatus.message = 'Scraper service completed in development mode';
          if (progressInterval) {
            clearInterval(progressInterval);
          }
        }
      }
    }, 3000);
    
    return res.json({
      status: 'started',
      message: 'Scraper job started successfully in development mode',
      running: true,
      job_id: `dev-${Date.now()}`,
    });
  } catch (error) {
    console.error('Error starting scraper:', error);
    return res.status(500).json({ 
      error: 'Failed to start scraper job',
      message: 'The TrendDrop Trendtracker agent is temporarily unavailable. Please try again later.' 
    });
  }
});

app.get('/api/scraper/status', async (req, res) => {
  try {
    // Try to call the Python FastAPI endpoint
    try {
      // Create a timeout promise
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 3000)
      );
      
      const fetchPromise = fetch('http://localhost:8000/api/scraper/status');
      
      const response = await Promise.race([fetchPromise, timeout]) as Response;
      
      if (response.ok) {
        const data = await response.json();
        return res.json(data);
      }
    } catch (e) {
      console.log('Python backend not available, using development mode');
    }
    
    // Fallback for development mode - return mock status
    return res.json(scraperMockStatus);
  } catch (error) {
    console.error('Error getting scraper status:', error);
    return res.status(500).json({ 
      error: 'Failed to get scraper status',
      message: 'The TrendDrop Trendtracker agent status service is temporarily unavailable.',
      running: false,
      progress: 0,
      total_found: 0 
    });
  }
});

// Start the server
server.listen(port, () => {
  console.log(`[express] serving on port ${port}`);
});