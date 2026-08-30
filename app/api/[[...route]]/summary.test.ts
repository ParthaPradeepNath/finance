import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => await next()),
  getAuth: vi.fn(),
}));

vi.mock("@/db/drizzle", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
    with: vi.fn(),
    $with: vi.fn(),
  },
  sql: vi.fn((strings: any) => (Array.isArray(strings) ? strings.join("?") : "")),
}));

import summary from "./summary";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as any;

describe("summary API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuth.mockReturnValue({ userId: "user_1" } as any);
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await summary.request("/");
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error).toBe("Unauthorized");
  });

  it("returns summary data for authenticated user", async () => {
    const currentPeriod = [{ income: 50000, expenses: -20000, remaining: 30000 }];
    const lastPeriod = [{ income: 40000, expenses: -10000, remaining: 30000 }];
    const categories = [
      { name: "Food", value: 15000 },
      { name: "Travel", value: 5000 },
    ];
    const activeDays: any[] = [
      { date: new Date("2024-01-15"), income: 5000, expenses: 2000 },
    ];

    mockedDb.select
      .mockReturnValueOnce(chainable(currentPeriod))
      .mockReturnValueOnce(chainable(lastPeriod))
      .mockReturnValueOnce(chainable(categories))
      .mockReturnValueOnce(chainable(activeDays));

    const res = await summary.request("/?from=2024-01-01&to=2024-01-31");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toBeDefined();
    expect(body.data.incomeAmount).toBe(50000);
    expect(body.data.expenseAmount).toBe(-20000);
    expect(body.data.remainingAmount).toBe(30000);
    expect(body.data.categories).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Food" })]));
    expect(body.data.days).toBeDefined();
  });

  it("handles empty categories (no 'Other' bucket)", async () => {
    const current = [{ income: 0, expenses: 0, remaining: 0 }];
    const last = [{ income: 0, expenses: 0, remaining: 0 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current))
      .mockReturnValueOnce(chainable(last))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.categories).toEqual([]);
  });

  it("groups categories beyond top 3 into Other", async () => {
    const current = [{ income: 10000, expenses: -5000, remaining: 5000 }];
    const last = [{ income: 8000, expenses: -4000, remaining: 4000 }];
    const manyCats = [
      { name: "A", value: 4000 },
      { name: "B", value: 3000 },
      { name: "C", value: 2000 },
      { name: "D", value: 1000 },
      { name: "E", value: 500 },
    ];
    mockedDb.select
      .mockReturnValueOnce(chainable(current))
      .mockReturnValueOnce(chainable(last))
      .mockReturnValueOnce(chainable(manyCats))
      .mockReturnValueOnce(chainable([]));

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.categories).toHaveLength(4);
    expect(body.data.categories[3]).toEqual({ name: "Other", value: 1500 });
  });

  it("supports accountId filter", async () => {
    const current = [{ income: 1000, expenses: -500, remaining: 500 }];
    const last = [{ income: 1000, expenses: -500, remaining: 500 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current))
      .mockReturnValueOnce(chainable(last))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const res = await summary.request("/?accountId=acc_123");
    expect(res.status).toBe(200);
  });

  it("calculates percentage changes correctly", async () => {
    const current = [{ income: 200, expenses: -200, remaining: 100 }];
    const last = [{ income: 100, expenses: -100, remaining: 50 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current))
      .mockReturnValueOnce(chainable(last))
      .mockReturnValueOnce(chainable([]))
      .mockReturnValueOnce(chainable([]));

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data.incomeChange).toBe(100);
  });
});
