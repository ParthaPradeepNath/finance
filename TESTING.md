# Testing Guide

This document describes the Vitest setup, strategy, and coverage for the Finance app.

## Stack

- **Runner:** Vitest `^3.2.7` — native ESM, Vite-powered, fast HMR watch mode
- **Environment:** `jsdom` `^26.1.0` — browser-like DOM for React component testing
- **Libraries:**
  - `@testing-library/react` `^16.3.3` — component rendering + queries
  - `@testing-library/jest-dom` `^6.10.0` — DOM matchers (`toBeInTheDocument`, etc.)
  - `@testing-library/user-event` `^14.6.6` — realistic user interactions
  - `@vitejs/plugin-react` + `vite-tsconfig-paths` — JSX + `@/*` alias support
- **Package manager:** `bun` — all installs via `bun add -D`

## Quick Start

```bash
bun install

# watch mode (dev)
bun run test

# single run (CI)
bun run test:run

# with coverage (v8)
bun run test:coverage
```

Config: `vitest.config.ts:1`
Setup: `vitest.setup.ts:1`

## Config Overview

```ts
// vitest.config.ts
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules", ".next", "dist"],
    coverage: { provider: "v8", reporter: ["text","lcov","html"] }
  }
})
```

`vitest.setup.ts:1` provides:

- `@testing-library/jest-dom` matchers
- `ResizeObserver` / `IntersectionObserver` / `matchMedia` / `scrollIntoView` mocks (required by `recharts`, `react-select`, `radix-ui`, `next-themes`)
- console.error suppression for expected ErrorBoundary throws

`package.json:5` scripts:

| Script | Command | Purpose |
|---|---|---|
| `test` | `vitest` | Watch mode (default) |
| `test:run` | `vitest run` | Single CI run |
| `test:coverage` | `vitest run --coverage` | v8 coverage + HTML report |
| `test:watch` | `vitest --watch` | Explicit watch |

## Test Layout

```
├── vitest.config.ts        # Vite + Vitest + path aliases
├── vitest.setup.ts         # Global mocks & DOM setup
├── tests/helpers.ts        # chainable() — drizzle/Hono chain mock helper
├── lib/
│   ├── utils.test.ts       # 36 tests — cn, miliunits, currency, date, percent
│   ├── env.test.ts         # 9 tests — zod schema validation + build fallback
│   ├── rate-limiter.test.ts# 9 tests — Hono middleware (limits, windows, IPs)
│   └── openapi.test.ts     # 10 tests — OpenAPI 3.1 spec integrity
├── db/
│   └── schema.test.ts      # 8 tests — tables + drizzle-zod insert schemas
├── app/api/
│   ├── [[...route]]/
│   │   ├── accounts.test.ts     # 15 tests — CRUD + auth + validation
│   │   ├── categories.test.ts   # 11 tests
│   │   ├── transactions.test.ts # 11 tests (incl. bulk-create/delete, CTE)
│   │   └── summary.test.ts      # 6 tests (period calc, Other bucket)
│   └── docs/route.test.ts  # 3 tests — OpenAPI JSON endpoint
├── components/
│   ├── data-card.test.tsx      # 8 tests — formatting, colors, variants
│   ├── error-boundary.test.tsx # 7 tests — fallback, reset, getDerivedState
│   ├── amount-input.test.tsx   # 12 tests — income/expense toggle, styles
│   └── ui/button.test.tsx      # 7 tests — variants, asChild, disabled
└── hooks/
    └── use-confirm.test.tsx    # 7 tests — Promise-based dialog flow
```

**Totals (as of 2026-08-30):** 15 test files, 164 tests, ~1.2s execution.

## Strategy by Layer

### 1. Pure Units (`lib/utils.ts:1`, `lib/openapi.ts:1`, `db/schema.ts:1`)
- No mocks; deterministic assertions.
- `fillMissingDays` uses `toDateString()` comparisons to avoid TZ flakiness.
- `formatCurrency` asserts INR `₹` + `en-US` formatting; `formatPercentage` asserts Intl rounding (`12.5 → 13%`).
- OpenAPI spec tests assert serializability and presence of all `/accounts`, `/categories`, `/transactions`, `/summary`, `/docs` paths.

### 2. Middleware Unit (`lib/rate-limiter.ts:1`)
- Creates real `Hono` app + `rateLimiter` middleware and drives it via `app.request()`.
- Uses `vi.useFakeTimers()` to test window expiry (`60_000ms`).
- Covers: under-limit, 429 + `Retry-After`/`X-RateLimit-*` headers, per-IP isolation, `x-forwarded-for` (multi-IP), `x-real-ip`, `anon` fallback, and custom `keyGenerator`.

### 3. API Integration (Hono routes)
Pattern used in every `app/api/[[...route]]/*.test.ts`:

