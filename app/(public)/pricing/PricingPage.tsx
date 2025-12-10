import type { Metadata } from "next";
import type { ReactNode } from "react";
import { eq } from "drizzle-orm";

import { PlanCheckoutButtons } from "@/components/pricing/PlanCheckoutButtons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/db";
import { users } from "@/db/schema";
import { USER_PLAN_CATALOG, type UserPlanId, isUserPlanId } from "@/lib/constants/userPlans";
import { Locale } from "@/lib/i18n/locales";
import { stackServerApp } from "@/stack/server";

type PageSearchParams = Record<string, string | string[] | undefined>;

const PUBLIC_PLAN_ORDER = ["free", "paid_light", "paid", "paid_full"] as const;

const PLAN_PRICING: Record<
  (typeof PUBLIC_PLAN_ORDER)[number],
  {
    monthlyValue: string;
    display: Record<Locale, { monthly: string; annual: string }>;
  }
> = {
  free: {
    monthlyValue: "0",
    display: {
      fr: { monthly: "Gratuit", annual: "Gratuit" },
      en: { monthly: "Free", annual: "Free" },
    },
  },
  paid_light: {
    monthlyValue: "5.99",
    display: {
      fr: { monthly: "5,99 $/mois", annual: "59,99 $/an" },
      en: { monthly: "$5.99/mo", annual: "$59.99/year" },
    },
  },
  paid: {
    monthlyValue: "9.99",
    display: {
      fr: { monthly: "9,99 $/mois", annual: "99,99 $/an" },
      en: { monthly: "$9.99/mo", annual: "$99.99/year" },
    },
  },
  paid_full: {
    monthlyValue: "14.99",
    display: {
      fr: { monthly: "14,99 $/mois", annual: "149,99 $/an" },
      en: { monthly: "$14.99/mo", annual: "$149.99/year" },
    },
  },
};

const PLAN_DESCRIPTION_OVERRIDES: Record<Locale, Partial<Record<UserPlanId, string>>> = {
  fr: {},
  en: {
    free: "One-time pack: 10 generations and 5 free conversions, no automatic refill.",
    paid_light: "50 generations + 15 conversions.",
    paid: "100 generations + 35 conversions.",
    paid_full: "200 generations + 70 conversions.",
    full: "Unlimited access to generation and conversions.",
  },
};

const getPlanDescription = (planId: UserPlanId, locale: Locale) =>
  PLAN_DESCRIPTION_OVERRIDES[locale]?.[planId] ?? USER_PLAN_CATALOG[planId].description;

const getPlanPriceDisplay = (planId: (typeof PUBLIC_PLAN_ORDER)[number], locale: Locale) =>
  PLAN_PRICING[planId].display[locale] ?? PLAN_PRICING[planId].display.fr;

type StatusBannerKey = "success" | "cancel";

type PricingCopy = {
  heroTag: string;
  heroTitle: string;
  heroDescription: string;
  heroFootnote: ReactNode;
  planBadgeLabel: string;
  monthlyLabel: string;
  annualLabel: string;
  unlimitedTraining: string;
  unlimitedConversions: string;
  trainingQuotaLabel: string;
  conversionQuotaLabel: string;
  workflowsSupport: string;
  starterOneTime: string;
  starterCardNote: ReactNode;
  paidCardNote: ReactNode;
  banners: Record<StatusBannerKey, { title: string; description: string; tone: "success" | "warning" }>;
};

