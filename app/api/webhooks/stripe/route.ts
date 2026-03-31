import { NextRequest, NextResponse } from "next/server";
import { stripe, getPlanByPriceId } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { generateApiKey } from "@/lib/apiKey";
import Stripe from "stripe";

// Disable body parsing — we need the raw body to verify the Stripe signature
export const runtime = "nodejs";

async function getOrCreateUser(clerkId: string, email: string) {
  return prisma.user.upsert({
    where: { clerkId },
    update: { email },
    create: { clerkId, email },
  });
}

function currentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        if (!clerkId) break;

        const customerEmail =
          session.customer_details?.email ?? "unknown@example.com";

        // Get subscription details from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = stripeSubscription.items.data[0].price.id;
        const plan = getPlanByPriceId(priceId);

        // Create or update user
        const user = await getOrCreateUser(clerkId, customerEmail);

        // Create subscription record
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: priceId,
            status: "active",
            plan: plan.name,
            currentPeriodEnd: new Date(
              stripeSubscription.items.data[0].current_period_end * 1000
            ),
          },
          create: {
            userId: user.id,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: priceId,
            status: "active",
            plan: plan.name,
            currentPeriodEnd: new Date(
              stripeSubscription.items.data[0].current_period_end * 1000
            ),
          },
        });

        // Generate an API key if user doesn't have one
        const existingKey = await prisma.apiKey.findFirst({
          where: { userId: user.id, active: true },
        });
        if (!existingKey) {
          const { hashed } = generateApiKey();
          await prisma.apiKey.create({
            data: { key: hashed, userId: user.id },
          });
        }

        // Initialize usage for current month
        await prisma.usage.upsert({
          where: { userId_month: { userId: user.id, month: currentMonth() } },
          update: {},
          create: {
            userId: user.id,
            month: currentMonth(),
            requestCount: 0,
            limit: plan.limit,
          },
        });

        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const existing = await prisma.subscription.findUnique({
          where: { stripeSubscriptionId: sub.id },
        });
        if (!existing) break;

        const priceId = sub.items.data[0].price.id;
        const plan = getPlanByPriceId(priceId);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: sub.id },
          data: {
            status: sub.status,
            stripePriceId: priceId,
            plan: plan.name,
            currentPeriodEnd: new Date(
              sub.items.data[0].current_period_end * 1000
            ),
            cancelAtPeriodEnd: sub.cancel_at_period_end,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.subscription
          .update({
            where: { stripeSubscriptionId: sub.id },
            data: { status: "canceled" },
          })
          .catch(() => {
            // Subscription may not exist in our DB
          });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        if (invoice.subscription) {
          await prisma.subscription
            .update({
              where: {
                stripeSubscriptionId: invoice.subscription,
              },
              data: { status: "past_due" },
            })
            .catch(() => {});
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
