import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";
import type { ChainableMock, MockDrizzleDb, MockAuthReturn, ApiErrorBody, ApiDataBody } from "@/tests/helpers";
import type { Context, Next } from "hono";

type Account = { id: string; name: string };
type AccountWithUser = Account & { userId: string };

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: Context, next: Next) => await next()),
  getAuth: vi.fn(),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "cuid_test_123"),
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

import accounts from "./accounts";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as unknown as MockDrizzleDb;

describe("accounts API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const auth: MockAuthReturn = { userId: "user_1" };
    mockedGetAuth.mockReturnValue(auth as ReturnType<typeof getAuth>);
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    mockedDb.select.mockReturnValue(chainable([] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/");
    expect(res.status).toBe(401);
    const body = (await res.json()) as ApiErrorBody;
    expect(body.error).toBe("Unauthorized");
  });

  it("GET / returns accounts for authenticated user", async () => {
    const fakeData: Account[] = [{ id: "acc_1", name: "Checking" }];
    mockedDb.select.mockReturnValue(chainable(fakeData) as ChainableMock<unknown>);
    const res = await accounts.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Account[]>;
    expect(body.data).toEqual(fakeData);
  });

  it("GET /:id returns 404 when not found (empty db)", async () => {
    mockedDb.select.mockReturnValue(chainable([] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/some-id");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await accounts.request("/acc_1");
    expect(res.status).toBe(401);
  });

  it("GET /:id returns data when found", async () => {
    const fake: Account = { id: "acc_1", name: "Checking" };
    mockedDb.select.mockReturnValue(chainable([fake] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/acc_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Account>;
    expect(body.data).toEqual(fake);
  });

  it("POST / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Account" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST / validates name required", async () => {
    mockedDb.insert.mockReturnValue(chainable([{ id: "cuid_test_123", name: "New" }] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST / creates account", async () => {
    const created: AccountWithUser = { id: "cuid_test_123", name: "Savings", userId: "user_1" };
    mockedDb.insert.mockReturnValue(chainable([created] as AccountWithUser[]) as ChainableMock<unknown>);
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Savings" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<AccountWithUser>;
    expect(body.data).toEqual(created);
  });

  it("POST /bulk-delete deletes accounts", async () => {
    const deleted: Pick<Account, "id">[] = [{ id: "acc_1" }, { id: "acc_2" }];
    mockedDb.delete.mockReturnValue(chainable(deleted) as ChainableMock<unknown>);
    const res = await accounts.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["acc_1", "acc_2"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Pick<Account, "id">[]>;
    expect(body.data).toEqual(deleted);
  });

  it("POST /bulk-delete returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await accounts.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["acc_1"] }),
    });
    expect(res.status).toBe(401);
  });

  it("PATCH /:id updates account", async () => {
    const updated: Account = { id: "acc_1", name: "Updated" };
    mockedDb.update.mockReturnValue(chainable([updated] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/acc_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Account>;
    expect(body.data).toEqual(updated);
  });

  it("PATCH /:id returns 404 when not found", async () => {
    mockedDb.update.mockReturnValue(chainable([] as Account[]) as ChainableMock<unknown>);
    const res = await accounts.request("/acc_999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id deletes account", async () => {
    mockedDb.delete.mockReturnValue(chainable([{ id: "acc_1" }] as Pick<Account, "id">[]) as ChainableMock<unknown>);
    const res = await accounts.request("/acc_1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Pick<Account, "id">>;
    expect(body.data).toEqual({ id: "acc_1" });
  });

  it("DELETE /:id returns 404 when not found", async () => {
    mockedDb.delete.mockReturnValue(chainable([] as Pick<Account, "id">[]) as ChainableMock<unknown>);
    const res = await accounts.request("/acc_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await accounts.request("/acc_1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
