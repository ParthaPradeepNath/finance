import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => await next()),
  getAuth: vi.fn(),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "cuid_txn_123"),
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

import transactions from "./transactions";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as any;

describe("transactions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuth.mockReturnValue({ userId: "user_1" } as any);
    mockedDb.$with.mockReturnValue({ as: vi.fn(() => chainable([])) } as any);
    mockedDb.with.mockReturnValue(chainable([{ id: "txn_1" }]));
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await transactions.request("/");
    expect(res.status).toBe(401);
  });

  it("GET / returns transactions", async () => {
    const fakeTx = [
      {
        id: "txn_1",
        date: new Date("2024-01-15"),
        category: "Food",
        categoryId: "cat_1",
        payee: "Store",
        amount: 10500,
        notes: null,
        account: "Checking",
        accountId: "acc_1",
      },
    ];
    mockedDb.select.mockReturnValue(chainable(fakeTx));
    const res = await transactions.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: "txn_1" })]));
  });

  it("GET / supports query params", async () => {
    mockedDb.select.mockReturnValue(chainable([]));
    const res = await transactions.request("/?from=2024-01-01&to=2024-01-31&accountId=acc_1");
    expect(res.status).toBe(200);
  });

  it("GET /:id returns 404 when not found", async () => {
    mockedDb.select.mockReturnValue(chainable([]));
    const res = await transactions.request("/txn_999");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns transaction when found", async () => {
    const fake = {
      id: "txn_1",
      date: new Date("2024-01-15"),
      categoryId: "cat_1",
      payee: "Store",
      amount: 5000,
      notes: null,
      accountId: "acc_1",
    };
    mockedDb.select.mockReturnValue(chainable([fake]));
    const res = await transactions.request("/txn_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(expect.objectContaining({ id: "txn_1" }));
  });

  it("POST / validates required fields", async () => {
    const res = await transactions.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST / creates transaction", async () => {
    const created = {
      id: "cuid_txn_123",
      amount: 5000,
      payee: "Test Payee",
      date: new Date("2024-01-15"),
      accountId: "acc_1",
      categoryId: "cat_1",
    };
    mockedDb.insert.mockReturnValue(chainable([created]));
    const res = await transactions.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 5000,
        payee: "Test Payee",
        date: new Date("2024-01-15").toISOString(),
        accountId: "acc_1",
        categoryId: "cat_1",
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(expect.objectContaining({ payee: "Test Payee" }));
  });

  it("POST /bulk-create creates multiple transactions", async () => {
    const created = [
      { id: "cuid_txn_123", amount: 1000, payee: "A", date: new Date(), accountId: "acc_1" },
      { id: "cuid_txn_123", amount: 2000, payee: "B", date: new Date(), accountId: "acc_1" },
    ];
    mockedDb.insert.mockReturnValue(chainable(created));
    const res = await transactions.request("/bulk-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { amount: 1000, payee: "A", date: new Date().toISOString(), accountId: "acc_1" },
        { amount: 2000, payee: "B", date: new Date().toISOString(), accountId: "acc_1" },
      ]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toHaveLength(2);
  });

  it("POST /bulk-delete deletes transactions", async () => {
    const deleted = [{ id: "txn_1" }];
    const withChain = chainable(deleted);
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({ as: vi.fn(() => withChain) } as any);

    const res = await transactions.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["txn_1"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(deleted);
  });

  it("PATCH /:id updates transaction", async () => {
    const updated = { id: "txn_1", amount: 9999, payee: "Updated" };
    const withChain = chainable([updated]);
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({ as: vi.fn(() => withChain) } as any);

    const res = await transactions.request("/txn_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: 9999,
        payee: "Updated",
        date: new Date().toISOString(),
        accountId: "acc_1",
      }),
    });
    expect(res.status).toBe(200);
  });

  it("DELETE /:id returns 404 when not found", async () => {
    const withChain = chainable([]);
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({ as: vi.fn(() => withChain) } as any);
    const res = await transactions.request("/txn_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
