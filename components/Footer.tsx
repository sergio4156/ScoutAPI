import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-blue-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="text-lg font-bold">ScoutAPI</div>
            <p className="mt-2 text-sm text-blue-200">
              Multi-platform marketplace intelligence API for AI agents and
              automation.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Product
            </div>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li><Link href="/#pricing" className="transition hover:text-amber-400">Pricing</Link></li>
              <li><Link href="/docs" className="transition hover:text-amber-400">Documentation</Link></li>
              <li><Link href="/api/health" className="transition hover:text-amber-400">API Status</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Coverage
            </div>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li>Craigslist</li>
              <li>Facebook Marketplace</li>
              <li>OfferUp</li>
              <li>Mercari</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold uppercase tracking-wider text-blue-300">
              Info
            </div>
            <ul className="mt-3 space-y-2 text-sm text-blue-200">
              <li>US Marketplaces Only (All 50 States)</li>
              <li>International Expansion — Q2 2026</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-blue-800 pt-6 text-center text-sm text-blue-300">
          &copy; {new Date().getFullYear()} ScoutAPI. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
