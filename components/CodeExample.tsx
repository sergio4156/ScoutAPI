export default function CodeExample() {
  const code = `// Multi-platform search in one call
const response = await fetch("/api/scrape", {
  method: "POST",
  headers: {
    "Authorization": "Bearer sk_live_...",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    platforms: ["craigslist", "facebook", "offerup"],
    query: "iPhone 15 Pro",
    location: "sfbay",
    max_results: 20
  })
});

const data = await response.json();
// Returns results from all 3 platforms`;

  const response = `{
  "success": true,
  "results": {
    "craigslist": {
      "success": true,
      "results": [
        {
          "title": "iPhone 15 Pro 256GB",
          "price": 850,
          "location": "Mission District, SF",
          "platform": "craigslist"
        }
      ],
      "count": 18,
      "cached": false
    },
    "facebook": {
      "success": true,
      "count": 12,
      "cached": true
    },
    "offerup": {
      "success": true,
      "count": 9,
      "cached": false
    }
  }
}`;

  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          One API Call. Four Marketplaces.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500 md:text-base">
          Search across Craigslist, Facebook, OfferUp, and Mercari
          simultaneously. Integrate in minutes.
        </p>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Request
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-lg">
              <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-gray-400">JavaScript</span>
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-gray-300 sm:p-4 sm:text-sm">
                <code>{code}</code>
              </pre>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Response
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-lg">
              <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
                <span className="h-3 w-3 rounded-full bg-red-400" />
                <span className="h-3 w-3 rounded-full bg-amber-400" />
                <span className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="ml-2 text-xs text-gray-400">JSON</span>
              </div>
              <pre className="overflow-x-auto p-3 text-xs leading-relaxed text-emerald-400 sm:p-4 sm:text-sm">
                <code>{response}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
