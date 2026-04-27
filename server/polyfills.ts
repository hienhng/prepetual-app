/**
 * Polyfills for PDF.js and other browser-leaning libraries 
 * to run safely in a Node.js serverless environment (Vercel).
 */

const mockClass = class {};

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

// Apply polyfills
defineGlobal('DOMMatrix', mockClass);
defineGlobal('ImageData', mockClass);
defineGlobal('Path2D', mockClass);
defineGlobal('DOMException', class DOMException extends Error {
  constructor(message: string, name: string) {
    super(message);
    this.name = name;
  }
});
defineGlobal('window', globalThis);
defineGlobal('self', globalThis);
defineGlobal('document', {
  createElement: () => ({}),
  getElementsByTagName: () => []
});

