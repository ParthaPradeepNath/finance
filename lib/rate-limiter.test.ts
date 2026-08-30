import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Hono } from "hono";
import { rateLimiter } from "@/lib/rate-limiter";

describe("rateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  function createApp(opts: { windowMs: number; max: number; keyGenerator?: (c: any) => string }) {
    const app = new Hono();
    app.use("*", rateLimiter(opts));
    app.get("/test", (c) => c.json({ ok: true }));
    app.get("/other", (c) => c.json({ ok: true }));
    return app;
  }

  it("allows requests under the limit", async () => {
    const app = createApp({ windowMs: 60_000, max: 3 });
    for (let i = 0; i < 3; i++) {
      const res = await app.request("/test", { headers: { "x-forwarded-for": "1.1.1.1" } });
      expect(res.status).toBe(200);
    }
  });

  it("blocks requests over the limit with 429", async () => {
    const app = createApp({ windowMs: 60_000, max: 2 });
    await app.request("/test", { headers: { "x-forwarded-for": "2.2.2.2" } });
    await app.request("/test", { headers: { "x-forwarded-for": "2.2.2.2" } });
    const res = await app.request("/test", { headers: { "x-forwarded-for": "2.2.2.2" } });
    expect(res.status).toBe(429);
    const body = await res.json() as any;
    expect(body.error).toMatch(/Too many requests/);
  });

  it("sets rate limit headers", async () => {
    const app = createApp({ windowMs: 60_000, max: 5 });
    const res = await app.request("/test", { headers: { "x-forwarded-for": "3.3.3.3" } });
    expect(res.headers.get("X-RateLimit-Limit")).toBe("5");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("4");
  });

  it("sets Retry-After header when rate limited", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test", { headers: { "x-forwarded-for": "4.4.4.4" } });
    const res = await app.request("/test", { headers: { "x-forwarded-for": "4.4.4.4" } });
    expect(res.headers.get("Retry-After")).toBeDefined();
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("0");
  });

  it("isolates limits per IP", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test", { headers: { "x-forwarded-for": "5.5.5.5" } });
    // Different IP should still succeed
    const res = await app.request("/test", { headers: { "x-forwarded-for": "6.6.6.6" } });
    expect(res.status).toBe(200);
  });

  it("resets after window expires", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test", { headers: { "x-forwarded-for": "7.7.7.7" } });
    let res = await app.request("/test", { headers: { "x-forwarded-for": "7.7.7.7" } });
    expect(res.status).toBe(429);

    // Advance past window
    vi.advanceTimersByTime(61_000);

    res = await app.request("/test", { headers: { "x-forwarded-for": "7.7.7.7" } });
    expect(res.status).toBe(200);
  });

  it("uses x-real-ip fallback", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test", { headers: { "x-real-ip": "8.8.8.8" } });
    const res = await app.request("/test", { headers: { "x-real-ip": "8.8.8.8" } });
    expect(res.status).toBe(429);
  });

  it("uses custom keyGenerator", async () => {
    const app = createApp({
      windowMs: 60_000,
      max: 1,
      keyGenerator: () => "global-key",
    });
    await app.request("/test", { headers: { "x-forwarded-for": "9.9.9.9" } });
    // Second request from different IP should still be limited because key is global
    const res = await app.request("/test", { headers: { "x-forwarded-for": "10.10.10.10" } });
    expect(res.status).toBe(429);
  });

  it("handles anon fallback when no IP headers", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test");
    const res = await app.request("/test");
    expect(res.status).toBe(429);
  });

  it("handles x-forwarded-for with multiple IPs (takes first)", async () => {
    const app = createApp({ windowMs: 60_000, max: 1 });
    await app.request("/test", { headers: { "x-forwarded-for": "11.11.11.11, 12.12.12.12" } });
    const blocked = await app.request("/test", { headers: { "x-forwarded-for": "11.11.11.11" } });
    expect(blocked.status).toBe(429);
    // Different first IP should not be blocked
    const ok = await app.request("/test", { headers: { "x-forwarded-for": "12.12.12.12" } });
    expect(ok.status).toBe(200);
  });
});
