import { NextResponse } from "next/server";
import { openApiSpec } from "@/lib/openapi";

export const runtime = "nodejs";

/**
 * GET /api/docs — OpenAPI 3.1 JSON for portfolio/interview.
 * Typed client lives in `lib/hono.ts:1` (hc<AppType>).
 * For Swagger UI, point https://petstore.swagger.io/ or `scalar` at this URL.
 */
export async function GET() {
  return NextResponse.json(openApiSpec, {
    headers: {
      "Content-Type": "application/openapi+json; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
