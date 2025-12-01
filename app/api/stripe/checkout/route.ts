import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { STRIPE_PRICES } from "@/lib/constants/stripe";
import { USER_PLAN_CATALOG } from "@/lib/constants/userPlans";

const REQUEST_SCHEMA = z.object({
  planId: z.enum(["paid_light", "paid", "paid_full"]),
  billingCycle: z.enum(["monthly", "annual"]),
});

const PLAN_PRICE_REFERENCE = {
  paid_light: {
    monthly: STRIPE_PRICES.MOMENTUM_MONTHLY,
    annual: STRIPE_PRICES.MOMENTUM_YEARLY,
  },
  paid: {
    monthly: STRIPE_PRICES.PEAK_MONTHLY,
    annual: STRIPE_PRICES.PEAK_YEARLY,
  },
  paid_full: {
    monthly: STRIPE_PRICES.ELITE_MONTHLY,
    annual: STRIPE_PRICES.ELITE_YEARLY,
  },
} as const;

type PlanPriceReference = typeof PLAN_PRICE_REFERENCE;

type BillingCycle = keyof PlanPriceReference["paid_light"];

type PlanKey = keyof PlanPriceReference;

export async function POST(request: NextRequest) {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return NextResponse.json({ error: "Stripe est indisponible." }, { status: 500 });
  }

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  let body: z.infer<typeof REQUEST_SCHEMA>;
  try {
    body = REQUEST_SCHEMA.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const [localUser] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser) {
    return NextResponse.json({ error: "Profil utilisateur introuvable." }, { status: 400 });
  }

  const priceId = getStripePriceId(body.planId, body.billingCycle);
  const origin = resolveOrigin(request);
  const successUrl = `${origin}/pricing?status=success&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/pricing?status=cancel`;

  const params = new URLSearchParams();
  params.append("mode", "subscription");
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);
  params.append("line_items[0][price]", priceId);
  params.append("line_items[0][quantity]", "1");
  params.append("automatic_tax[enabled]", "true");
  params.append("client_reference_id", localUser.id.toString());
  params.append("metadata[userId]", localUser.id.toString());
  params.append("metadata[planId]", body.planId);
  params.append("metadata[billingCycle]", body.billingCycle);
  params.append("metadata[planLabel]", USER_PLAN_CATALOG[body.planId].label);
  if (stackUser.primaryEmail) {
    params.append("customer_email", stackUser.primaryEmail);
  }

  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const payload = await stripeResponse.json().catch(() => null);

  if (!stripeResponse.ok) {
    const message =
      (payload as { error?: { message?: string } } | null)?.error?.message ?? "Impossible de créer la session de paiement.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  return NextResponse.json({ url: (payload as { url?: string } | null)?.url ?? null });
}

const getStripePriceId = (planId: PlanKey, billingCycle: BillingCycle) => PLAN_PRICE_REFERENCE[planId][billingCycle];

const resolveOrigin = (request: NextRequest) => {
  const headerOrigin = request.headers.get("origin");
  if (headerOrigin) {
    return headerOrigin;
  }
  const protocol = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host") ?? process.env.APP_URL ?? "http://localhost:3000";
  return `${protocol}://${host}`;
};
