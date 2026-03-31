import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "Unknown";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="text-lg font-bold text-gray-900">
            ScoutAPI
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="hidden text-sm text-gray-500 sm:inline">{email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 md:py-10">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 md:text-base">
          Manage your API keys and monitor usage.
        </p>
        {/* Email shown below title on mobile only */}
        <p className="mt-1 text-xs text-gray-400 sm:hidden">{email}</p>

        <div className="mt-6 grid gap-4 sm:gap-6 md:mt-8 md:grid-cols-3">
          {/* API Key */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              API Key
            </h2>
            <p className="mt-4 rounded-lg bg-gray-100 px-3 py-3 text-center text-sm text-gray-500">
              Your API key will appear here after subscribing
            </p>
          </div>

          {/* Usage */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Usage This Month
            </h2>
            <div className="mt-4">
              <div className="text-3xl font-extrabold">0</div>
              <div className="text-sm text-gray-500">of 10,000 API calls</div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-0 rounded-full bg-indigo-500" />
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Current Plan
            </h2>
            <div className="mt-4">
              <div className="text-3xl font-extrabold">Free</div>
              <div className="text-sm text-gray-500">No active subscription</div>
              <button className="mt-4 w-full rounded-lg bg-indigo-500 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm sm:mt-6 md:mt-8 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Requests
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center py-6 text-gray-400 md:py-8">
            <svg
              className="h-10 w-10 md:h-12 md:w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
              />
            </svg>
            <p className="mt-3 text-sm">No requests yet</p>
            <p className="mt-1 text-xs text-gray-300">
              Requests will appear here once you start using the API
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
