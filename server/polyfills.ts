/**
 * Polyfills for PDF.js and other browser-leaning libraries 
 * to run safely in a Node.js serverless environment (Vercel).
 */

import { createRequire } from "module";

const mockClass = class {};

class MockPath2D {
  addPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  quadraticCurveTo() {}
  rect() {}
  arc() {}
  arcTo() {}
  ellipse() {}
}

// Helper to define global properties safely
function defineGlobal(name: string, value: any) {
  if (typeof globalThis !== 'undefined' && !(globalThis as any)[name]) {
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
      enumerable: false
    });
  }
}

function forceGlobal(name: string, value: any) {
  if (typeof globalThis === "undefined") return;
  try {
    Object.defineProperty(globalThis, name, {
      value,
      writable: true,
      configurable: true,
      enumerable: false,
    });
  } catch {
    try { (globalThis as any)[name] = value; } catch {}
  }
}

defineGlobal('DOMMatrix', mockClass);
defineGlobal('ImageData', mockClass);
// Do NOT eagerly define Path2D to a mock if native canvas is available,
// because PDF.js will create Path2D instances that must be compatible with
// the canvas implementation.
defineGlobal('DOMException', class DOMException extends Error {
  constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
});

// Prefer real canvas primitives when available (required for PDF.js rendering)
try {
  const require = createRequire(import.meta.url);
  const canvasMod: any = require("@napi-rs/canvas");
  if (canvasMod?.Path2D) forceGlobal("Path2D", canvasMod.Path2D);
  if (canvasMod?.ImageData) forceGlobal("ImageData", canvasMod.ImageData);
  if (canvasMod?.DOMMatrix) forceGlobal("DOMMatrix", canvasMod.DOMMatrix);
} catch {
  // Keep light mocks for environments where native canvas isn't available.
  defineGlobal("Path2D", MockPath2D);
}
