# Upcoming Features — Finance

> Current baseline: `README.md:7-12` — Clerk auth, Hono CRUD for `accounts` / `categories` / `transactions` (`db/schema.ts:6-46`, `app/api/[[...route]]/route.ts:14-17`), dashboard summary (`app/api/[[...route]]/summary.ts:42-171`), TanStack Table + CSV import. Placeholders `plaid_id` in `db/schema.ts:8,21` not yet wired.

---

## Roadmap Overview

| # | Feature | Category | Priority | Effort | Dependencies |
|---|---------|----------|----------|--------|--------------|
| 1 | Budgets & Spending Limits | Core Finance | P0 | M | `categories`, `summary.ts` |
| 2 | Recurring Transactions / Subscriptions | Core Finance | P0 | M | `transactions` cron |
| 3 | Transfers Between Accounts | Core Finance | P0 | S | `transactions` dual-entry |
| 4 | Split Transactions | Core Finance | P1 | M | `transactions` |
| 5 | Savings Goals | Core Finance | P1 | M | `accounts` |
| 6 | Plaid Bank Sync | Core Finance | P1 | L | `plaid_id` fields |
| 7 | Receipts & Attachments (OCR) | Core Finance | P1 | M | `transactions` |
| 8 | Net Worth Over Time | Analytics | P1 | M | `accounts` snapshots |
| 9 | Cashflow Forecast | Analytics | P2 | S | `lib/utils.ts:fillMissingDays` |
| 10 | Spending Insights / Anomaly Detection | Analytics | P2 | L | `payee` embeddings |
| 11 | Advanced Search & Filters | Analytics | P1 | S | `components/filters.tsx` |
| 12 | Export & Reports (CSV/PDF) | Analytics | P1 | S | `components/data-table.tsx` |
| 13 | Duplicate Detection (CSV) | UX | P0 | S | CSV import flow |
| 14 | Notifications & Alerts | UX | P1 | M | Clerk webhooks, `sonner` |
| 15 | Multi-Currency Support | UX | P2 | L | `accounts.currency` |
| 16 | Tags & Enhanced Notes | UX | P2 | S | `transactions` |
| 17 | Command Palette + Keyboard Shortcuts | UX | P2 | S | Global layout |
| 18 | PWA / Mobile Offline | UX | P2 | M | TanStack Query cache |
| 19 | Household / Shared Budgets (Clerk Orgs) | Platform | P2 | L | `clerk-orgs` |
| 20 | Audit Log & Versioning | Platform | P2 | M | `use-edit-transaction.ts` |
| 21 | Tax Categories & Year-End Summary | Platform | P3 | M | `categories` mapping |
| 22 | Investments Tracking | Platform | P3 | L | New `holdings` table |

*Effort: S <1d, M 1-3d, L 1-2w. Priority: P0 ship next, P1 next quarter, P2 backlog, P3 explore.*

---

## Phase 1 — Quick Wins (1-2 weeks)

### 1. Budgets & Spending Limits
**Why:** Natural complement to `summary.ts:97-131` category aggregation.
**DB:**
```ts
// db/schema.ts
export const budgets = pgTable("budgets", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "cascade" }).notNull(),
  amount: integer("amount").notNull(), // milinuts
  month: text("month").notNull(), // YYYY-MM
});
```
**API:** `app/api/[[...route]]/budgets.ts` — CRUD + `GET /summary` extend with `budget vs actual`.
**UI:** Progress bar in `components/data-grid.tsx` / `components/spending-pie.tsx`, alert toast at 80%/100%.

### 2. Transfers Between Accounts
**DB:** Add `transactions.type: 'income'|'expense'|'transfer'` + `transferId` linking pair.
**Logic:** Exclude internal transfers from `summary.ts:49-57` income/expense `SUM(CASE...)`.
**UI:** Toggle in `features/transactions/components/transaction-form.tsx` with `fromAccount -> toAccount`.

### 3. Duplicate Detection (CSV)
Hash `payee+amount+date` on `features/transactions/api/use-bulk-create-transactions.ts` import preview. Flag duplicates for skip/review in `components/data-table.tsx`.

---

## Phase 2 — Core Expansion (2-4 weeks)

### 4. Recurring Transactions / Subscriptions
**DB:** `transactions.isRecurring`, `frequency: 'weekly'|'monthly'|'yearly'`, `nextDate`.
**Backend:** Vercel cron `/api/cron/recurring` daily — clone due transactions.
**UI:** Badge in transactions table, detection heuristic on `payee` (e.g., Netflix monthly).

### 5. Split Transactions
**DB:**
```ts
export const transactionSplits = pgTable("transaction_splits", {
  id: text("id").primaryKey(),
  transactionId: text("transaction_id").references(() => transactions.id, { onDelete: "cascade" }).notNull(),
  categoryId: text("category_id").references(() => categories.id),
  amount: integer("amount").notNull(),
  memo: text("memo"),
});
```
**UI:** Split button in `features/transactions/components/edit-transaction-sheet.tsx` — validate splits sum to `amount`.

