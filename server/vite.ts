import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

// Import the LogService (using dynamic import to avoid circular dependencies)
let logService: any = null;
// We'll initialize the logService later after it's been created

// At the top of server/vite.ts
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
  
  // Add to logService if it's initialized
  if (logService) {
    logService.addLog(source, message);
  }
}

// Function to set the log service after it's been initialized
export function setLogService(service: any): void {
  logService = service;
  log('LogService connected to central logger', 'vite');
}

// Set up Vite in development mode
export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          process.exit(1);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    app.use(vite.middlewares);
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk in case it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
    
    log("Vite development server setup complete", "vite");
  } catch (error) {
    log(`Error setting up Vite: ${error}`, "vite");
    throw error;
  }
}

// Serve static files in production
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public");

  if (!fs.existsSync(distPath)) {
    log(`Could not find the build directory: ${distPath}`, "vite");
    log("Creating a minimal index.html for development", "vite");
    
    // Create a minimal index.html
    app.use("*", (_req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>TrendDrop - Product Research Tool</title>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          </head>
          <body>
            <div id="root">
              <h1>TrendDrop - Development Mode</h1>
              <p>Frontend assets have not been built yet. Run 'npm run build' to create the production build.</p>
            </div>
          </body>
        </html>
      `);
    });
    return;
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
  
  log("Static file serving setup complete", "vite");
}
