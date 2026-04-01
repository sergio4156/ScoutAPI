import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import SignOutButton from "@/components/SignOutButton";
import ApiKeyDisplay from "@/components/ApiKeyDisplay";
import ManageSubscription from "@/components/ManageSubscription";

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) redirect("/sign-in");

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? "Unknown";

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });

  const [subscription, apiKeys, usage, recentRequests] = await Promise.all([
    prisma.subscription.findUnique({ where: { userId: user.id } }),
    prisma.apiKey.findMany({
      where: { userId: user.id, active: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usage.findUnique({
      where: { userId_month: { userId: user.id, month: currentMonth() } },
    }),
    prisma.apiRequest.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const isActive = subscription?.status === "active";
  const planName = subscription?.plan ?? "Free";
  const planLimit = usage?.limit ?? 10_000;
  const requestCount = usage?.requestCount ?? 0;
  const usagePercent = Math.min((requestCount / planLimit) * 100, 100);

  // Usage bar color based on percentage
  const usageColor =
    usagePercent >= 90 ? "bg-red-500" : usagePercent >= 70 ? "bg-yellow-500" : "bg-indigo-500";

  return (
    <div className="min-h-screen bg-gray-50">
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
        <p className="mt-1 text-xs text-gray-400 sm:hidden">{email}</p>

        <div className="mt-6 grid gap-4 sm:gap-6 md:mt-8 md:grid-cols-3">
          {/* API Key */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              API Key
            </h2>
            {apiKeys.length > 0 ? (
              <ApiKeyDisplay keyPreview={`sk_live_...${apiKeys[0].id.slice(-6)}`} />
            ) : isActive ? (
              <p className="mt-4 rounded-lg bg-green-50 px-3 py-3 text-center text-sm text-green-700">
                Your API key was generated at checkout. Check your email or contact support.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-gray-100 px-3 py-3 text-center text-sm text-gray-500">
                Subscribe to a plan to get your API key
              </p>
            )}
          </div>

          {/* Usage */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Usage This Month
            </h2>
            <div className="mt-4">
              <div className="text-3xl font-extrabold">
                {requestCount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">
                of {planLimit.toLocaleString()} API calls
              </div>
              <div className="mt-3 h-2 w-full rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full transition-all ${usageColor}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              {usagePercent >= 90 && (
                <p className="mt-2 text-xs text-red-500">
                  Approaching limit — consider upgrading your plan
                </p>
              )}
              <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                <span>Rate limit: 100 req/min</span>
                <span>Cache: 15 min TTL</span>
              </div>
            </div>
          </div>

          {/* Plan */}
          <div className="rounded-xl border bg-white p-5 shadow-sm md:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
              Current Plan
            </h2>
            <div className="mt-4">
              <div className="text-3xl font-extrabold capitalize">{planName}</div>
              <div className="text-sm text-gray-500">
                {isActive
                  ? `Renews ${new Date(subscription!.currentPeriodEnd).toLocaleDateString()}`
                  : "No active subscription"}
              </div>
              {isActive ? (
                <ManageSubscription />
              ) : (
                <Link
                  href="/#pricing"
                  className="mt-4 block w-full rounded-lg bg-indigo-500 py-3 text-center text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Upgrade Plan
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        <div className="mt-4 rounded-xl border bg-white p-5 shadow-sm sm:mt-6 md:mt-8 md:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Recent Requests
          </h2>
          {recentRequests.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="pb-2 font-medium">Endpoint</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Time</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRequests.map((req) => (
                    <tr key={req.id} className="border-b last:border-0">
                      <td className="py-2 font-mono text-xs">{req.endpoint}</td>
                      <td className="py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            req.statusCode === 200
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {req.statusCode}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{req.responseTime}ms</td>
                      <td className="py-2 text-gray-500">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 flex flex-col items-center justify-center py-6 text-gray-400 md:py-8">
              <svg className="h-10 w-10 md:h-12 md:w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
              </svg>
              <p className="mt-3 text-sm">No requests yet</p>
              <p className="mt-1 text-xs text-gray-300">
                Requests will appear here once you start using the API
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
