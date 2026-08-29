"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-screen-2xl mx-auto w-full -mt-24">
      <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 mb-4">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold">Dashboard failed to load</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          We couldn&apos;t load your financial data. This may be a temporary issue.
        </p>
        {error?.message && (
          <p className="text-xs font-mono bg-muted p-2 rounded mt-3 max-w-lg mx-auto truncate">
            {error.message}
          </p>
        )}
        {error?.digest && (
          <p className="text-xs text-muted-foreground mt-1">Digest: {error.digest}</p>
        )}
        <div className="flex gap-3 justify-center mt-6">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>
      </div>
    </div>
  );
}
