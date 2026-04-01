const cases = [
  {
    title: "Arbitrage Bots",
    description:
      "Scan 10 cities across 4 platforms in seconds. Find underpriced inventory before competitors.",
    code: `const cities = ['sfbay', 'newyork', 'miami', 'chicago'];
const platforms = ['craigslist', 'facebook', 'offerup'];
// 12 API calls = nationwide market visibility`,
  },
  {
    title: "Price Monitoring",
    description:
      "Track competitor pricing in real-time. Get alerts when prices drop below your thresholds.",
    code: `// Monitor iPhone 15 Pro across all platforms
// Webhook fires when price < $800
// Auto-buy or notify your team instantly`,
  },
  {
    title: "Market Research",
    description:
      "Analyze marketplace trends. Identify high-demand markets and optimize inventory placement.",
    code: `// Aggregate 10,000 listings/day
// Identify high-demand markets
// Optimize inventory placement by region`,
  },
];

export default function UseCases() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          Built For Automation. Proven By Results.
        </h2>
        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-3">
          {cases.map((c) => (
            <div
              key={c.title}
              className="rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {c.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {c.description}
              </p>
              <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-3">
                <pre className="text-xs leading-relaxed text-emerald-400">
                  <code>{c.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
