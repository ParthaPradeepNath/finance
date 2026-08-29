import {neon} from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http';
import { env } from '@/lib/env';

// Uses validated env from `lib/env.ts:1` — dummy fallback during `next build` is handled there.
// Keeps `Dockerfile:34` and build-safe logic centralized.
function getDatabaseUrl(): string {
  const url = env.DATABASE_URL;
  if (!url || url.includes("YOUR_")) {
    return "postgres://user:pass@localhost:5432/db";
  }
  try {
    new URL(url);
    return url;
  } catch {
    return "postgres://user:pass@localhost:5432/db";
  }
}

export const sql = neon(getDatabaseUrl())
export const db = drizzle(sql);
