import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import databaseService from "./services/database-service.js";
import { startAgentService } from "./services/agent-service.js";
import WebSocket from "ws";

const MAX_RETRIES = Infinity; // Keep trying indefinitely
const RETRY_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Function to initialize the application with database retry logic
async function initializeApp(retryCount = 0): Promise<void> {
  try {
    log(`Attempting database initialization (attempt ${retryCount + 1})...`);
    const initialized = await databaseService.initialize();

    if (!initialized) {
      if (retryCount < MAX_RETRIES) {
        log(`Database initialization failed. Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`);
        setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
        return;
      } else {
        throw new Error("Max database initialization retries reached.");
      }
    }

    // Database initialization successful, start the application
    log("Database initialized successfully. Starting application...");
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // Setup WebSocket server for real-time updates
    const wss = new WebSocket.Server({ server });
    
    // Store active WebSocket connections
    const clients = new Set<WebSocket>();
    
    // Handle WebSocket connections
    wss.on("connection", (ws) => {
      log("WebSocket client connected");
      clients.add(ws);
      
      // Send initial data
      ws.send(JSON.stringify({ type: "connected", message: "Successfully connected to TrendDrop real-time updates" }));
      
      ws.on("close", () => {
        log("WebSocket client disconnected");
        clients.delete(ws);
      });
      
      ws.on("error", (error) => {
        log(`WebSocket error: ${error}`);
        clients.delete(ws);
      });
    });

    // Expose WebSocket clients to other modules
    (global as any).wsClients = clients;

    // Only setup vite in development and after setting up the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Start the product tracking agent after successful database initialization
    startAgentService();

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`TrendDrop application running on port ${port}`);
    });
  } catch (error) {
    log(`Error initializing application: ${error}`);
    if (retryCount < MAX_RETRIES) {
      log(`Retrying in ${RETRY_INTERVAL / 1000 / 60} minutes...`);
      setTimeout(() => initializeApp(retryCount + 1), RETRY_INTERVAL);
    } else {
      log("Max initialization retries reached. Exiting.");
      process.exit(1);
    }
  }
}

// Start the application
initializeApp();
