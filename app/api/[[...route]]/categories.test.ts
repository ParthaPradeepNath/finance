import { describe, it, expect, vi, beforeEach } from "vitest";
import { chainable } from "@/tests/helpers";
import type { ChainableMock, MockDrizzleDb, MockAuthReturn, ApiDataBody } from "@/tests/helpers";
import type { Context, Next } from "hono";

type Category = { id: string; name: string };
type CategoryWithUser = Category & { userId: string };

vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c: Context, next: Next) => await next()),
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
  sql: vi.fn((strings: TemplateStringsArray | string): string =>
    Array.isArray(strings) ? (strings as unknown as string[]).join("?") : String(strings)
  ),
}));

import categories from "./categories";
import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";

const mockedGetAuth = vi.mocked(getAuth);
const mockedDb = vi.mocked(db) as unknown as MockDrizzleDb;

describe("categories API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const auth: MockAuthReturn = { userId: "user_1" };
    mockedGetAuth.mockReturnValue(auth as ReturnType<typeof getAuth>);
  });

  it("GET / returns 401 when unauthenticated", async () => {
    mockedGetAuth.mockReturnValue(null as unknown as ReturnType<typeof getAuth>);
    const res = await categories.request("/");
    expect(res.status).toBe(401);
  });

  it("GET / returns categories", async () => {
    const fake: Category[] = [{ id: "cat_1", name: "Food" }];
    mockedDb.select.mockReturnValue(chainable(fake) as ChainableMock<unknown>);
    const res = await categories.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Category[]>;
    expect(body.data).toEqual(fake);
  });

  it("GET /:id returns 404 when not found", async () => {
    mockedDb.select.mockReturnValue(chainable([] as Category[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_999");
    expect(res.status).toBe(404);
  });

  it("GET /:id returns data when found", async () => {
    const fake: Category = { id: "cat_1", name: "Food" };
    mockedDb.select.mockReturnValue(chainable([fake] as Category[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_1");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Category>;
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
    const created: CategoryWithUser = { id: "cuid_cat_123", name: "Travel", userId: "user_1" };
    mockedDb.insert.mockReturnValue(chainable([created] as CategoryWithUser[]) as ChainableMock<unknown>);
    const res = await categories.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Travel" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<CategoryWithUser>;
    expect(body.data).toEqual(created);
  });

  it("POST /bulk-delete deletes categories", async () => {
    const deleted: Pick<Category, "id">[] = [{ id: "cat_1" }];
    mockedDb.delete.mockReturnValue(chainable(deleted) as ChainableMock<unknown>);
    const res = await categories.request("/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: ["cat_1"] }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Pick<Category, "id">[]>;
    expect(body.data).toEqual(deleted);
  });

  it("PATCH /:id updates category", async () => {
    const updated: Category = { id: "cat_1", name: "Updated" };
    mockedDb.update.mockReturnValue(chainable([updated] as Category[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Category>;
    expect(body.data).toEqual(updated);
  });

  it("PATCH /:id returns 404 when not found", async () => {
    mockedDb.update.mockReturnValue(chainable([] as Category[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_999", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(res.status).toBe(404);
  });

  it("DELETE /:id deletes category", async () => {
    mockedDb.delete.mockReturnValue(chainable([{ id: "cat_1" }] as Pick<Category, "id">[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_1", { method: "DELETE" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ApiDataBody<Pick<Category, "id">>;
    expect(body.data).toEqual({ id: "cat_1" });
  });

  it("DELETE /:id returns 404 when not found", async () => {
    mockedDb.delete.mockReturnValue(chainable([] as Pick<Category, "id">[]) as ChainableMock<unknown>);
    const res = await categories.request("/cat_999", { method: "DELETE" });
    expect(res.status).toBe(404);
  });
});
