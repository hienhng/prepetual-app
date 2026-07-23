import "../server/polyfills.js";
import { app, initServer } from "../server/index.js";

// OCR plus quiz generation can legitimately take longer than one minute.
export const maxDuration = 300;

let initializationPromise: Promise<void> | undefined;

function ensureInitialized() {
  if (!initializationPromise) {
    console.log("Initializing serverless function...");
    initializationPromise = initServer()
      .then(() => {
        console.log("Serverless function initialized successfully.");
      })
      .catch((error) => {
        // Permit a later invocation to retry after a transient cold-start
        // failure instead of leaving this warm instance permanently broken.
        initializationPromise = undefined;
        throw error;
      });
  }

  return initializationPromise;
}

export default async function handler(req: any, res: any) {
  try {
    await ensureInitialized();
    return app(req, res);
  } catch (error: any) {
    console.error("Serverless initialization error:", error);
    if (res.headersSent) {
      return;
    }
    res.status(500).json({ 
      message: "Serverless initialization failed", 
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
    });
  }
}
