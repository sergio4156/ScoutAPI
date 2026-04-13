import Stripe from "stripe";
import { PLANS } from "./constants";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
});

// Map Stripe Price IDs to plan names and limits
export const STRIPE_PRICE_PLANS: Record<string, { name: string; limit: number }> = {
  [process.env.STRIPE_PRICE_STARTER!]: PLANS.starter,
  [process.env.STRIPE_PRICE_AGENT!]: PLANS.agent,
  [process.env.STRIPE_PRICE_ENTERPRISE!]: PLANS.enterprise,
};

export function getPlanByPriceId(priceId: string) {
  return STRIPE_PRICE_PLANS[priceId] ?? PLANS.starter;
}
