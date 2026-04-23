"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    tagline: "Try ScoutAPI — no credit card required",
    price: 0,
    calls: "200",
    priceEnv: "",
    features: [
      "200 API calls/month",
      "All 4 platforms",
      "All 50 US states",
      "10 requests/minute",
      "15-minute data caching",
    ],
    excluded: ["Webhooks", "Priority support"],
    highlighted: false,
    cta: "Start Free",
    btnClass: "bg-emerald-500 text-white hover:bg-emerald-600",
    isFree: true,
  },
  {
    name: "Starter",
    tagline: "Perfect for testing and small-scale automation",
    price: 49,
    calls: "10,000",
    priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_STARTER",
    features: [
      "10,000 API calls/month",
      "All 4 platforms (Craigslist, Facebook, OfferUp, Mercari)",
      "All 50 US states",
      "100 requests/minute",
      "15-minute data caching",
      "Email support",
    ],
    excluded: ["Webhooks", "Priority support"],
    highlighted: false,
    cta: "Start with Starter",
    btnClass: "bg-blue-800 text-white hover:bg-blue-700",
  },
  {
    name: "Agent",
    tagline: "Built for production AI agents",
    price: 149,
    calls: "100,000",
    priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_AGENT",
    features: [
      "100,000 API calls/month",
      "All 4 platforms",
      "All 50 US states",
      "100 requests/minute",
      "15-minute data caching",
      "Webhook alerts (new listings, price drops)",
      "Priority email support",
      "99.5% uptime SLA",
    ],
    excluded: [],
    highlighted: true,
    cta: "Get Agent Plan",
    btnClass: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-200",
  },
  {
    name: "Enterprise",
    tagline: "For high-volume automation at scale",
    price: 499,
    calls: "500,000",
    priceEnv: "NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE",
    features: [
      "500,000 API calls/month",
      "All 4 platforms",
      "All 50 US states",
      "Custom rate limits",
      "15-minute data caching",
      "Webhook alerts",
      "Priority support (< 2hr response)",
      "99.9% uptime SLA",
    ],
    excluded: [],
    highlighted: false,
    cta: "Go Enterprise",
    btnClass: "bg-blue-800 text-white hover:bg-blue-700",
  },
];

const priceIds: Record<string, string> = {
  NEXT_PUBLIC_STRIPE_PRICE_STARTER: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER ?? "",
  NEXT_PUBLIC_STRIPE_PRICE_AGENT: process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENT ?? "",
  NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "",
};

export default function PricingTable() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(priceEnv: string) {
    if (!isSignedIn) {
      router.push("/sign-up");
      return;
    }
    const priceId = priceIds[priceEnv];
    if (!priceId) {
      alert("Pricing not configured yet. Please try again later.");
      return;
    }
    setLoading(priceEnv);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Failed to start checkout");
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-blue-800 md:text-3xl">
          Simple Pricing. Scale As You Grow.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-gray-500 md:text-base">
          All plans include access to all 4 platforms. No hidden fees. No
          per-platform charges.
        </p>

        <div className="mt-10 grid gap-6 md:mt-14 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border bg-white p-6 transition md:p-8 ${
                plan.highlighted
                  ? "border-amber-400 shadow-xl"
                  : "border-gray-200 hover:shadow-md"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-white">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-semibold text-blue-800">
                {plan.name}
              </h3>
              <p className="mt-1 text-xs text-gray-400">{plan.tagline}</p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900 md:text-4xl">
                  {plan.price === 0 ? "Free" : `$${plan.price}`}
                </span>
                {plan.price > 0 && <span className="text-gray-400">/mo</span>}
              </div>
              <p className="mt-1 text-sm text-gray-400">
                {plan.calls} API calls
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
                {plan.excluded.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => (plan as { isFree?: boolean }).isFree ? router.push("/sign-up") : handleSubscribe(plan.priceEnv)}
                disabled={loading === plan.priceEnv}
                className={`mt-8 w-full rounded-lg py-3 text-sm font-semibold transition disabled:opacity-50 ${plan.btnClass}`}
              >
                {loading === plan.priceEnv
                  ? "Redirecting..."
                  : isSignedIn
                  ? plan.cta
                  : "Get Started"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
