import { app, initServer } from "../server/index";

let initialized = false;

export default async function handler(req: any, res: any) {
  if (!initialized) {
    await initServer();
    initialized = true;
  }
  return app(req, res);
}
