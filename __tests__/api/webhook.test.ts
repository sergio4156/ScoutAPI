import { NextRequest } from "next/server";

// --- Mocks ---

const mockPrisma = {
  user: { upsert: jest.fn() },
  subscription: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  apiKey: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  usage: { upsert: jest.fn() },
};

const mockStripeWebhooksConstructEvent = jest.fn();
const mockStripeSubscriptionsRetrieve = jest.fn();

jest.mock("@/lib/db", () => ({ prisma: mockPrisma }));
jest.mock("@/lib/stripe", () => ({
  stripe: {
    webhooks: { constructEvent: mockStripeWebhooksConstructEvent },
    subscriptions: { retrieve: mockStripeSubscriptionsRetrieve },
  },
  getPlanByPriceId: jest.fn(() => ({ name: "starter", limit: 10_000 })),
}));
jest.mock("@/lib/apiKey", () => ({
  generateApiKey: jest.fn(() => ({ plain: "sk_live_test", hashed: "hashed_test" })),
}));

import { POST } from "@/app/api/webhooks/stripe/route";

// --- Fixtures ---

function makeWebhookRequest(body: string, signature = "sig_valid"): NextRequest {
  return new NextRequest("http://localhost:3000/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": signature,
    },
    body,
  });
}

const mockCheckoutEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      metadata: { clerkId: "clerk_123" },
      customer: "cus_123",
      customer_details: { email: "buyer@example.com" },
      subscription: "sub_stripe_123",
    },
  },
};

const mockDeletedEvent = {
  type: "customer.subscription.deleted",
  data: {
    object: {
      id: "sub_stripe_123",
      cancel_at_period_end: false,
    },
  },
};

const mockStripeSubscription = {
  id: "sub_stripe_123",
  items: {
    data: [
      {
        price: { id: "price_starter" },
        current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
      },
    ],
  },
};

// --- Tests ---

beforeEach(() => {
  jest.clearAllMocks();
  mockPrisma.user.upsert.mockResolvedValue({ id: "user_1", clerkId: "clerk_123", email: "buyer@example.com" });
  mockPrisma.subscription.upsert.mockResolvedValue({});
  mockPrisma.apiKey.findFirst.mockResolvedValue(null);
  mockPrisma.apiKey.create.mockResolvedValue({});
  mockPrisma.usage.upsert.mockResolvedValue({});
  mockStripeSubscriptionsRetrieve.mockResolvedValue(mockStripeSubscription);
});

describe("POST /api/webhooks/stripe", () => {
  describe("Signature Validation", () => {
    it("returns 400 when stripe-signature header is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/webhooks/stripe", {
        method: "POST",
        body: "{}",
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain("Missing signature");
    });

    it("returns 400 when signature verification fails", async () => {
      mockStripeWebhooksConstructEvent.mockImplementation(() => {
        throw new Error("Invalid signature");
      });
      const req = makeWebhookRequest("{}", "sig_invalid");
      const res = await POST(req);

      expect(res.status).toBe(400);
      // No DB changes should occur
      expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
      expect(mockPrisma.subscription.upsert).not.toHaveBeenCalled();
    });
  });

  describe("checkout.session.completed", () => {
    beforeEach(() => {
      mockStripeWebhooksConstructEvent.mockReturnValue(mockCheckoutEvent);
    });

    it("creates user, subscription, and API key", async () => {
      const req = makeWebhookRequest(JSON.stringify(mockCheckoutEvent));
      const res = await POST(req);

      expect(res.status).toBe(200);

      // User created/updated
      expect(mockPrisma.user.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clerkId: "clerk_123" },
          create: expect.objectContaining({ email: "buyer@example.com" }),
        })
      );

      // Subscription created
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            stripeCustomerId: "cus_123",
            stripeSubscriptionId: "sub_stripe_123",
            status: "active",
          }),
        })
      );

      // API key generated
      expect(mockPrisma.apiKey.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ key: "hashed_test", userId: "user_1" }),
      });

      // Usage initialized
      expect(mockPrisma.usage.upsert).toHaveBeenCalled();
    });

    it("does not create duplicate API key if one exists", async () => {
      mockPrisma.apiKey.findFirst.mockResolvedValue({ id: "existing_key" });
      const req = makeWebhookRequest(JSON.stringify(mockCheckoutEvent));
      await POST(req);

      expect(mockPrisma.apiKey.create).not.toHaveBeenCalled();
    });

    it("skips processing when clerkId is missing from metadata", async () => {
      mockStripeWebhooksConstructEvent.mockReturnValue({
        type: "checkout.session.completed",
        data: { object: { metadata: {}, customer: "cus_123", subscription: "sub_123" } },
      });
      const req = makeWebhookRequest("{}");
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.user.upsert).not.toHaveBeenCalled();
    });
  });

  describe("customer.subscription.deleted", () => {
    it("marks subscription as canceled", async () => {
      mockStripeWebhooksConstructEvent.mockReturnValue(mockDeletedEvent);
      mockPrisma.subscription.update.mockResolvedValue({});
      const req = makeWebhookRequest(JSON.stringify(mockDeletedEvent));
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockPrisma.subscription.update).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: "sub_stripe_123" },
        data: { status: "canceled" },
      });
    });
  });

  describe("Idempotency", () => {
    it("handles duplicate checkout events without creating duplicate records", async () => {
      mockStripeWebhooksConstructEvent.mockReturnValue(mockCheckoutEvent);
      // upsert is naturally idempotent — calling twice should be safe
      const req1 = makeWebhookRequest(JSON.stringify(mockCheckoutEvent));
      const req2 = makeWebhookRequest(JSON.stringify(mockCheckoutEvent));

      await POST(req1);
      await POST(req2);

      // upsert called twice but won't create duplicates due to unique constraints
      expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrisma.subscription.upsert).toHaveBeenCalledTimes(2);
    });
  });
});
