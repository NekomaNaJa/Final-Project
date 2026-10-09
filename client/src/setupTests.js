import { TextEncoder, TextDecoder } from "util";
import "@testing-library/jest-dom";

Object.assign(global, { TextEncoder, TextDecoder });

// Polyfill for ResizeObserver in JSDOM (needed for recharts ResponsiveContainer)
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserver;
global.ResizeObserver = ResizeObserver;

// Polyfill for URL.createObjectURL and URL.revokeObjectURL in JSDOM
if (!window.URL.createObjectURL) {
  window.URL.createObjectURL = () => "blob:http://localhost/sample-object-url";
}
if (!window.URL.revokeObjectURL) {
  window.URL.revokeObjectURL = () => {};
}

// Polyfill for FileReader in JSDOM
if (typeof window !== "undefined") {
  class MockFileReader {
    readAsDataURL() {
      this.result = "data:image/png;base64,mock-slip-base64";
      if (this.onloadend) {
        this.onloadend();
      }
    }
  }
  window.FileReader = MockFileReader;

  if (window.HTMLMediaElement) {
    window.HTMLMediaElement.prototype.play = () => Promise.resolve();
    window.HTMLMediaElement.prototype.pause = () => {};
  }
}


