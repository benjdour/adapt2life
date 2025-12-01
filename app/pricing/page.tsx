import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_PLAN_CATALOG } from "@/lib/constants/userPlans";

const PUBLIC_PLAN_ORDER = ["free", "paid_light", "paid", "paid_full"] as const;

const PLAN_PRICING: Record<
  (typeof PUBLIC_PLAN_ORDER)[number],
  {
    monthly: string;
    annual: string;
  }
> = {
  free: { monthly: "Gratuit", annual: "Gratuit" },
  paid_light: { monthly: "5,99 $/mois", annual: "59,99 $/an" },
  paid: { monthly: "9,99 $/mois", annual: "99,99 $/an" },
  paid_full: { monthly: "14,99 $/mois", annual: "149,99 $/an" },
};

const PLAN_CTA: Record<(typeof PUBLIC_PLAN_ORDER)[number], { label: string; href: string }> = {
  free: { label: "Commencer maintenant", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  paid_light: { label: "Passer au plan Paid Light", href: "/contact" },
  paid: { label: "Passer au plan Paid", href: "/contact" },
  paid_full: { label: "Passer au plan Paid Full", href: "/contact" },
};

export const metadata: Metadata = {
  title: "Tarifs Adapt2Life",
  description: "Compare les plans Adapt2Life et choisis le volume de générations et de conversions adapté à ta pratique.",
};

export default function PricingPage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <section className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary/80">Tarifs Adapt2Life</p>
        <h1 className="text-4xl font-heading leading-tight md:text-5xl">Choisis le volume qui suit ton entraînement</h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Chaque formule existe en version mensuelle ou annuelle (sans engagement), et les quotas se réinitialisent automatiquement le
          1er de chaque mois.
        </p>
        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/handler/sign-in?redirect=/generateur-entrainement">Tester gratuitement</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {PUBLIC_PLAN_ORDER.map((planId) => {
          const plan = USER_PLAN_CATALOG[planId];
          const price = PLAN_PRICING[planId];
          const cta = PLAN_CTA[planId];

          return (
            <Card key={planId} className="flex flex-col justify-between border-white/10 bg-card/80">
              <CardHeader>
                <CardTitle className="flex flex-col gap-1 text-2xl">
                  <span>{plan.label}</span>
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
                      <span className="font-semibold text-foreground">{plan.trainingQuota}</span> générations d’entraînements IA
                      mensuelles
                    </li>
                  ) : (
                    <li>Générations IA illimitées</li>
                  )}
                  {plan.conversionQuota !== null ? (
                    <li>
                      <span className="font-semibold text-foreground">{plan.conversionQuota}</span> conversions Garmin
                      automatisées
                    </li>
                  ) : (
                    <li>Conversions Garmin illimitées</li>
                  )}
                  <li>Accès complet aux workflows Adapt2Life et au support e-mail.</li>
                </ul>
                <Button asChild variant={planId === "free" ? "primary" : "outline"}>
                  <Link href={cta.href}>{cta.label}</Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Quotas remis à zéro le 1<sup>er</sup> de chaque mois, quelle que soit la formule (mensuelle ou annuelle).
                </p>
              </CardContent>
            </Card>
          );
        })}
      </section>

    </main>
  );
}
