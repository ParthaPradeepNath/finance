import type { NextConfig } from "next";

const nextConfig: NextConfig =
  process.env.STANDALONE === "true"
    ? { output: "standalone" }
    : {};

export default nextConfig;