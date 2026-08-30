import { describe, it, expect } from "vitest";
import { openApiSpec } from "@/lib/openapi";

describe("openApiSpec", () => {
  it("has correct OpenAPI version", () => {
    expect(openApiSpec.openapi).toBe("3.1.0");
  });

  it("has required info fields", () => {
    expect(openApiSpec.info.title).toBe("Finance API");
    expect(openApiSpec.info.version).toBe("1.0.0");
    expect(openApiSpec.info.description).toContain("Hono");
  });

  it("has servers configured", () => {
    expect(openApiSpec.servers).toHaveLength(1);
    expect(openApiSpec.servers[0].url).toBe("/api");
  });

  it("defines security scheme for clerk", () => {
    expect(openApiSpec.components.securitySchemes.clerk).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
      description: expect.any(String),
    });
  });

  it("defines core schemas", () => {
    const schemas = openApiSpec.components.schemas;
    expect(schemas.Account).toBeDefined();
    expect(schemas.Category).toBeDefined();
    expect(schemas.Transaction).toBeDefined();
    expect(schemas.Summary).toBeDefined();
    expect(schemas.Error).toBeDefined();
  });

  it("defines Transaction schema with miliunits amount", () => {
    const tx = openApiSpec.components.schemas.Transaction as any;
    expect(tx.properties.amount.description).toContain("milinuts");
    expect(tx.properties.amount.type).toBe("integer");
  });

  it("defines all expected paths", () => {
    const paths = openApiSpec.paths;
    expect(paths["/accounts"]).toBeDefined();
    expect(paths["/accounts/{id}"]).toBeDefined();
    expect(paths["/accounts/bulk-delete"]).toBeDefined();
    expect(paths["/categories"]).toBeDefined();
    expect(paths["/categories/{id}"]).toBeDefined();
    expect(paths["/categories/bulk-delete"]).toBeDefined();
    expect(paths["/transactions"]).toBeDefined();
    expect(paths["/transactions/{id}"]).toBeDefined();
    expect(paths["/transactions/bulk-create"]).toBeDefined();
    expect(paths["/transactions/bulk-delete"]).toBeDefined();
    expect(paths["/summary"]).toBeDefined();
    expect(paths["/docs"]).toBeDefined();
  });

  it("defines transactions query params", () => {
    const getTransactions = (openApiSpec.paths["/transactions"] as any).get;
    expect(getTransactions.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "from" }),
        expect.objectContaining({ name: "to" }),
        expect.objectContaining({ name: "accountId" }),
      ])
    );
  });

  it("has security requirement at top level", () => {
    expect(openApiSpec.security).toEqual([{ clerk: [] }]);
  });

  it("has valid JSON-serializable structure", () => {
    expect(() => JSON.stringify(openApiSpec)).not.toThrow();
    const parsed = JSON.parse(JSON.stringify(openApiSpec));
    expect(parsed.openapi).toBe("3.1.0");
  });
});
