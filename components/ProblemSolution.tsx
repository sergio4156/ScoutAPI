const columns = [
  {
    problem: "Building marketplace scrapers is hard",
    details: [
      "Websites change HTML constantly",
      "Anti-bot detection breaks your code",
      "Managing 4+ scrapers = maintenance nightmare",
    ],
    solution: "We handle the scraping. You handle the innovation.",
    benefits: [
      "Always-updated selectors",
      "Built-in anti-bot stealth",
      "One unified API for all platforms",
    ],
  },
  {
    problem: "Arbitrage requires real-time data",
    details: [
      "Manual searching wastes hours",
      "Stale data = missed opportunities",
      "Single-platform tools limit visibility",
    ],
    solution: "Real-time multi-market intelligence",
    benefits: [
      "Data refreshed every 15 minutes",
      "Compare prices across 4 platforms",
      "National coverage (all 50 states)",
    ],
  },
  {
    problem: "APIs break at scale",
    details: [
      "Rate limits kill automation",
      "No caching = high costs",
      "Single point of failure",
    ],
    solution: "Built for production workloads",
    benefits: [
      "100 requests/min per key",
      "Intelligent caching (90% cost reduction)",
      "Fault-isolated platforms",
    ],
  },
];

export default function ProblemSolution() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          Stop Building Scrapers. Start Building Products.
        </h2>
        <div className="mt-10 grid gap-8 md:mt-14 md:grid-cols-3">
          {columns.map((col) => (
            <div key={col.problem} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-4 text-sm font-semibold uppercase tracking-wider text-red-400">
                The Problem
              </div>
              <h3 className="font-semibold text-gray-900">{col.problem}</h3>
              <ul className="mt-3 space-y-1.5">
                {col.details.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="mt-1 text-red-300">-</span>
                    {d}
                  </li>
                ))}
              </ul>
              <div className="my-5 border-t border-gray-100" />
              <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-500">
                The Solution
              </div>
              <h3 className="font-semibold text-gray-900">{col.solution}</h3>
              <ul className="mt-3 space-y-1.5">
                {col.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
