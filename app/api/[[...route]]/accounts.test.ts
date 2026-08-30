import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => await next()),
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
  sql: vi.fn((strings: any) => (Array.isArray(strings) ? strings.join("?") : "")),
}));

import accounts from "./accounts";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as any;

describe("accounts API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuth.mockReturnValue({ userId: "user_1" } as any);
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    mockedDb.select.mockReturnValue(chainable([]));
    const res = await accounts.request("/");
    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.error).toBe("Unauthorized");
  });

  it("GET / returns accounts for authenticated user", async () => {
    const fakeData = [{ id: "acc_1", name: "Checking" }];
    mockedDb.select.mockReturnValue(chainable(fakeData));
    const res = await accounts.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(fakeData);
  });

  it("GET /:id returns 404 when not found (empty db)", async () => {
    mockedDb.select.mockReturnValue(chainable([]));
    const res = await accounts.request("/some-id");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await accounts.request("/acc_1");
    expect(res.status).toBe(401);
  });

  it("GET /:id returns data when found", async () => {
    const fake = { id: "acc_1", name: "Checking" };
    mockedDb.select.mockReturnValue(chainable([fake]));
    const res = await accounts.request("/acc_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(fake);
  });

  it("POST / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "New Account" }),
    });
    expect(res.status).toBe(401);
  });

  it("POST / validates name required", async () => {
    mockedDb.insert.mockReturnValue(chainable([{ id: "cuid_test_123", name: "New" }]));
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST / creates account", async () => {
    const created = { id: "cuid_test_123", name: "Savings", userId: "user_1" };
    mockedDb.insert.mockReturnValue(chainable([created]));
    const res = await accounts.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Savings" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(created);
  });

  it("POST /bulk-delete deletes accounts", async () => {
    const deleted = [{ id: "acc_1" }, { id: "acc_2" }];
    mockedDb.delete.mockReturnValue(chainable(deleted));
    const res = await accounts.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["acc_1", "acc_2"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(deleted);
  });

  it("POST /bulk-delete returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await accounts.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["acc_1"] }),
    });
    expect(res.status).toBe(401);
  });

  it("PATCH /:id updates account", async () => {
    const updated = { id: "acc_1", name: "Updated" };
    mockedDb.update.mockReturnValue(chainable([updated]));
    const res = await accounts.request("/acc_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(updated);
  });

  it("PATCH /:id returns 404 when not found", async () => {
    mockedDb.update.mockReturnValue(chainable([]));
    const res = await accounts.request("/acc_999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id deletes account", async () => {
    mockedDb.delete.mockReturnValue(chainable([{ id: "acc_1" }]));
    const res = await accounts.request("/acc_1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual({ id: "acc_1" });
  });

  it("DELETE /:id returns 404 when not found", async () => {
    mockedDb.delete.mockReturnValue(chainable([]));
    const res = await accounts.request("/acc_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await accounts.request("/acc_1", { method: "DELETE" });
    expect(res.status).toBe(401);
  });
});
