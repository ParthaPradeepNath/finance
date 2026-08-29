/**
 * OpenAPI 3.1 spec for the Finance Hono API.
 * Served at `GET /api/docs` (see `app/api/docs/route.ts:1`).
 * Portfolio-ready: documents the typed `AppType` from `app/api/[[...route]]/route.ts:11`.
 * For auto-generation consider `hono-openapi` / `@hono/zod-openapi` — this manual spec
 * keeps `features/*` hooks unchanged (no breaking `createRoute` migration).
 */

export const openApiSpec = {
  openapi: "3.1.0",
  info: {
    title: "Finance API",
    version: "1.0.0",
    description:
      "Typed Hono REST API for accounts, categories, transactions, and summary. " +
      "Auth: Clerk (`proxy.ts:6` clerkMiddleware). Client: `lib/hono.ts:1` hc<AppType>.",
  },
  servers: [{ url: "/api", description: "Base path (see route.ts:11 basePath)" }],
  components: {
    securitySchemes: {
      clerk: { type: "http", scheme: "bearer", bearerFormat: "JWT", description: "Clerk session token" },
    },
    schemas: {
      Account: {
        type: "object",
        properties: {
          id: { type: "string", example: "cuid_123" },
          name: { type: "string", example: "Checking" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "Food" },
        },
      },
      Transaction: {
        type: "object",
        properties: {
          id: { type: "string" },
          amount: { type: "integer", description: "milinuts (amount*1000)", example: 10500 },
          payee: { type: "string" },
          notes: { type: "string", nullable: true },
          date: { type: "string", format: "date-time" },
          accountId: { type: "string" },
          categoryId: { type: "string", nullable: true },
          account: { type: "string" },
          category: { type: "string", nullable: true },
        },
      },
      Summary: {
        type: "object",
        properties: {
          remainingAmount: { type: "number" },
          remainingChange: { type: "number" },
          incomeAmount: { type: "number" },
          incomeChange: { type: "number" },
          expenseAmount: { type: "number" },
          expenseChange: { type: "number" },
          categories: {
            type: "array",
            items: {
              type: "object",
              properties: { name: { type: "string" }, value: { type: "number" } },
            },
          },
          days: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date-time" },
                income: { type: "number" },
                expenses: { type: "number" },
              },
            },
          },
        },
      },
      Error: { type: "object", properties: { error: { type: "string" } } },
    },
  },
  security: [{ clerk: [] }],
  paths: {
    "/accounts": {
      get: { summary: "List accounts", responses: { "200": { description: "OK" } } },
      post: { summary: "Create account", requestBody: { content: { "application/json": { schema: { type: "object", properties: { name: { type: "string" } } } } } } },
    },
    "/accounts/{id}": {
      get: { summary: "Get account" },
      patch: { summary: "Update account" },
      delete: { summary: "Delete account" },
    },
    "/accounts/bulk-delete": { post: { summary: "Bulk delete accounts" } },
    "/categories": {
      get: { summary: "List categories" },
      post: { summary: "Create category" },
    },
    "/categories/{id}": {
      get: { summary: "Get category" },
      patch: { summary: "Update category" },
      delete: { summary: "Delete category" },
    },
    "/categories/bulk-delete": { post: { summary: "Bulk delete categories" } },
    "/transactions": {
      get: {
        summary: "List transactions",
        parameters: [
          { name: "from", in: "query", schema: { type: "string", example: "2024-01-01" } },
          { name: "to", in: "query", schema: { type: "string" } },
          { name: "accountId", in: "query", schema: { type: "string" } },
        ],
      },
      post: { summary: "Create transaction" },
    },
    "/transactions/{id}": {
      get: { summary: "Get transaction" },
      patch: { summary: "Update transaction" },
      delete: { summary: "Delete transaction" },
    },
    "/transactions/bulk-create": { post: { summary: "Bulk create (CSV import)" } },
    "/transactions/bulk-delete": { post: { summary: "Bulk delete transactions" } },
    "/summary": {
      get: {
        summary: "Dashboard summary",
        parameters: [
          { name: "from", in: "query", schema: { type: "string" } },
          { name: "to", in: "query", schema: { type: "string" } },
          { name: "accountId", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Summary with charts data" } },
      },
    },
    "/docs": { get: { summary: "This OpenAPI spec (JSON)", responses: { "200": { description: "OpenAPI 3.1 JSON" } } } },
  },
} as const;
