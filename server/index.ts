import "./polyfills.js";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

export { app, httpServer };

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

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
        let resData = JSON.stringify(capturedJsonResponse);
        if (resData.length > 200) {
          resData = resData.substring(0, 200) + " ... (truncated)";
        }
        logLine += ` :: ${resData}`;
      }

      log(logLine);
    }
  });

  next();
});

// Export a function to initialize the server, which can be awaited
export const initServer = async () => {
  await registerRoutes(httpServer, app);

  // Keep maintenance jobs out of application startup. In a serverless
  // environment this function runs on cold starts, so any database cleanup
  // here can both delay every route and make the whole API fail to initialize.
  app.use("/api", (req, res) => {
    res.status(404).json({
      message: `API route not found: ${req.method} ${req.originalUrl}`,
    });
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }

    const status = err.status || err.statusCode || 500;
    const message = status >= 500
      ? "Internal Server Error"
      : err.message || "Request failed";

    console.error(`${req.method} ${req.originalUrl} failed:`, err);
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    // On Vercel, static files are handled by Vercel's routing, not Express
    if (!process.env.VERCEL) {
      serveStatic(app);
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }
};

// Start the server if this file is run directly
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  (async () => {
    await initServer();
    const port = parseInt(process.env.PORT || "5000", 10);
    httpServer.listen(
      {
        port,
        host: "0.0.0.0",
      },
      () => {
        log(`serving on port ${port}`);
      },
    );
  })();
}
