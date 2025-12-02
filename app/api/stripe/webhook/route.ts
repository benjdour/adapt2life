import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { USER_PLAN_CATALOG, getUserPlanConfig, type UserPlanId } from "@/lib/constants/userPlans";
import { STRIPE_PRICES } from "@/lib/constants/stripe";

const getStripeClient = async () => {
  const Stripe = (await import("stripe")).default;
  const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-11-17.clover";
  return new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: STRIPE_API_VERSION });
};

const priceToPlan: Record<string, UserPlanId> = {
  [STRIPE_PRICES.MOMENTUM_MONTHLY]: "paid_light",
  [STRIPE_PRICES.MOMENTUM_YEARLY]: "paid_light",
  [STRIPE_PRICES.PEAK_MONTHLY]: "paid",
  [STRIPE_PRICES.PEAK_YEARLY]: "paid",
  [STRIPE_PRICES.ELITE_MONTHLY]: "paid_full",
  [STRIPE_PRICES.ELITE_YEARLY]: "paid_full",
} as const;

export async function POST(request: NextRequest) {
  const stripe = await getStripeClient();
  const headerList = await headers();
  const signature = headerList.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Configuration Stripe incomplète." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const payload = await request.text();
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Signature Stripe invalide." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
      break;
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "invoice.payment_succeeded":
      await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
      break;
case "customer.subscription.deleted":
      await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

const handleCheckoutSession = async (session: Stripe.Checkout.Session) => {
  if (!session.metadata?.userId || !session.customer || !session.subscription) {
    return;
  }

  const userId = Number.parseInt(session.metadata.userId, 10);
  const planId = resolvePlanFromSession(session);
  const stripeCustomerId = typeof session.customer === "string" ? session.customer : session.customer.id;
  const stripeSubscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;

  const update: Partial<typeof users.$inferInsert> = {
    stripeCustomerId,
    stripeSubscriptionId,
    stripePlanId: planId,
  };

  if (planId) {
    const plan = getUserPlanConfig(planId);
    update.planType = planId;
    if (plan.trainingQuota !== null) {
      update.trainingGenerationsRemaining = plan.trainingQuota;
    }
    if (plan.conversionQuota !== null) {
      update.garminConversionsRemaining = plan.conversionQuota;
    }
  }

  await db.update(users).set(update).where(eq(users.id, userId));
};

const handleSubscriptionUpdate = async (subscription: Stripe.Subscription) => {
  const customerId = String(subscription.customer);
  const [user] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  if (!user) {
    return;
  }

  const priceId = subscription.items.data[0]?.price?.id;
  const planId = priceId ? priceToPlan[priceId] ?? null : null;
  const update: Partial<typeof users.$inferInsert> = {
    stripeSubscriptionId: subscription.id,
    stripePlanId: planId,
  };

  if (planId) {
    update.planType = planId;
  }

  await db.update(users).set(update).where(eq(users.id, user.id));
};

const handleSubscriptionDeletion = async (subscription: Stripe.Subscription) => {
  const customerId = subscription.customer ? String(subscription.customer) : null;
  if (!customerId) {
    return;
  }

  await db
    .update(users)
    .set({ stripeSubscriptionId: null, stripePlanId: null, planType: "free" })
    .where(eq(users.stripeCustomerId, customerId));
};

const resolvePlanFromSession = (session: Stripe.Checkout.Session): UserPlanId | null => {
  const metadataPlanId = session.metadata?.planId;
  if (metadataPlanId && metadataPlanId in USER_PLAN_CATALOG) {
    return metadataPlanId as UserPlanId;
  }

  const lineItemPrice = session.line_items?.data?.[0]?.price?.id ?? session.metadata?.priceId;
  if (lineItemPrice && priceToPlan[lineItemPrice]) {
    return priceToPlan[lineItemPrice];
  }

  return null;
};
