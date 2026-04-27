import { app, initServer } from "../server/index";

let initialized = false;

export default async function handler(req: any, res: any) {
  try {
    if (!initialized) {
      console.log("Initializing serverless function...");
      await initServer();
      initialized = true;
      console.log("Serverless function initialized successfully.");
    }
    return app(req, res);
  } catch (error: any) {
    console.error("Serverless initialization error:", error);
    res.status(500).json({ 
      message: "Serverless initialization failed", 
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined 
    });
  }
}