const PRICING_COPY: Record<Locale, PricingCopy> = {
  fr: {
    heroTag: "Tarifs Adapt2Life",
    heroTitle: "Choisis le volume qui suit ton entraînement",
    heroDescription:
      "Starter est un pack unique (10 générations + 5 conversions offerts). Les formules Momentum, Peak et Elite existent en version mensuelle ou annuelle (sans engagement) et leurs quotas se réinitialisent automatiquement le 1er de chaque mois.",
    heroFootnote: <>Starter inclus gratuitement pour chaque nouveau compte.</>,
    planBadgeLabel: "PLAN LE PLUS POPULAIRE",
    monthlyLabel: "Mensuel",
    annualLabel: "Annuel",
    unlimitedTraining: "Générations IA illimitées",
    unlimitedConversions: "Conversions Garmin illimitées",
    trainingQuotaLabel: "générations d’entraînements IA mensuelles",
    conversionQuotaLabel: "conversions Garmin automatisées",
    workflowsSupport: "Accès complet aux workflows Adapt2Life et au support e-mail.",
    starterOneTime: "Crédits offerts une seule fois — aucune recharge mensuelle.",
    starterCardNote: <>Crédits Starter utilisables une seule fois.</>,
    paidCardNote: (
      <>
        Quotas remis à zéro le 1<sup>er</sup> de chaque mois, quelle que soit la formule (mensuelle ou annuelle).
      </>
    ),
    banners: {
      success: {
        title: "Abonnement activé 🎉",
        description: "Ton paiement Stripe est confirmé. Tu recevras un e-mail de confirmation et ton quota vient d’être mis à jour.",
        tone: "success",
      },
      cancel: {
        title: "Paiement annulé",
        description: "Aucun prélèvement n’a été effectué. Tu peux réessayer à tout moment si tu souhaites changer de plan.",
        tone: "warning",
      },
    },
  },
  en: {
    heroTag: "Pricing",
    heroTitle: "Pick the volume that keeps up with your training",
    heroDescription:
      "Starter is a one-off pack (10 generations + 5 conversions on us). Momentum, Peak, and Elite are available monthly or annually (no commitment) with quotas resetting automatically on the 1st of every month.",
    heroFootnote: <>Starter is included for every new account.</>,
    planBadgeLabel: "MOST POPULAR PLAN",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    unlimitedTraining: "Unlimited AI generations",
    unlimitedConversions: "Unlimited Garmin conversions",
    trainingQuotaLabel: "AI workout generations per month",
    conversionQuotaLabel: "automated Garmin conversions",
    workflowsSupport: "Full access to Adapt2Life workflows and email support.",
    starterOneTime: "Starter credits are granted once — they do not refill each month.",
    starterCardNote: <>Starter credits can only be used once.</>,
    paidCardNote: <>Quotas reset on the 1st of every month for both monthly and annual plans.</>,
    banners: {
      success: {
        title: "Subscription activated 🎉",
        description: "Your Stripe payment is confirmed. You’ll receive a confirmation email and your quota was updated.",
        tone: "success",
      },
      cancel: {
        title: "Payment cancelled",
        description: "No charge was made. Feel free to try again anytime if you want to switch plans.",
        tone: "warning",
      },
    },
  },
};

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://adapt2life.app";
const basePath = "/pricing";

const metadataByLocale: Record<Locale, Metadata> = {
  fr: {
    title: "Tarifs Adapt2Life",
    description: "Compare les plans Starter, Momentum, Peak et Elite pour choisir le volume de générations et conversions adapté à ta pratique.",
    alternates: { canonical: `${siteUrl}${basePath}` },
    openGraph: {
      url: `${siteUrl}${basePath}`,
      title: "Tarifs Adapt2Life",
      description: "Découvre les offres Starter, Momentum, Peak et Elite : quotas mensuels et annuels pour adapter ton entraînement.",
      type: "website",
    },
  },
  en: {
    title: "Adapt2Life Pricing",
    description: "Compare Starter, Momentum, Peak, and Elite to pick the right generation/conversion volume for your training.",
    alternates: { canonical: `${siteUrl}/en${basePath}` },
    openGraph: {
      url: `${siteUrl}/en${basePath}`,
      title: "Adapt2Life Pricing",
      description: "See Starter, Momentum, Peak, and Elite – monthly and yearly quotas to match your workload.",
      type: "website",
    },
  },
};

export const getPricingMetadata = (locale: Locale): Metadata => metadataByLocale[locale] ?? metadataByLocale.fr;

const normalizeParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value ?? null;
};

const buildPricingJsonLd = (locale: Locale) => {
  const pageUrl = locale === "fr" ? `${siteUrl}${basePath}` : `${siteUrl}/en${basePath}`;
  const serviceName =
    locale === "fr" ? "Adapt2Life - Plans d'entraînement IA" : "Adapt2Life - AI training plans";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: serviceName,
    url: pageUrl,
    provider: {
      "@type": "Organization",
      name: "Adapt2Life",
      url: siteUrl,
    },
    offers: PUBLIC_PLAN_ORDER.map((planId) => ({
      "@type": "Offer",
      name: USER_PLAN_CATALOG[planId].label,
      priceCurrency: "USD",
      price: PLAN_PRICING[planId].monthlyValue,
      url: pageUrl,
      availability: "https://schema.org/InStock",
      description: getPlanDescription(planId, locale),
    })),
  };
};

