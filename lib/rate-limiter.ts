import type { Context, Next } from "hono";

/**
 * Minimal in-memory rate limiter for Hono — no extra deps.
 * Use in `app/api/[[...route]]/route.ts:11` as `app.use('*', rateLimiter(...))`.
 * For prod multi-instance, swap with Redis (Upstash) — same interface.
 */

type Options = {
  windowMs: number;
  max: number;
  keyGenerator?: (c: Context) => string;
};

const store = new Map<string, { count: number; resetAt: number }>();

// Clean expired entries every 5 min (prevents unbounded memory in dev)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store.entries()) if (v.resetAt < now) store.delete(k);
  }, 5 * 60 * 1000).unref?.();
}

export const rateLimiter = (opts: Options) => {
  const { windowMs, max, keyGenerator } = opts;
  return async (c: Context, next: Next) => {
    // Skip for static generation / build (no `x-forwarded-for`)
    const key = keyGenerator
      ? keyGenerator(c)
      : (c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ||
          c.req.header("x-real-ip") ||
          "anon");

    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count += 1;
      if (entry.count > max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        c.header("Retry-After", String(retryAfter));
        c.header("X-RateLimit-Limit", String(max));
        c.header("X-RateLimit-Remaining", "0");
        c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
        return c.json({ error: "Too many requests. Please try again later." }, 429);
      }
    }

    const cur = store.get(key)!;
    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - cur.count)));
    await next();
  };
};

// Common presets — import in route.ts
export const apiRateLimit = rateLimiter({ windowMs: 60_000, max: 60 }); // 60 req/min per IP
export const writeRateLimit = rateLimiter({ windowMs: 60_000, max: 20 }); // 20 writes/min
