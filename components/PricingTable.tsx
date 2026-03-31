const plans = [
  {
    name: "Starter",
    price: 49,
    calls: "10,000",
    features: [
      "10K API calls/month",
      "Craigslist scraping",
      "JSON response format",
      "Community support",
    ],
    highlighted: false,
  },
  {
    name: "Agent",
    price: 149,
    calls: "100,000",
    features: [
      "100K API calls/month",
      "Craigslist + Facebook",
      "Webhook notifications",
      "Priority support",
      "Batch requests",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 499,
    calls: "500,000",
    features: [
      "500K API calls/month",
      "All platforms",
      "Dedicated proxy pool",
      "Custom scraping rules",
      "SLA guarantee",
      "Dedicated support",
    ],
    highlighted: false,
  },
];

export default function PricingTable() {
  return (
    <section id="pricing" className="py-12 md:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold md:text-3xl">
          Simple, Predictable Pricing
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500 md:text-base">
          Pay for what you use. No hidden fees. Scale as your agents grow.
        </p>

        <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 md:p-8 ${
                plan.highlighted
                  ? "border-indigo-500 shadow-xl shadow-indigo-100"
                  : "border-gray-200"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{plan.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold md:text-4xl">${plan.price}</span>
                <span className="text-gray-500">/mo</span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {plan.calls} API calls
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`mt-8 w-full rounded-lg py-3 text-sm font-semibold transition ${
                  plan.highlighted
                    ? "bg-indigo-500 text-white hover:bg-indigo-400"
                    : "border border-gray-300 text-gray-700 hover:border-gray-400"
                }`}
              >
                Coming Soon
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
