import { z } from "zod";

/**
 * Centralized env validation — fail fast at boot, typed access everywhere.
 * Used by `db/drizzle.ts:4`, `lib/hono.ts:5`, and `drizzle.config.ts`.
 * Allows dummy values during `next build` static generation (see `isBuild`).
 */

const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (v) => v.startsWith("postgres://") || v.startsWith("postgresql://"),
      "DATABASE_URL must start with postgres:// or postgresql://"
    ),
  CLERK_SECRET_KEY: z
    .string()
    .min(1, "CLERK_SECRET_KEY is required")
    .startsWith("sk_", "CLERK_SECRET_KEY must start with sk_"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required")
    .startsWith("pk_", "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY must start with pk_"),
  NEXT_PUBLIC_APP_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_APP_URL is required")
    .url("NEXT_PUBLIC_APP_URL must be a valid URL"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const isBuild = process.env.NEXT_PHASE === "phase-production-build";

// During `next build` we allow placeholder/dummy values so that
// `db/drizzle.ts:4` and `drizzle.config.ts` can be evaluated for static generation.
// The dummy is the same as in `Dockerfile:34` and `db/drizzle.ts:10`.
function getRawEnv() {
  if (isBuild) {
    return {
      DATABASE_URL:
        process.env.DATABASE_URL && !process.env.DATABASE_URL.includes("YOUR_")
          ? process.env.DATABASE_URL
          : "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY:
        process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY.startsWith("sk_")
          ? process.env.CLERK_SECRET_KEY
          : "sk_test_dummyForBuild000000000000000000000000000000",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_")
          ? process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          : "pk_test_dummyForBuild000000000000000000000000000000",
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NODE_ENV: process.env.NODE_ENV as never,
    };
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NODE_ENV: process.env.NODE_ENV,
  };
}

const parsed = serverSchema.safeParse(getRawEnv());

if (!parsed.success) {
  // Fail fast with actionable message — shows in `bun run build` and `bun run dev`
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  // Only throw in non-build contexts to avoid breaking static generation
  if (!isBuild) {
    throw new Error("Invalid environment variables — check .env (see .env.example)");
  }
}

// Typed, validated env — import this instead of `process.env` directly
export const env = parsed.success
  ? parsed.data
  : (getRawEnv() as z.infer<typeof serverSchema>);

// Re-export for client components that need only public vars
export const publicEnv = {
  NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
} as const;
