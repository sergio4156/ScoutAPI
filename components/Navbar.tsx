"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <nav className="absolute left-0 right-0 top-0 z-10">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-6">
        <Link href="/" className="text-lg font-bold text-white">
          ScoutAPI
        </Link>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-300 transition hover:text-white md:hidden"
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

        {/* Desktop links */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/docs" className="text-sm text-gray-300 transition hover:text-white">
            Docs
          </Link>
          {isSignedIn ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/sign-in" className="text-sm text-gray-300 transition hover:text-white">
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-white/10 bg-gray-900/95 backdrop-blur md:hidden">
          <div className="flex flex-col gap-2 px-4 py-4">
            <Link
              href="/docs"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
            >
              Docs
            </Link>
            {isSignedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-indigo-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-indigo-500 px-3 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
