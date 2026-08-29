"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { UserProfile } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useGetAccounts } from "@/features/accounts/api/use-get-accounts";
import { useGetCategories } from "@/features/categories/api/use-get-categories";
import { useGetTransactions } from "@/features/transactions/api/use-get-transactions";
import {
  Settings,
  Wallet,
  Tag,
  ArrowUpDown,
  Download,
  Trash2,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Shield,
  IndianRupee,
  CalendarDays,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useUser();
  const { data: accounts } = useGetAccounts();
  const { data: categories } = useGetCategories();
  const { data: transactions } = useGetTransactions();

  const accountsCount = accounts?.length ?? 0;
  const categoriesCount = categories?.length ?? 0;
  const transactionsCount = transactions?.length ?? 0;

  return (
    <div className="max-w-screen-2xl mx-auto w-full pb-10 -mt-24">
      {/* Header — finance identity */}
      <Card className="border-none drop-shadow-sm mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-xl">Finance Settings</CardTitle>
              <CardDescription>
                Manage your money — accounts, categories, currency, data and imports for <span className="font-medium text-foreground">{user?.primaryEmailAddress?.emailAddress ?? "your workspace"}</span>
              </CardDescription>
            </div>
            <Badge variant="secondary" className="sm:ml-auto w-fit">
              {transactionsCount} transactions
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Finance-specific controls */}
        <div className="space-y-6">
          {/* Overview stats — real data, not dummy */}
          <Card className="border-none drop-shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-blue-600" /> Overview
              </CardTitle>
              <CardDescription>Your finance workspace</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="flex justify-center mb-1">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{accountsCount}</div>
                <div className="text-xs text-muted-foreground">Accounts</div>
                <Button variant="link" size="sm" className="h-6 text-xs px-0" asChild>
                  <Link href="/accounts">Manage</Link>
                </Button>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="flex justify-center mb-1">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{categoriesCount}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
                <Button variant="link" size="sm" className="h-6 text-xs px-0" asChild>
                  <Link href="/categories">Manage</Link>
                </Button>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="flex justify-center mb-1">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-lg font-semibold">{transactionsCount}</div>
                <div className="text-xs text-muted-foreground">Transactions</div>
                <Button variant="link" size="sm" className="h-6 text-xs px-0" asChild>
                  <Link href="/transactions">View</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Currency & formatting — tied to lib/utils.ts:17 formatCurrency (INR) */}
          <Card className="border-none drop-shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-blue-600" /> Currency & Formatting
              </CardTitle>
              <CardDescription>How amounts are stored & displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3 bg-muted/30">
                <div className="text-xs text-muted-foreground">Current display</div>
                <div className="font-mono text-sm mt-1">INR — ₹ — Intl.NumberFormat `en-US`</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Code: <code className="bg-background px-1 py-0.5 rounded">lib/utils.ts:17 formatCurrency</code> — stored as <span className="font-medium">milinuts ×1000</span> (<code className="bg-background px-1 py-0.5 rounded">db/schema.ts:34 integer amount</code>)
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Example</div>
                  <div className="font-medium">₹10.50 → 10500</div>
                </div>
                <div className="rounded border p-2">
                  <div className="text-xs text-muted-foreground">Precision</div>
                  <div className="font-medium">3 decimals, integer column</div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Multi-currency (USD/EUR) is on the roadmap — <code className="bg-muted px-1 py-0.5 rounded">UPCOMING_FEATURES.md:15</code>. When enabled, each <code className="bg-muted px-1 py-0.5 rounded">accounts</code> row will carry a <code className="bg-muted px-1 py-0.5 rounded">currency</code> column.
              </p>
            </CardContent>
          </Card>

          {/* Date & filters — matches components/filters.tsx */}
          <Card className="border-none drop-shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-blue-600" /> Dates & Filters
              </CardTitle>
              <CardDescription>Dashboard defaults</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Default range</span>
                <span className="font-medium">Last 30 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Logic</span>
                <span className="font-mono text-xs">subDays(30) — lib/utils.ts:75</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filters</span>
                <span className="font-medium">Account + Date (`components/filters.tsx:1`)</span>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                Summary compares current vs previous period (`app/api/[[...route]]/summary.ts:38-80` — `fillMissingDays`).
              </p>
            </CardContent>
          </Card>

          {/* Data management — CSV import/export, your actual flows */}
          <Card className="border-none drop-shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-blue-600" /> Data Management
              </CardTitle>
              <CardDescription>Import, export, cleanup</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-3">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Download className="h-4 w-4" /> CSV Import
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Upload in <code className="bg-muted px-1 py-0.5 rounded">/transactions</code> → map columns → preview → bulk-create (`features/transactions/api/use-bulk-create-transactions.ts`). Scoped to selected `accountId`.
                </div>
                <Button size="sm" className="mt-3 w-full" asChild>
                  <Link href="/transactions">Go to Import</Link>
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" disabled title="Export with current filters — coming soon">
                  <Download className="h-4 w-4 mr-1" /> Export CSV
                </Button>
                <Button variant="outline" size="sm" disabled title="PDF statement — roadmap">
                  <TrendingUp className="h-4 w-4 mr-1" /> Export PDF
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Exports use the same filtered `DataTable` (`components/data-table.tsx`) and Hono `GET /transactions?from&to`.
              </p>
            </CardContent>
          </Card>

          {/* Budgets teaser — finance-specific upcoming */}
          <Card className="border-none drop-shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" /> Budgets — Coming Soon
              </CardTitle>
              <CardDescription>Per-category monthly limits</CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                Set a limit for Food, Rent, etc. — progress bars in <code className="bg-muted px-1 py-0.5 rounded">components/data-grid.tsx</code> + alert at 80/100% (toast via <code className="bg-muted px-1 py-0.5 rounded">sonner</code>).
              </p>
              <Badge variant="outline" className="text-xs">
                Roadmap: Phase 1 — Budgets
              </Badge>
            </CardContent>
          </Card>

          {/* Danger zone — finance-specific */}
          <Card className="border border-destructive/30 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-destructive">
                <Trash2 className="h-4 w-4" /> Danger Zone
              </CardTitle>
              <CardDescription>Irreversible finance actions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md bg-destructive/5 border border-destructive/20 p-3">
                <div className="font-medium text-sm">Delete all my finance data</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Removes your `accounts`, `categories` and `transactions` (cascade delete via <code className="bg-muted px-1 py-0.5 rounded">db/schema.ts:39 onDelete cascade</code>). Scoped to your Clerk `userId`.
                </div>
                <Button variant="destructive" size="sm" className="mt-3" disabled>
                  Delete all data
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" /> Requires re-authentication — never touches other users.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Clerk profile — keep your beautiful Clerk component, now in finance context */}
        <div className="lg:col-span-2">
          <Card className="border-none drop-shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile & Security</CardTitle>
              <CardDescription>
                Managed by Clerk — email, password, 2FA. Your finance data stays isolated per user (
                <code className="bg-muted px-1 py-0.5 rounded">proxy.ts:6 clerkMiddleware</code>).
              </CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="flex justify-center p-4 sm:p-6 bg-muted/20">
                <UserProfile
                  appearance={{
                    elements: {
                      rootBox: "w-full max-w-[720px]",
                      card: "shadow-none border-0 w-full",
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Tip: Use the left panels to jump to <Link href="/accounts" className="underline">Accounts</Link>, <Link href="/categories" className="underline">Categories</Link> or <Link href="/transactions" className="underline">Transactions</Link>. Budgets & bank sync are next — see <code className="bg-muted px-1 py-0.5 rounded">UPCOMING_FEATURES.md</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
