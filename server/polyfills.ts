/**
 * Polyfills for PDF.js and other browser-leaning libraries 
 * to run safely in a Node.js serverless environment (Vercel).
 */

if (typeof global !== 'undefined') {
  // Polyfill DOMMatrix
  if (!(global as any).DOMMatrix) {
    (global as any).DOMMatrix = class DOMMatrix {
      constructor() {}
      static fromFloat32Array() { return new DOMMatrix(); }
      static fromFloat64Array() { return new DOMMatrix(); }
    };
  }

  // Polyfill ImageData
  if (!(global as any).ImageData) {
    (global as any).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  // Polyfill Path2D
  if (!(global as any).Path2D) {
    (global as any).Path2D = class Path2D {};
  }

  // Polyfill DOMException (sometimes needed by PDF.js)
  if (!(global as any).DOMException) {
    (global as any).DOMException = class DOMException extends Error {
      constructor(message: string, name: string) {
        super(message);
        this.name = name;
      }
    };
  }
}
