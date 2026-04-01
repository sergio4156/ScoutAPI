import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "ScoutAPI - Multi-Platform Marketplace Intelligence API",
  description:
    "Real-time data from Craigslist, Facebook Marketplace, OfferUp, and Mercari. Built for AI agents and automation. US nationwide coverage, 15min caching, 99.5% uptime.",
  keywords:
    "marketplace API, craigslist API, facebook marketplace API, offerup API, mercari API, arbitrage automation, AI agent marketplace data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-white text-gray-900 antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
