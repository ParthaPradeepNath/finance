import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";
import type { ChainableMock, MockDrizzleDb, MockAuthReturn, ApiErrorBody, ApiDataBody } from "@/tests/helpers";
import type { Context, Next } from "hono";

type FinancialPeriod = { income: number; expenses: number; remaining: number };
type CategorySummary = { name: string; value: number };
type ActiveDay = { date: Date; income: number; expenses: number };
type SummaryData = {
  remainingAmount: number;
  remainingChange: number;
  incomeAmount: number;
  incomeChange: number;
  expenseAmount: number;
  expenseChange: number;
  categories: CategorySummary[];
  days: ActiveDay[];
};

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: Context, next: Next) => await next()),
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
  sql: vi.fn((strings: TemplateStringsArray | string): string =>
    Array.isArray(strings) ? (strings as unknown as string[]).join("?") : String(strings)
  ),
}));

import summary from "./summary";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as unknown as MockDrizzleDb;

describe("summary API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const auth: MockAuthReturn = { userId: "user_1" };
    mockedGetAuth.mockReturnValue(auth as ReturnType<typeof getAuth>);
  });

  it("returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await summary.request("/");
    expect(res.status).toBe(401);
    const body = (await res.json()) as ApiErrorBody;
    expect(body.error).toBe("Unauthorized");
  });

  it("returns summary data for authenticated user", async () => {
    const currentPeriod: FinancialPeriod[] = [{ income: 50000, expenses: -20000, remaining: 30000 }];
    const lastPeriod: FinancialPeriod[] = [{ income: 40000, expenses: -10000, remaining: 30000 }];
    const categories: CategorySummary[] = [
      { name: "Food", value: 15000 },
      { name: "Travel", value: 5000 },
    ];
    const activeDays: ActiveDay[] = [
      { date: new Date("2024-01-15"), income: 5000, expenses: 2000 },
    ];

    mockedDb.select
      .mockReturnValueOnce(chainable(currentPeriod) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(lastPeriod) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(categories) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(activeDays) as ChainableMock<unknown>);

    const res = await summary.request("/?from=2024-01-01&to=2024-01-31");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<SummaryData>;
    expect(body.data).toBeDefined();
    expect(body.data.incomeAmount).toBe(50000);
    expect(body.data.expenseAmount).toBe(-20000);
    expect(body.data.remainingAmount).toBe(30000);
    expect(body.data.categories).toEqual(expect.arrayContaining([expect.objectContaining({ name: "Food" })]));
    expect(body.data.days).toBeDefined();
  });

  it("handles empty categories (no 'Other' bucket)", async () => {
    const current: FinancialPeriod[] = [{ income: 0, expenses: 0, remaining: 0 }];
    const last: FinancialPeriod[] = [{ income: 0, expenses: 0, remaining: 0 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(last) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as CategorySummary[]) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as ActiveDay[]) as ChainableMock<unknown>);

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<SummaryData>;
    expect(body.data.categories).toEqual([]);
  });

  it("groups categories beyond top 3 into Other", async () => {
    const current: FinancialPeriod[] = [{ income: 10000, expenses: -5000, remaining: 5000 }];
    const last: FinancialPeriod[] = [{ income: 8000, expenses: -4000, remaining: 4000 }];
    const manyCats: CategorySummary[] = [
      { name: "A", value: 4000 },
      { name: "B", value: 3000 },
      { name: "C", value: 2000 },
      { name: "D", value: 1000 },
      { name: "E", value: 500 },
    ];
    mockedDb.select
      .mockReturnValueOnce(chainable(current) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(last) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(manyCats) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as ActiveDay[]) as ChainableMock<unknown>);

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<SummaryData>;
    expect(body.data.categories).toHaveLength(4);
    expect(body.data.categories[3]).toEqual({ name: "Other", value: 1500 });
  });

  it("supports accountId filter", async () => {
    const current: FinancialPeriod[] = [{ income: 1000, expenses: -500, remaining: 500 }];
    const last: FinancialPeriod[] = [{ income: 1000, expenses: -500, remaining: 500 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(last) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as CategorySummary[]) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as ActiveDay[]) as ChainableMock<unknown>);

    const res = await summary.request("/?accountId=acc_123");
    expect(res.status).toBe(200);
  });

  it("calculates percentage changes correctly", async () => {
    const current: FinancialPeriod[] = [{ income: 200, expenses: -200, remaining: 100 }];
    const last: FinancialPeriod[] = [{ income: 100, expenses: -100, remaining: 50 }];
    mockedDb.select
      .mockReturnValueOnce(chainable(current) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable(last) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as CategorySummary[]) as ChainableMock<unknown>)
      .mockReturnValueOnce(chainable([] as ActiveDay[]) as ChainableMock<unknown>);

    const res = await summary.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<SummaryData>;
    expect(body.data.incomeChange).toBe(100);
  });
});
