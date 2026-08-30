import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";
import type { ChainableMock, MockDrizzleDb, MockAuthReturn, ApiDataBody } from "@/tests/helpers";
import type { Context, Next } from "hono";

type Transaction = {
  id: string;
  date: Date;
  category: string | null;
  categoryId: string | null;
  payee: string;
  amount: number;
  notes: string | null;
  account: string;
  accountId: string;
};

type TransactionDetail = {
  id: string;
  date: Date;
  categoryId: string | null;
  payee: string;
  amount: number;
  notes: string | null;
  accountId: string;
};

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: Context, next: Next) => await next()),
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
  sql: vi.fn((strings: TemplateStringsArray | string): string =>
    Array.isArray(strings) ? (strings as unknown as string[]).join("?") : String(strings)
  ),
}));

import transactions from "./transactions";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as unknown as MockDrizzleDb;

describe("transactions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const auth: MockAuthReturn = { userId: "user_1" };
    mockedGetAuth.mockReturnValue(auth as ReturnType<typeof getAuth>);
    mockedDb.$with.mockReturnValue({
      as: vi.fn(() => chainable([] as unknown[]) as ChainableMock<unknown>),
    } as unknown as ReturnType<MockDrizzleDb["$with"]>);
    mockedDb.with.mockReturnValue(chainable([{ id: "txn_1" }] as Pick<Transaction, "id">[]) as ChainableMock<unknown>);
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await transactions.request("/");
    expect(res.status).toBe(401);
  });

  it("GET / returns transactions", async () => {
    const fakeTx: Transaction[] = [
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
    mockedDb.select.mockReturnValue(chainable(fakeTx) as ChainableMock<unknown>);
    const res = await transactions.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Transaction[]>;
    expect(body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: "txn_1" })]));
  });

  it("GET / supports query params", async () => {
    mockedDb.select.mockReturnValue(chainable([] as Transaction[]) as ChainableMock<unknown>);
    const res = await transactions.request("/?from=2024-01-01&to=2024-01-31&accountId=acc_1");
    expect(res.status).toBe(200);
  });

  it("GET /:id returns 404 when not found", async () => {
    mockedDb.select.mockReturnValue(chainable([] as TransactionDetail[]) as ChainableMock<unknown>);
    const res = await transactions.request("/txn_999");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns transaction when found", async () => {
    const fake: TransactionDetail = {
      id: "txn_1",
      date: new Date("2024-01-15"),
      categoryId: "cat_1",
      payee: "Store",
      amount: 5000,
      notes: null,
      accountId: "acc_1",
    };
    mockedDb.select.mockReturnValue(chainable([fake] as TransactionDetail[]) as ChainableMock<unknown>);
    const res = await transactions.request("/txn_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<TransactionDetail>;
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
    const created: TransactionDetail = {
      id: "cuid_txn_123",
      amount: 5000,
      payee: "Test Payee",
      date: new Date("2024-01-15"),
      accountId: "acc_1",
      categoryId: "cat_1",
      notes: null,
    };
    mockedDb.insert.mockReturnValue(chainable([created] as TransactionDetail[]) as ChainableMock<unknown>);
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
    const body = (await res.json()) as ApiDataBody<TransactionDetail>;
    expect(body.data).toEqual(expect.objectContaining({ payee: "Test Payee" }));
  });

  it("POST /bulk-create creates multiple transactions", async () => {
    const created: TransactionDetail[] = [
      { id: "cuid_txn_123", amount: 1000, payee: "A", date: new Date(), accountId: "acc_1", categoryId: null, notes: null },
      { id: "cuid_txn_123", amount: 2000, payee: "B", date: new Date(), accountId: "acc_1", categoryId: null, notes: null },
    ];
    mockedDb.insert.mockReturnValue(chainable(created) as ChainableMock<unknown>);
    const res = await transactions.request("/bulk-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([
        { amount: 1000, payee: "A", date: new Date().toISOString(), accountId: "acc_1" },
        { amount: 2000, payee: "B", date: new Date().toISOString(), accountId: "acc_1" },
      ]),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<TransactionDetail[]>;
    expect(body.data).toHaveLength(2);
  });

  it("POST /bulk-delete deletes transactions", async () => {
    const deleted: Pick<Transaction, "id">[] = [{ id: "txn_1" }];
    const withChain = chainable(deleted) as ChainableMock<unknown>;
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({
      as: vi.fn(() => withChain),
    } as unknown as ReturnType<MockDrizzleDb["$with"]>);

    const res = await transactions.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["txn_1"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Pick<Transaction, "id">[]>;
    expect(body.data).toEqual(deleted);
  });

  it("PATCH /:id updates transaction", async () => {
    const updated: Partial<TransactionDetail> & { id: string } = { id: "txn_1", amount: 9999, payee: "Updated" };
    const withChain = chainable([updated] as Partial<TransactionDetail>[]) as ChainableMock<unknown>;
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({
      as: vi.fn(() => withChain),
    } as unknown as ReturnType<MockDrizzleDb["$with"]>);

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
    const withChain = chainable([] as Pick<Transaction, "id">[]) as ChainableMock<unknown>;
    mockedDb.with.mockReturnValue(withChain);
    mockedDb.$with.mockReturnValue({
      as: vi.fn(() => withChain),
    } as unknown as ReturnType<MockDrizzleDb["$with"]>);
    const res = await transactions.request("/txn_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
