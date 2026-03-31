import Link from "next/link";

const locations = [
  "sfbay", "losangeles", "newyork", "chicago", "seattle",
  "portland", "denver", "austin", "boston", "miami",
  "dallas", "houston", "atlanta", "phoenix", "sandiego",
  "minneapolis", "detroit", "philadelphia", "washingtondc", "orlando",
];

export default function DocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline"
      >
        &larr; Back to Home
      </Link>

      <h1 className="text-4xl font-extrabold">API Documentation</h1>
      <p className="mt-3 text-gray-500">
        Everything you need to integrate ScoutAPI into your AI agents and
        automation tools.
      </p>

      {/* Getting Started */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Getting Started</h2>
        <p className="mt-2 text-gray-600">
          ScoutAPI exposes a single endpoint that returns structured marketplace
          data. Send a POST request with your search parameters and receive JSON
          results.
        </p>
        <div className="mt-4 rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          <code>POST /api/scrape</code>
        </div>
      </section>

      {/* Request Format */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Request Format</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          <pre>{`{
  "platform": "craigslist",
  "query": "iphone 15",
  "location": "sfbay",
  "max_results": 50
}`}</pre>
        </div>
        <table className="mt-6 w-full text-sm">
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
      </section>

      {/* Response Format */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Response Format</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
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
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Error Responses</h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-red-400">
          <pre>{`{
  "success": false,
  "error": {
    "code": "SCRAPE_FAILED",
    "message": "Could not retrieve listings from Craigslist"
  }
}`}</pre>
        </div>
        <table className="mt-6 w-full text-sm">
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
      </section>

      {/* Code Samples */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Code Samples</h2>

        {/* cURL */}
        <h3 className="mt-6 text-lg font-semibold">cURL</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
          <pre>{`curl -X POST http://localhost:3000/api/scrape \\
  -H "Content-Type: application/json" \\
  -d '{
    "platform": "craigslist",
    "query": "macbook pro",
    "location": "sfbay",
    "max_results": 10
  }'`}</pre>
        </div>

        {/* JavaScript */}
        <h3 className="mt-6 text-lg font-semibold">JavaScript (fetch)</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
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

        {/* Python */}
        <h3 className="mt-6 text-lg font-semibold">Python (requests)</h3>
        <div className="mt-2 overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-300">
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
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Supported Locations</h2>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {locations.map((loc) => (
            <code
              key={loc}
              className="rounded bg-gray-100 px-2 py-1 text-center text-xs"
            >
              {loc}
            </code>
          ))}
        </div>
      </section>

      <footer className="mt-16 border-t pt-8 text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} ScoutAPI
      </footer>
    </main>
  );
}
