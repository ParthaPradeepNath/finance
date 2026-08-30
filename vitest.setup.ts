import "@testing-library/jest-dom/vitest";

// Mock ResizeObserver (required by react-select, recharts, radix)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
// @ts-ignore
global.ResizeObserver = MockResizeObserver;

// Mock matchMedia (required by next-themes, radix)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  root = null;
  rootMargin = "";
  thresholds = [];
}
// @ts-ignore
global.IntersectionObserver = MockIntersectionObserver;

// Suppress console.error for expected error boundaries in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === "string" ? args[0] : "";
    if (msg.includes("ErrorBoundary") || msg.includes("Not implemented: navigation")) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
