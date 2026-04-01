"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function Hero() {
  const { isSignedIn } = useAuth();

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 text-center sm:px-6 md:pb-24 md:pt-24">
        <div className="mb-5 inline-block rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700">
          4 Platforms. 1 API. All 50 States.
        </div>
        <h1 className="text-[1.75rem] font-extrabold leading-tight tracking-tight text-blue-800 sm:text-5xl md:text-6xl">
          Multi-Platform Marketplace
          <br />
          Intelligence API
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-gray-500 sm:mt-6 sm:text-lg">
          Access real-time data from Craigslist, Facebook Marketplace, OfferUp,
          and Mercari. Built for AI agents and automation at scale.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row sm:gap-4">
          <Link
            href={isSignedIn ? "/dashboard" : "/sign-up"}
            className="w-full rounded-lg bg-amber-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-200 transition hover:bg-amber-600 sm:w-auto"
          >
            {isSignedIn ? "Go to Dashboard" : "Get API Access"}
          </Link>
          <Link
            href="/docs"
            className="w-full rounded-lg border border-blue-200 px-8 py-3.5 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 sm:w-auto"
          >
            View Documentation
          </Link>
        </div>
        <div className="mx-auto mt-10 flex max-w-lg flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            4 platforms in one API
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            15-minute data freshness
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            US nationwide coverage
          </span>
        </div>
      </div>
    </section>
  );
}
