import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { appRouter } from "./router";
import { createContext } from "./trpc";
import { migrateAdminUsersTable } from "./migrate";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Run migration on startup
console.log("[Server] Running database migration...");
await migrateAdminUsersTable();

const app = express();
const server = createServer(app);

// Body parser and cookie parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(cookieParser());

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "admin-portal",
  });
});

// tRPC API
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.join(process.cwd(), "dist", "public");
  
  console.log("[Static] Looking for static files at:", distPath);
  console.log("[Static] Directory exists:", fs.existsSync(distPath));
  
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    console.log("[Static] Files in dist/public:", files);
    
    app.use(express.static(distPath, {
      setHeaders: (res, filepath) => {
        if (filepath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        } else if (filepath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
      }
    }));
    
    app.use("*", (req, res) => {
      const ext = path.extname(req.originalUrl);
      if (ext && ext !== '.html') {
        console.log("[Static] 404 for asset:", req.originalUrl);
        return res.status(404).send('Not found');
      }
      console.log("[Static] Serving index.html for:", req.originalUrl);
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    console.error("[Server] Build directory not found:", distPath);
    app.use("*", (_req, res) => {
      res.status(500).send(`Build directory not found: ${distPath}`);
    });
  }
}

// Start server
const PORT = parseInt(process.env.PORT || "3001");
const HOST = process.env.HOST || "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`[Admin Portal] Server running on http://${HOST}:${PORT}`);
  console.log(`[Admin Portal] Environment: ${process.env.NODE_ENV}`);
  console.log(`[Admin Portal] API: http://${HOST}:${PORT}/api/trpc`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Admin Portal] SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("[Admin Portal] Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("[Admin Portal] SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("[Admin Portal] Server closed");
    process.exit(0);
  });
});
