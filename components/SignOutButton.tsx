"use client";

import { SignOutButton as ClerkSignOutButton } from "@clerk/nextjs";

export default function SignOutButton() {
  return (
    <ClerkSignOutButton redirectUrl="/">
      <button className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-gray-900">
        Sign Out
      </button>
    </ClerkSignOutButton>
  );
}
