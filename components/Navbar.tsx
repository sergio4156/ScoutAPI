"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, SignOutButton as ClerkSignOut } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-lg font-bold text-blue-800">
          ScoutAPI
        </Link>

        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 transition hover:text-gray-900 md:hidden"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/#pricing" className="text-sm text-gray-500 transition hover:text-blue-800">
            Pricing
          </Link>
          <Link href="/docs" className="text-sm text-gray-500 transition hover:text-blue-800">
            Documentation
          </Link>
          <Link href="/api/health" className="text-sm text-gray-500 transition hover:text-blue-800">
            API Status
          </Link>
          {isSignedIn ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                Dashboard
              </Link>
              <ClerkSignOut redirectUrl="/">
                <button className="text-sm text-gray-500 transition hover:text-blue-800">
                  Sign Out
                </button>
              </ClerkSignOut>
            </>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-gray-500 transition hover:text-blue-800">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
              >
                Get API Access
              </Link>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <div className="flex flex-col gap-1 px-4 py-3">
            <Link href="/#pricing" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50">
              Pricing
            </Link>
            <Link href="/docs" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50">
              Documentation
            </Link>
            <Link href="/api/health" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50">
              API Status
            </Link>
            {isSignedIn ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="mt-1 rounded-lg bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-600">
                  Dashboard
                </Link>
                <ClerkSignOut redirectUrl="/">
                  <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50">
                    Sign Out
                  </button>
                </ClerkSignOut>
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50">
                  Sign In
                </Link>
                <Link href="/sign-up" onClick={() => setOpen(false)} className="mt-1 rounded-lg bg-amber-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-amber-600">
                  Get API Access
                </Link>
</>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
