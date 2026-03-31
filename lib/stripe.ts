import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// Map Stripe Price IDs to plan names and limits
export const PLANS: Record<string, { name: string; limit: number }> = {
  [process.env.STRIPE_PRICE_STARTER!]: { name: "starter", limit: 10_000 },
  [process.env.STRIPE_PRICE_AGENT!]: { name: "agent", limit: 100_000 },
  [process.env.STRIPE_PRICE_ENTERPRISE!]: { name: "enterprise", limit: 500_000 },
};

export function getPlanByPriceId(priceId: string) {
  return PLANS[priceId] ?? { name: "starter", limit: 10_000 };
}
