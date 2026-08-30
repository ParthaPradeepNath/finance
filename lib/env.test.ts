import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// Replicate serverSchema for unit testing
const serverSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .refine((v) => v.startsWith("postgres://") || v.startsWith("postgresql://"), "must start with postgres://"),
  CLERK_SECRET_KEY: z.string().min(1).startsWith("sk_"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).startsWith("pk_"),
  NEXT_PUBLIC_APP_URL: z.string().min(1).url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

describe("env validation", () => {
  it("validates correct env", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NODE_ENV: "test",
    });
    expect(result.success).toBe(true);
  });

  it("accepts postgresql:// prefix", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgresql://user:pass@host/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid DATABASE_URL", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "mysql://user:pass@localhost/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects CLERK_SECRET_KEY without sk_ prefix", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "pk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY without pk_ prefix", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "sk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid NEXT_PUBLIC_APP_URL", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "not-a-url",
    });
    expect(result.success).toBe(false);
  });

  it("defaults NODE_ENV to development", () => {
    const result = serverSchema.safeParse({
      DATABASE_URL: "postgres://user:pass@localhost:5432/db",
      CLERK_SECRET_KEY: "sk_test_123",
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.NODE_ENV).toBe("development");
  });

  it("accepts test and production NODE_ENV", () => {
    for (const env of ["test", "production"] as const) {
      const result = serverSchema.safeParse({
        DATABASE_URL: "postgres://user:pass@localhost:5432/db",
        CLERK_SECRET_KEY: "sk_test_123",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_123",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NODE_ENV: env,
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects missing required fields", () => {
    const result = serverSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.DATABASE_URL).toBeDefined();
      expect(result.error.flatten().fieldErrors.CLERK_SECRET_KEY).toBeDefined();
    }
  });
});

describe("lib/env - getRawEnv build fallback", () => {
  it("imports without throwing when env is set", async () => {
    // Set valid env for this test — dotenv may not have loaded .env in vitest (node env)
    process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/db";
    process.env.CLERK_SECRET_KEY = "sk_test_dummyForBuild000000000000000000000000000000";
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_dummyForBuild000000000000000000000000000000";
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
    // Need to re-import fresh module after setting env
    vi.resetModules();
    const mod = await import("@/lib/env");
    expect(mod.env).toBeDefined();
    expect(mod.publicEnv).toBeDefined();
    expect(mod.publicEnv.NEXT_PUBLIC_APP_URL).toBeDefined();
  });
});
