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
