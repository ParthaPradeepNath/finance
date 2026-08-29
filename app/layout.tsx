import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import { QueryProvider } from "@/providers/query-provider";
import { SheetProvider } from "@/providers/sheet-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "Finance — Personal Finance Tracker",
    template: "%s | Finance",
  },
  description:
    "Track accounts, categories, and transactions. Visualize income vs expenses, import CSV, and manage budgets — built with Next.js 16, Clerk, Hono, and Neon Postgres.",
  applicationName: "Finance",
  keywords: ["finance", "personal finance", "budget", "transactions", "Next.js", "Clerk", "Hono", "Drizzle"],
  authors: [{ name: "Finance" }],
  creator: "Finance",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Finance — Personal Finance Tracker",
    description: "Track accounts, categories, and transactions with charts and CSV import.",
    siteName: "Finance",
  },
  twitter: {
    card: "summary_large_image",
    title: "Finance — Personal Finance Tracker",
    description: "Track accounts, categories, and transactions with charts and CSV import.",
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary text-primary-foreground px-3 py-2 rounded-md z-50"
          >
            Skip to content
          </a>
          <QueryProvider>
            <SheetProvider />
            <Toaster />
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
