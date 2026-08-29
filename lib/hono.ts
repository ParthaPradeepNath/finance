import {hc} from "hono/client"

import { AppType } from "@/app/api/[[...route]]/route"

// Typed Hono client — use `client.api.accounts.$get()` with full type safety.
// `NEXT_PUBLIC_APP_URL` is validated in `lib/env.ts:1`; fallback to localhost for tests/build.
const getBaseUrl = () => {
  if (typeof window !== "undefined") return "";
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return "http://localhost:3000";
};

export const client = hc<AppType>(getBaseUrl(), {
  fetch: (input: RequestInfo | URL, init?: RequestInit) =>
    fetch(input, {
      ...init,
      credentials: "include",
    }),
})

// Re-export AppType for `features/*/api/*` hooks
export type { AppType };