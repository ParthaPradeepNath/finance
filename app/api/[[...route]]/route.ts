import { Hono } from "hono";
import { handle } from "hono/vercel";
import { logger } from "hono/logger";

import accounts from "./accounts";
import categories from "./categories";
import transactions from "./transactions";
import summary from "./summary";
import { apiRateLimit } from "@/lib/rate-limiter";

export const runtime = "edge";

const app = new Hono().basePath("/api");

// Senior habits: global middleware — request logging + rate limiting + error envelope
// Existing per-route `zValidator` in `summary.ts:14`, `accounts.ts`, etc. stays as-is (no breaking change)
app.use("*", logger());
app.use("/summary/*", apiRateLimit);
app.use("/accounts/*", apiRateLimit);
app.use("/categories/*", apiRateLimit);
app.use("/transactions/*", apiRateLimit);

app.onError((err, c) => {
  console.error(`[API] ${c.req.method} ${c.req.path}:`, err);
  return c.json({ error: "Internal Server Error" }, 500);
});

const routes = app
  .route("/summary", summary)
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/transactions", transactions);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
