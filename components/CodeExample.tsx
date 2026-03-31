export default function CodeExample() {
  const code = `fetch("https://api.scoutapi.dev/api/scrape", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    platform: "craigslist",
    query: "iphone 15",
    location: "sfbay",
    max_results: 20
  })
})
.then(res => res.json())
.then(data => {
  console.log(\`Found \${data.count} listings\`);
  data.results.forEach(item => {
    console.log(\`\${item.title} - $\${item.price}\`);
  });
});`;

  const response = `{
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
}`;

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-bold">
          Simple API, Powerful Data
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
          One POST request returns structured JSON with listings, prices,
          locations, and images. Integrate in minutes.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Request */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Request
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-lg">
              <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-400">
                  JavaScript
                </span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-gray-300">
                <code>{code}</code>
              </pre>
            </div>
          </div>

          {/* Response */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
              Response
            </h3>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-900 shadow-lg">
              <div className="flex items-center gap-2 border-b border-gray-700 px-4 py-2">
                <span className="h-3 w-3 rounded-full bg-red-500" />
                <span className="h-3 w-3 rounded-full bg-yellow-500" />
                <span className="h-3 w-3 rounded-full bg-green-500" />
                <span className="ml-2 text-xs text-gray-400">JSON</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-green-400">
                <code>{response}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
