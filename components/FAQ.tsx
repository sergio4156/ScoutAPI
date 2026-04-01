const faqs = [
  {
    q: "Do I pay per platform?",
    a: "No. One price gets you access to all 4 platforms (Craigslist, Facebook, OfferUp, Mercari).",
  },
  {
    q: "What counts as an API call?",
    a: "Each platform search = 1 call. A multi-platform request with 3 platforms = 3 calls. Cached responses still count but save you time.",
  },
  {
    q: "Can I change plans?",
    a: "Yes. Upgrade or downgrade anytime. Changes take effect immediately.",
  },
  {
    q: "What happens if I exceed my limit?",
    a: "The API returns a 429 error. Upgrade your plan or wait until next billing cycle (resets monthly).",
  },
  {
    q: "Is this US-only?",
    a: "Yes, currently all platforms cover US markets (all 50 states). International expansion planned for Q2 2026.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. 7-day money-back guarantee if you're not satisfied.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-gray-50 py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="mt-10 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q} className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="font-semibold text-gray-900">{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
