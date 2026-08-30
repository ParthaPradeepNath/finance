import { vi } from "vitest";

/** Create a chainable mock that resolves to `data` when awaited.
 *  Any property access (from, where, returning, etc.) returns a function
 *  that returns the same proxy, allowing arbitrary Hono/Drizzle chaining.
 */
export function chainable(data: unknown) {
  const proxy: any = new Proxy(
    {},
    {
      get(_target, prop) {
        if (prop === "then") {
          return (onFulfilled: any, onRejected: any) =>
            Promise.resolve(data).then(onFulfilled, onRejected);
        }
        if (prop === "catch") {
          return (onRejected: any) => Promise.resolve(data).catch(onRejected);
        }
        // Symbol async iterator etc not needed
        if (typeof prop === "symbol") return undefined;
        // Return a function that returns the proxy for chaining
        return (..._args: unknown[]) => proxy;
      },
    }
  );
  return proxy;
}

/** Helper to create a mock Hono context for rate-limiter etc — not needed for route tests (use app.request) */
export const mockAuth = (userId: string | null) => userId ? { userId } : null;