### 6. Savings Goals
**DB:** `goals (id, userId, name, targetAmount, currentAmount, deadline, accountId)`.
**UI:** Dedicated `/goals` page, auto-allocate from tagged transactions.

### 7. Plaid Bank Sync
Leverage existing `db/schema.ts:8,21` `plaid_id`.
**Flow:** Plaid Link → `POST /api/plaid/exchange` → store `plaid_id` → webhook `transactions/sync` → bulk insert via `use-bulk-create-transactions.ts`.
**UI:** `Connect Bank` in `components/header.tsx`.

### 8. Receipts & Attachments (OCR)
**DB:** `transaction_attachments (id, transactionId, url, ocrText)`.
**Stack:** UploadThing / S3 + AI OCR (parse amount/date).
**UI:** Dropzone in transaction form, thumbnail in table row.

---

## Phase 3 — Analytics & Insights (3-6 weeks)

### 9. Net Worth Over Time
**DB:** `accountSnapshots (accountId, date, balance)` daily snapshot job.
**API:** `GET /api/summary/net-worth?from&to` aggregate.
**UI:** New `components/area-variant.tsx` chart in `app/(dashboard)/page.tsx`.

### 10. Cashflow Forecast
Extend `lib/utils.ts:fillMissingDays` + `summary.ts:132-157` `days` with linear regression. Render dashed projection in `components/chart.tsx`.

### 11. Spending Insights / Anomaly Detection
Auto-categorize `payee` via embeddings, flag outlier `amount` vs 90-day avg (`±2σ`). Surface in `components/data-charts.tsx` as insight cards.

### 12. Advanced Search & Filters
Full-text on `payee`, `notes`, amount range, multi-category, date presets (YTD, Last Quarter, Custom) in `components/filters.tsx`, `components/date-filter.tsx`, `components/account-filter.tsx`.

### 13. Export & Reports
CSV/PDF export of filtered `components/data-table.tsx` view. Monthly PDF statement from `app/api/[[...route]]/summary.ts` data.

---

## Phase 4 — UX Polish & Platform (ongoing)

### 14. Notifications & Alerts
Budget exceeded, low balance, upcoming bill. Via `sonner` (`package.json:54`) + email (Resend) + Clerk webhooks. Settings in `/settings/notifications`.

### 15. Multi-Currency Support
Add `accounts.currency (USD/EUR/INR...)`, FX rates API (daily cron), convert to base currency in `lib/utils.ts` currency helpers. Display with `Intl.NumberFormat`.

### 16. Tags & Enhanced Notes
`tags` + `transaction_tags` many-to-many. Autocomplete in form, filterable in table.

### 17. Command Palette + Shortcuts
`cmd+k` palette (new transaction `n`, search `s`, goto dashboard `g d`). Built on `components/ui/dialog.tsx`.

### 18. PWA / Mobile Offline
`next-pwa`, offline TanStack Query cache (`features/*/api/use-get-*.ts`), background sync for `POST` when online.

### 19. Household / Shared Budgets
Migrate to Clerk Organizations — add `orgId` to `accounts`, `categories`, `transactions`, `budgets`. Role-based access (admin/member).

### 20. Audit Log & Versioning
`transactions_history (transactionId, changedBy, diff, timestamp)` on `use-edit-transaction.ts` / `use-delete-transaction.ts`. View in transaction detail.

### 21. Tax Categories & Year-End Summary
Map `categories` → IRS buckets, annual rollup report grouped for 1099/Capital Gains.

### 22. Investments Tracking
New domain separate from cash: `holdings (symbol, quantity, costBasis, accountId)`, price sync (Alpha Vantage / Finnhub), P&L chart.

---

## Suggested Implementation Order

```
Week 1:  Budgets → Transfers → Duplicate Detection
Week 2:  Recurring → Split Transactions
Week 3-4: Plaid Sync → Receipts → Goals
Month 2: Net Worth → Advanced Filters → Export
Month 3: Forecast → Insights → Notifications → PWA
Backlog: Multi-Currency → Orgs → Audit Log → Tax → Investments
```

## Technical Notes

- **Runtime fix:** `app/api/[[...route]]/route.ts:9` typo `runtine` → `runtime`; validate `DATABASE_URL` lazily in `db/drizzle.ts:4` to avoid build-time `neon()` failure (`YOUR_DATABASE_URL` placeholder in `.env:7`).
- **Validation:** Extend `drizzle-zod` schemas in `db/schema.ts:17,30,59` for new tables; reuse `@hono/zod-validator` pattern.
- **State:** Continue `zustand` (`package.json:57`) + `features/*/hooks/use-open-*.ts` sheet pattern for new domains.
- **Testing:** Add `vitest` + `playwright` for `summary` aggregations and CSV flow.

---

## Contributing

Pick a feature from Phase 1, create branch `feat/budgets`, add migration via `bun run db:generate`, implement Hono route + hooks mirroring `features/categories/*` structure, update this file's checklist.

