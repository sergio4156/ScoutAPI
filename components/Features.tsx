const features = [
  {
    title: "Multi-Platform Coverage",
    description:
      "Craigslist, Facebook Marketplace, OfferUp, and Mercari. All major US marketplaces in one API.",
    color: "bg-blue-50 text-blue-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />,
  },
  {
    title: "Real-Time Data",
    description:
      "15-minute cache refresh. Get fresh listings without hammering your rate limits.",
    color: "bg-amber-50 text-amber-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />,
  },
  {
    title: "Nationwide Reach",
    description:
      "All 50 states. Search any city from San Francisco to New York with one parameter.",
    color: "bg-emerald-50 text-emerald-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />,
  },
  {
    title: "Fault Isolation",
    description:
      "Platform-specific errors. If Facebook is down, Craigslist, OfferUp, and Mercari keep working.",
    color: "bg-violet-50 text-violet-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />,
  },
  {
    title: "Built for Scale",
    description:
      "100 requests/minute. Built for AI agents running 24/7 automation workflows.",
    color: "bg-blue-50 text-blue-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />,
  },
  {
    title: "Developer-Friendly",
    description:
      "RESTful API, JSON responses, comprehensive docs. Integrate in minutes, not days.",
    color: "bg-emerald-50 text-emerald-600",
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />,
  },
];

export default function Features() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          Everything You Need. Nothing You Don&apos;t.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500 md:text-base">
          Built for production workloads. Trusted by AI agent developers
          and arbitrage automation teams.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${f.color}`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  {f.icon}
                </svg>
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
