import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
const getStackServerApp = async () => {
  const { stackServerApp } = await import("@/stack/server");
  return stackServerApp;
};

const STRIPE_API_VERSION: Stripe.LatestApiVersion = "2025-11-17.clover";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", { apiVersion: STRIPE_API_VERSION });

const resolveOrigin = (request: NextRequest) => {
  const origin = request.headers.get("origin");
  if (origin) {
    return origin;
  }
  const proto = request.headers.get("x-forwarded-proto") ?? "https";
  const host = request.headers.get("host") ?? process.env.APP_URL ?? "http://localhost:3000";
  return `${proto}://${host}`;
};

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe est indisponible." }, { status: 500 });
  }

  const stackServerApp = await getStackServerApp();
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: request });
  if (!stackUser) {
    return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
  }

  const [localUser] = await db
    .select({ id: users.id, stripeCustomerId: users.stripeCustomerId })
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (!localUser?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif." }, { status: 400 });
  }

  try {
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: localUser.stripeCustomerId,
      return_url: `${resolveOrigin(request)}/secure/user-information`,
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message ?? "Impossible d’ouvrir le portail." }, { status: 500 });
  }
}
