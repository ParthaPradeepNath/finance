import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/docs/route";
import type { openApiSpec } from "@/lib/openapi";

type OpenApiSpec = typeof openApiSpec;

describe("GET /api/docs", () => {
  it("returns OpenAPI spec with 200", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as OpenApiSpec;
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("Finance API");
    expect(body.paths).toBeDefined();
  });

  it("sets OpenAPI content type and cache headers", async () => {
    const res = await GET();
    expect(res.headers.get("Content-Type")).toContain("application/openapi+json");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });

  it("contains expected routes", async () => {
    const res = await GET();
    const body = (await res.json()) as OpenApiSpec;
    expect(body.paths["/summary"]).toBeDefined();
    expect(body.paths["/accounts"]).toBeDefined();
    expect(body.paths["/transactions"]).toBeDefined();
  });
});
