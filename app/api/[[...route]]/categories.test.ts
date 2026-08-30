import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: any, next: any) => await next()),
  getAuth: vi.fn(),
}));

vi.mock("@paralleldrive/cuid2", () => ({
  createId: vi.fn(() => "cuid_cat_123"),
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

import categories from "./categories";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as any;

describe("categories API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetAuth.mockReturnValue({ userId: "user_1" } as any);
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as any);
    const res = await categories.request("/");
    expect(res.status).toBe(401);
  });

  it("GET / returns categories", async () => {
    const fake = [{ id: "cat_1", name: "Food" }];
    mockedDb.select.mockReturnValue(chainable(fake));
    const res = await categories.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(fake);
  });

  it("GET /:id returns 404 when not found", async () => {
    mockedDb.select.mockReturnValue(chainable([]));
    const res = await categories.request("/cat_999");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns data when found", async () => {
    const fake = { id: "cat_1", name: "Food" };
    mockedDb.select.mockReturnValue(chainable([fake]));
    const res = await categories.request("/cat_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(fake);
  });

  it("POST / validates name required", async () => {
    const res = await categories.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("POST / creates category", async () => {
    const created = { id: "cuid_cat_123", name: "Travel", userId: "user_1" };
    mockedDb.insert.mockReturnValue(chainable([created]));
    const res = await categories.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Travel" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(created);
  });

  it("POST /bulk-delete deletes categories", async () => {
    const deleted = [{ id: "cat_1" }];
    mockedDb.delete.mockReturnValue(chainable(deleted));
    const res = await categories.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["cat_1"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual(deleted);
  });

  it("PATCH /:id updates category", async () => {
    const updated = { id: "cat_1", name: "Updated" };
    mockedDb.update.mockReturnValue(chainable([updated]));
    const res = await categories.request("/cat_1", {
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
    const res = await categories.request("/cat_999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id deletes category", async () => {
    mockedDb.delete.mockReturnValue(chainable([{ id: "cat_1" }]));
    const res = await categories.request("/cat_1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.data).toEqual({ id: "cat_1" });
  });

  it("DELETE /:id returns 404 when not found", async () => {
    mockedDb.delete.mockReturnValue(chainable([]));
    const res = await categories.request("/cat_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
