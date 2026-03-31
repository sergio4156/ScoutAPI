import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-indigo-900 text-white">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
      <div className="relative mx-auto max-w-5xl px-6 py-28 text-center">
        <div className="mb-4 inline-block rounded-full border border-indigo-400/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300">
          Now in Beta
        </div>
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
          Real-time Marketplace Data
          <br />
          <span className="text-indigo-400">for AI Agents</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
          Power your arbitrage bots, deal finders, and market research tools
          with fresh Craigslist &amp; Facebook Marketplace data via a simple
          REST API.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/docs"
            className="rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-400"
          >
            View Documentation
          </Link>
          <Link
            href="#pricing"
            className="rounded-lg border border-gray-600 px-6 py-3 text-sm font-semibold text-gray-300 transition hover:border-gray-400 hover:text-white"
          >
            See Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
