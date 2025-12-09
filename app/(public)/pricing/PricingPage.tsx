import type { Metadata } from "next";
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
    monthly: string;
    annual: string;
    monthlyValue: string;
  }
> = {
  free: { monthly: "Gratuit", annual: "Gratuit", monthlyValue: "0" },
  paid_light: { monthly: "5,99 $/mois", annual: "59,99 $/an", monthlyValue: "5.99" },
  paid: { monthly: "9,99 $/mois", annual: "99,99 $/an", monthlyValue: "9.99" },
  paid_full: { monthly: "14,99 $/mois", annual: "149,99 $/an", monthlyValue: "14.99" },
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

const STATUS_BANNERS: Record<
  "success" | "cancel",
  { title: string; description: string; tone: "success" | "warning" }
> = {
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
};

const buildPricingJsonLd = (locale: Locale) => {
  const pageUrl = locale === "fr" ? `${siteUrl}${basePath}` : `${siteUrl}/en${basePath}`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Adapt2Life - Plans d'entraînement IA",
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
      description: USER_PLAN_CATALOG[planId].description,
    })),
  };
};

export type PricingPageProps = {
  locale: Locale;
  searchParams?: PageSearchParams;
};

export async function PricingPage({ locale, searchParams }: PricingPageProps) {
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
  const banner = statusParam === "success" || statusParam === "cancel" ? STATUS_BANNERS[statusParam] : null;
  const jsonLd = buildPricingJsonLd(locale);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Tarifs Adapt2Life</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">Choisis le volume qui suit ton entraînement</h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Starter est un pack unique (10 générations + 5 conversions offerts). Les formules Momentum, Peak et Elite existent en version
          mensuelle ou annuelle (sans engagement) et leurs quotas se réinitialisent automatiquement le 1<sup>er</sup> de chaque mois.
        </p>
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
        <p className="text-xs font-medium uppercase tracking-[0.4em] text-muted-foreground/70">
          Starter inclus gratuitement pour chaque nouveau compte
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        {PUBLIC_PLAN_ORDER.map((planId) => {
          const plan = USER_PLAN_CATALOG[planId];
          const price = PLAN_PRICING[planId];
          const isCurrentPlan = Boolean(stackUser && currentPlan === planId);
          const isStarterPlan = planId === "free";

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
                        PLAN LE PLUS POPULAIRE
                      </span>
                    ) : null}
                  </div>
                  <span className="text-base font-semibold text-primary">{price.monthly}</span>
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
                <p className="text-sm text-muted-foreground">
                  Mensuel : <strong className="text-foreground">{price.monthly}</strong>{" "}
                  <span className="text-muted-foreground/80">—</span> Annuel :{" "}
                  <strong className="text-foreground">{price.annual}</strong>
                </p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {plan.trainingQuota !== null ? (
                    <li>
                      <span className="font-semibold text-foreground">{plan.trainingQuota}</span> générations d’entraînements IA mensuelles
                    </li>
                  ) : (
                    <li>Générations IA illimitées</li>
                  )}
                  {plan.conversionQuota !== null ? (
                    <li>
                      <span className="font-semibold text-foreground">{plan.conversionQuota}</span> conversions Garmin automatisées
                    </li>
                  ) : (
                    <li>Conversions Garmin illimitées</li>
                  )}
                  <li>Accès complet aux workflows Adapt2Life et au support e-mail.</li>
                  {isStarterPlan ? <li>Crédits offerts une seule fois — aucune recharge mensuelle.</li> : null}
                </ul>
                <PlanCheckoutButtons planId={planId} price={price} disabled={isCurrentPlan} isAuthenticated={Boolean(stackUser)} />
                {isStarterPlan ? (
                  <p className="text-xs text-muted-foreground">Crédits Starter utilisables une seule fois.</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Quotas remis à zéro le 1<sup>er</sup> de chaque mois, quelle que soit la formule (mensuelle ou annuelle).
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </section>
    </main>
  );
}