```ts
vi.mock("@hono/clerk-auth", () => ({
  clerkMiddleware: vi.fn(() => async (_c, next) => await next()),
  getAuth: vi.fn(),
}));
vi.mock("@/db/drizzle", () => ({
  db: { select: vi.fn(), insert: vi.fn(), delete: vi.fn(), update: vi.fn(), with: vi.fn(), $with: vi.fn() },
  sql: vi.fn(),
}));

import { db } from "@/db/drizzle";
import { getAuth } from "@hono/clerk-auth";
const mockedGetAuth = vi.mocked(getAuth);

beforeEach(() => mockedGetAuth.mockReturnValue({ userId: "user_1" } as any));

// Drizzle chaining: chainable(data) returns a Proxy that resolves to `data` when awaited
// Any chain like db.select(...).from(...).where(...) awaits to the mocked data
mockedDb.select.mockReturnValue(chainable(fakeData));
const res = await accounts.request("/");
```

- Tests every route for `401` (unauthed), `400` (zod validation), `404` (empty result), and `200` (success).
- Transactions tests mock CTE (`db.$with`/`db.with` + `sql`) via `chainable`.
- Summary tests mock 4 sequential `db.select` calls (`currentPeriod`, `lastPeriod`, `categories`, `activeDays`) and verify `Other` aggregation (top 3 + remainder).

`tests/helpers.ts:1` — `chainable()`:
A `Proxy` where every method (`from`, `where`, `returning`, `innerJoin`, etc.) returns itself, and `then` resolves to the supplied mock data. This makes any Drizzle/Hono chain awaitable without brittle per-method stubs.

### 4. Components (`components/*.tsx:1`, `hooks/use-confirm.tsx:1`)
- Use `@testing-library/react` + `userEvent`.
- `DataCard` mocks `CountUp` to avoid animation timing.
- `ErrorBoundary` tests `getDerivedStateFromError` static, `componentDidCatch`, and fallback UI (`label` vs generic).
- `AmountInput` tests income/expense color logic (`bg-emerald-500` vs `bg-rose-500` vs `bg-slate-400`), reverse button, and `CurrencyInput` integration.
- `useConfirm` tests Promise-based flow: `confirm()` shows dialog, `Confirm` resolves `true`, `Cancel` resolves `false`, and dialog closes.

## Coverage

Run:

```bash
bun run test:coverage
# HTML: coverage/index.html
# LCOV: coverage/lcov.info
```

Excluded in `vitest.config.ts:22`: `node_modules`, `.next`, `coverage`, `drizzle/**`, `scripts/**`, `*.config.*`, `*.d.ts`, `app/layout.tsx`.

Target for production:

- `lib/` — 100% (pure logic)
- `app/api/[[...route]]/*` — ≥90% (auth, validation, all branches)
- `components/` + `hooks/` — ≥70% (critical paths)

## CI Integration

```yaml
# .github/workflows/test.yml (example)
- run: bun install
- run: bun run test:run
- run: bun run test:coverage
```

Add `--run` in CI to disable watch. Use `--coverage` to gate PRs.

## Conventions

- **Naming:** `*.test.ts(x)` colocated with source (easier to find & maintain).
- **Mocking:** Prefer `vi.mock` + `vi.mocked` over manual `__mocks__` dirs. Use `chainable()` for Drizzle.
- **Dates:** Use `vi.useFakeTimers()` + `vi.setSystemTime()` for `formatDateRange` / `fillMissingDays` to avoid flake.
- **Auth:** Default `mockReturnValue({ userId: "user_1"})`; override per-test with `null` to test 401.
- **No real DB:** Never hit Neon in tests; all `db` calls are mocked. For future Postgres integration tests, use `pg-mem` or a Neon branch with `DATABASE_URL` test override.
- **No network:** No `fetch` to Clerk; `clerkMiddleware` is a pass-through mock.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ResizeObserver is not defined` | Already mocked in `vitest.setup.ts:4`; if adding `recharts` chart tests, ensure setup file is included |
| `Cannot access 'mockDb' before initialization` | Don't reference outer vars inside `vi.mock` factory; use `vi.mocked(db)` pattern (see `accounts.test.ts:1`) |
| `Intl` percent rounding differs | `formatPercentage` uses `Intl.NumberFormat` defaults (no decimals): `12.5 → 13%` — assert rounded value |
| `fillMissingDays` date mismatch | Dates are TZ-sensitive (`eachDayOfInterval` uses local TZ); assert via `toDateString()` or `isSameDay`, not exact `new Date(...)` equality |

## Future Improvements

- Add `msw` to mock `lib/hono.ts:1` `hc<AppType>` client for `features/*/api/*` hook tests
- Add `playwright` for E2E (sign-in → create account → create transaction → dashboard assertions)
- Add `pg-mem` integration suite for Drizzle queries against an in-memory Postgres (without mocking `db`)
- Raise coverage thresholds in `vitest.config.ts:17` (`thresholds: { lines: 80 }`)
