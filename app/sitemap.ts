import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/transactions`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/accounts`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/categories`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/settings`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
