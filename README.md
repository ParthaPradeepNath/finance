# Finance

A full-stack personal finance tracker built with **Next.js 16**, **Clerk** authentication, a **Hono** API, and **Neon Postgres** (Drizzle ORM). Track accounts, categories, and transactions, import CSV bank exports, and visualize your income and expenses.

## Features

- **Authentication** — Clerk sign-in / sign-up; every user's data is isolated and scoped to their account.
- **Accounts · Categories · Transactions** — full CRUD through a fully typed Hono API (REST, loosely-typed client with `InferResponseType`).
- **Dashboard** — income vs. expenses over time, category-by-category breakdown (recharts), animated summary metrics, and a date-range + account filter bar.
- **Transactions table** — sorting, per-column filtering, pagination, row selection, and bulk delete (TanStack Table v9).
- **CSV import** — paste or upload a CSV, map columns, preview, and only insert what you've mapped.
- **Featured tooling** — server + client validation with zod, forms with react-hook-form, `shadcn/ui` components on Tailwind CSS 4.

## Tech Stack

| Layer       | Choice                                                        |
| ----------- | ------------------------------------------------------------- |
| Framework   | Next.js 16 (App Router, Turbopack)                            |
| UI          | React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui            |
| Auth        | Clerk (middleware route protection via `proxy.ts`)            |
| API         | Hono (App Router route handler) · @hono/zod-validator         |
| Database    | Neon (serverless Postgres) · Drizzle ORM                      |
| Data layer  | TanStack Query · TanStack Table · recharts                    |
| Data handling | zod · react-hook-form · react-papaparse · query-string      |
| Package     | bun                                                           |

## Requirements

- **Node** ≥ 20.9 (Next.js 16 requirement)
- **bun** (package manager + scripts). [Install bun](https://bun.sh)
- **Clerk** app — [dashboard.clerk.com](https://dashboard.clerk.com)
- **Neon** Postgres project — [console.neon.tech](https://console.neon.tech)
- **Docker** + Docker Compose (optional, for containerized deployment)

## Getting Started

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

`.env.local` is read by both Next.js at runtime and the Drizzle tooling (`drizzle.config.ts`, `scripts/migrate.ts`, `scripts/seed.ts`). Fill in the values:

| Variable                              | Description                                      | Example                                       |
| ------------------------------------- | ------------------------------------------------ | --------------------------------------------- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`   | Clerk publishable key (dashboard → API Keys)     | `pk_test_...`                                 |
| `CLERK_SECRET_KEY`                    | Clerk secret key (never expose client-side)      | `sk_test_...`                                 |
| `DATABASE_URL`                        | Neon connection string                           | `postgres://user:pass@host.neon.tech/dbname`  |
| `NEXT_PUBLIC_APP_URL`                 | Base URL of the app                              | `http://localhost:3000`                       |

> Tip: `npx clerk@latest env pull` writes your Clerk keys automatically. The Neon connection string lives in your Neon project's **Connect** dialog (HTTP pooling).

### 3. Set up the database

```bash
bun run db:generate   # generate SQL migrations from db/schema.ts (dev)
bun run db:migrate    # apply pending migrations to your DB
```

Optionally seed sample data (edit `SEED_USER_ID` in `scripts/seed.ts` first):

```bash
bun run ./scripts/seed.ts
```

### 4. Run the app

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000), sign in, and start adding accounts.

## Scripts

| Script                | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `bun run dev`         | Start the development server (Turbopack)             |
| `bun run build`       | Production build (type-check + static generation)    |
| `bun run start`       | Serve the production build                           |
| `bun run lint`        | ESLint (flat config)                                 |
| `bun run db:generate` | Generate a new Drizzle migration                     |
| `bun run db:migrate`  | Apply migrations against `DATABASE_URL`              |
| `bun run db:studio`   | Open Drizzle Studio for the schema                   |

## Docker

A multi-stage `Dockerfile` produces a minimal standalone Next.js image; `docker-compose.yml` wires it up.

```bash
docker compose up --build -d   # build + start on :3000
docker compose down            # stop and remove the container
```

- Runtime secrets come from your local environment / `.env` (see `environment:` in `docker-compose.yml`); they are **not** baked into the image.
- Public variables (`NEXT_PUBLIC_*`) are also passed as build args so they get inlined into the client bundle.
- The image is a standalone Next.js server (`node server.js`), so run DB migrations from the host:

```bash
bun run db:migrate
```

Build the image directly if you don't use Compose:

```bash
docker build --build-arg NEXT_PUBLIC_APP_URL=https://example.com -t finance-web .
```

## Project Structure

```
app/
├── (auth)/sign-in, (auth)/sign-up   # Clerk auth pages
├── (dashboard)/                     # protected app shell + nav
│   ├── page.tsx                     # dashboard (summary + charts)
│   ├── accounts/  categories/  transactions/
└── api/[[...route]]/                # single Hono handler (typed REST API):
    ├── route.ts                     #   GET|POST|DELETE|PATCH/PUT
    ├── accounts.ts  categories.ts  transactions.ts  summary.ts
components/                          # shadcn/ui + feature components (charts, data table, CSV import)
features/                            # per-domain API hooks + components
db/schema.ts                         # Drizzle schema (accounts, categories, transactions)
db/drizzle.ts                        # Neon + Drizzle client
lib/hono.ts                          # typed API client for the browser
lib/utils.ts                         # cn(), currency/date helpers
proxy.ts                             # Clerk middleware (route protection)
scripts/migrate.ts  seed.ts          # DB migrations + seed
```

## Currency Storage — why "milinuts"

Amounts are stored as **integers of the smallest unit** (milinuts, `1/1000` of a currency unit) rather than `FLOAT`/`DOUBLE` or `DECIMAL`:

1. **Float/Double — no.** No precision guarantees; accumulated arithmetic drifts (`0.1 * 0.2 === 0.020000000000000004`).
2. **Decimal/Numeric — awkward in JS.** No native JS type, extra libraries, and breaks end-to-end type safety (forms pick this up immediately).
3. **Solution — integers of the smallest unit.** Using "milinuts" gives 3 decimals of precision, stays cross-language compatible, works with plain JS numbers in forms and APIs, and stores cleanly in a Postgres `integer` column.

Example: `$10.50 => 10500`.

## License

Private project — no license specified.