export type PricingPageProps = {
  locale: Locale;
  searchParams?: PageSearchParams;
};

export async function PricingPage({ locale, searchParams }: PricingPageProps) {
  const copy = PRICING_COPY[locale] ?? PRICING_COPY.fr;
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });
  let currentPlan: UserPlanId | null = null;

  if (stackUser) {
    const [record] = await db
      .select({ planType: users.planType })
      .from(users)
      .where(eq(users.stackId, stackUser.id))
      .limit(1);
    currentPlan = isUserPlanId(record?.planType) ? record?.planType ?? null : null;
  }

  const statusParam = normalizeParam(searchParams?.status);
  const banner = statusParam === "success" || statusParam === "cancel" ? copy.banners[statusParam] : null;
  const jsonLd = buildPricingJsonLd(locale);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">{copy.heroTag}</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">{copy.heroTitle}</h1>
        <p className="text-base text-muted-foreground md:text-lg">{copy.heroDescription}</p>
        {banner ? (
          <div
            className={`mx-auto max-w-2xl rounded-2xl border px-4 py-3 text-left ${
              banner.tone === "success"
                ? "border-emerald-300/60 bg-emerald-950/30 text-emerald-100"
                : "border-amber-300/60 bg-amber-950/30 text-amber-100"
            }`}
          >
            <p className="text-sm font-semibold tracking-wide">{banner.title}</p>
            <p className="text-sm text-white/90">{banner.description}</p>
          </div>
        ) : null}
        <p className="text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground/70">{copy.heroFootnote}</p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {PUBLIC_PLAN_ORDER.map((planId) => {
          const plan = USER_PLAN_CATALOG[planId];
          const price = getPlanPriceDisplay(planId, locale);
          const isCurrentPlan = Boolean(stackUser && currentPlan === planId);
          const isStarterPlan = planId === "free";
          const planDescription = getPlanDescription(planId, locale);

          return (
            <Card
              key={planId}
              className={`flex flex-col justify-between border-white/10 bg-card/80 ${planId === "paid" ? "border-primary/40 shadow-xl shadow-primary/20" : ""}`}
            >
              <CardHeader>
                <CardTitle className="flex flex-col gap-2 text-2xl">
                  <div className="flex items-center justify-between gap-2">
                    <span>{plan.label}</span>
                    {planId === "paid" ? (
                      <span className="rounded-full border border-secondary/60 bg-secondary/10 px-3 py-1 text-xs font-semibold tracking-[0.3em] text-secondary">
                        {copy.planBadgeLabel}
                      </span>
                    ) : null}
                  </div>
                  <span className="text-base font-semibold text-primary">{price.monthly}</span>
                </CardTitle>
                <CardDescription>{planDescription}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="text-sm text-muted-foreground">
                  {copy.monthlyLabel} : <strong className="text-foreground">{price.monthly}</strong>{" "}
                  <span className="text-muted-foreground/80">—</span> {copy.annualLabel} :{" "}
                  <strong className="text-foreground">{price.annual}</strong>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.trainingQuota !== null ? (
                    <li>
                      <span className="font-semibold text-foreground">{plan.trainingQuota}</span> {copy.trainingQuotaLabel}
                    </li>
                  ) : (
                    <li>{copy.unlimitedTraining}</li>
                  )}
                  {plan.conversionQuota !== null ? (
                    <li>
                      <span className="font-semibold text-foreground">{plan.conversionQuota}</span> {copy.conversionQuotaLabel}
                    </li>
                  ) : (
                    <li>{copy.unlimitedConversions}</li>
                  )}
                  <li>{copy.workflowsSupport}</li>
                  {isStarterPlan ? <li>{copy.starterOneTime}</li> : null}
                </ul>
                <PlanCheckoutButtons
                  planId={planId}
                  price={price}
                  disabled={isCurrentPlan}
                  isAuthenticated={Boolean(stackUser)}
                  locale={locale}
                />
                <p className="text-xs text-muted-foreground">{isStarterPlan ? copy.starterCardNote : copy.paidCardNote}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
