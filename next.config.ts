import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Security headers — interviewers check these (CSP, HSTS, X-Frame, etc.)
// Clerk + Next.js + Recharts need: script-src 'unsafe-inline'/'unsafe-eval' for dev, connect-src for Clerk/Neon
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS only in prod (localhost is http)
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
  {
    key: "Content-Security-Policy",
    // Clerk domains + Neon + Vercel analytics; tighten frame-ancestors/self
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
      "font-src 'self' data:",
      `connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://*.neon.tech https://*.neon.tech:* wss://*.neon.tech https://api.clerk.com ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}`,
      "frame-src 'self' https://*.clerk.accounts.dev https://*.clerk.com https://challenges.cloudflare.com",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const baseConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Performance: optimize heavy deps (recharts, lucide, radux) — tree-shake
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "react-icons", "@radix-ui/react-dialog", "@radix-ui/react-select", "date-fns"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.clerk.com" },
      { protocol: "https", hostname: "**.clerk.accounts.dev" },
      { protocol: "https", hostname: "img.clerk.com" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

const nextConfig: NextConfig =
  process.env.STANDALONE === "true" ? { ...baseConfig, output: "standalone" } : baseConfig;

export default nextConfig;