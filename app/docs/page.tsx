import Link from "next/link";

const locations = [
  "sfbay", "losangeles", "newyork", "chicago", "seattle",
  "portland", "denver", "austin", "boston", "miami",
  "dallas", "houston", "atlanta", "phoenix", "sandiego",
  "minneapolis", "detroit", "philadelphia", "washingtondc", "orlando",
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 md:py-16">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline md:mb-8"
      >
        &larr; Back to Home
      </Link>

      <h1 className="text-3xl font-extrabold md:text-4xl">API Documentation</h1>
      <p className="mt-2 text-sm text-gray-500 md:mt-3 md:text-base">
        Everything you need to integrate ScoutAPI into your AI agents and
        automation tools.
      </p>

      {/* Getting Started */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Getting Started</h2>
        <p className="mt-2 text-sm text-gray-600 md:text-base">
          ScoutAPI exposes a single endpoint that returns structured marketplace
          data. Send a POST request with your search parameters and receive JSON
          results.
        </p>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-sm text-gray-300 md:p-4">
          <code>POST /api/scrape</code>
        </div>
      </section>

      {/* Request Format */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Request Format</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-300 sm:text-sm md:p-4">
          <pre>{`{
  "platform": "craigslist",
  "query": "iphone 15",
  "location": "sfbay",
  "max_results": 50
}`}</pre>
        </div>

        {/* Mobile-friendly table: stacked on small screens */}
        <div className="mt-6 hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold">Field</th>
                <th className="pb-2 font-semibold">Type</th>
                <th className="pb-2 font-semibold">Required</th>
                <th className="pb-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">platform</td>
                <td className="py-2">string</td>
                <td className="py-2">Yes</td>
                <td className="py-2">
                  Marketplace to scrape. Currently: <code className="rounded bg-gray-100 px-1 text-xs">&quot;craigslist&quot;</code>
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">query</td>
                <td className="py-2">string</td>
                <td className="py-2">Yes</td>
                <td className="py-2">Search term</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">location</td>
                <td className="py-2">string</td>
                <td className="py-2">Yes</td>
                <td className="py-2">Craigslist region code (see below)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">max_results</td>
                <td className="py-2">number</td>
                <td className="py-2">No</td>
                <td className="py-2">1-100, default 50</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards for table data */}
        <div className="mt-6 space-y-3 sm:hidden">
          {[
            { field: "platform", type: "string", required: "Yes", desc: 'Marketplace to scrape. Currently: "craigslist"' },
            { field: "query", type: "string", required: "Yes", desc: "Search term" },
            { field: "location", type: "string", required: "Yes", desc: "Craigslist region code (see below)" },
            { field: "max_results", type: "number", required: "No", desc: "1-100, default 50" },
          ].map((row) => (
            <div key={row.field} className="rounded-lg border p-3 text-sm">
              <div className="font-mono text-xs font-semibold text-indigo-600">{row.field}</div>
              <div className="mt-1 flex gap-3 text-xs text-gray-500">
                <span>{row.type}</span>
                <span>{row.required === "Yes" ? "Required" : "Optional"}</span>
              </div>
              <div className="mt-1 text-gray-600">{row.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Response Format */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Response Format</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-green-400 sm:text-sm md:p-4">
          <pre>{`{
  "success": true,
  "results": [
    {
      "id": "7299847294",
      "title": "iPhone 15 Pro 256GB - Mint Condition",
      "price": 850,
      "location": "Mission District, SF",
      "url": "https://sfbay.craigslist.org/sfc/mob/d/...",
      "posted": "2 hours ago",
      "platform": "craigslist",
      "image": "https://images.craigslist.org/..."
    }
  ],
  "count": 23,
  "query_time_ms": 847
}`}</pre>
        </div>
      </section>

      {/* Error Response */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Error Responses</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-red-400 sm:text-sm md:p-4">
          <pre>{`{
  "success": false,
  "error": {
    "code": "SCRAPE_FAILED",
    "message": "Could not retrieve listings from Craigslist"
  }
}`}</pre>
        </div>

        <div className="mt-6 hidden sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 font-semibold">Code</th>
                <th className="pb-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="text-gray-600">
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">INVALID_REQUEST</td>
                <td className="py-2">Missing required fields</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">UNSUPPORTED_PLATFORM</td>
                <td className="py-2">Platform not yet available</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">INVALID_LOCATION</td>
                <td className="py-2">Unrecognized location code</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">TIMEOUT</td>
                <td className="py-2">Scrape exceeded 30s timeout</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-mono text-xs">SCRAPE_FAILED</td>
                <td className="py-2">General scraping error</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile stacked error codes */}
        <div className="mt-6 space-y-2 sm:hidden">
          {[
            { code: "INVALID_REQUEST", desc: "Missing required fields" },
            { code: "UNSUPPORTED_PLATFORM", desc: "Platform not yet available" },
            { code: "INVALID_LOCATION", desc: "Unrecognized location code" },
            { code: "TIMEOUT", desc: "Scrape exceeded 30s timeout" },
            { code: "SCRAPE_FAILED", desc: "General scraping error" },
          ].map((row) => (
            <div key={row.code} className="rounded-lg border p-3 text-sm">
              <div className="font-mono text-xs font-semibold text-red-500">{row.code}</div>
              <div className="mt-1 text-gray-600">{row.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Code Samples */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Code Samples</h2>

        <h3 className="mt-6 text-base font-semibold md:text-lg">cURL</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-300 sm:text-sm md:p-4">
          <pre>{`curl -X POST http://localhost:3000/api/scrape \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "craigslist",
    "query": "macbook pro",
    "location": "sfbay",
    "max_results": 10
  }'`}</pre>
        </div>

        <h3 className="mt-6 text-base font-semibold md:text-lg">JavaScript (fetch)</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-300 sm:text-sm md:p-4">
          <pre>{`const response = await fetch("/api/scrape", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    platform: "craigslist",
    query: "macbook pro",
    location: "sfbay",
    max_results: 10
  })
});

const data = await response.json();
console.log(data.results);`}</pre>
        </div>

        <h3 className="mt-6 text-base font-semibold md:text-lg">Python (requests)</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-3 text-xs text-gray-300 sm:text-sm md:p-4">
          <pre>{`import requests

response = requests.post("http://localhost:3000/api/scrape", json={
    "platform": "craigslist",
    "query": "macbook pro",
    "location": "sfbay",
    "max_results": 10
})

data = response.json()
for listing in data["results"]:
    print(f"{listing['title']} - $" + str(listing['price']))`}</pre>
        </div>
      </section>

      {/* Supported Locations */}
      <section className="mt-8 md:mt-12">
        <h2 className="text-xl font-bold md:text-2xl">Supported Locations</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {locations.map((loc) => (
            <code
              key={loc}
              className="rounded bg-gray-100 px-2 py-1.5 text-center text-xs"
            >
              {loc}
            </code>
          ))}
        </div>
      </section>

      <footer className="mt-12 border-t pt-6 text-center text-sm text-gray-400 md:mt-16 md:pt-8">
        &copy; {new Date().getFullYear()} ScoutAPI
      </footer>
    </main>
  );
}
