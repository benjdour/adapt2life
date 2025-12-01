import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { USER_PLAN_CATALOG } from "@/lib/constants/userPlans";

const PUBLIC_PLAN_ORDER = ["free", "paid_light", "paid", "paid_full"] as const;

const PLAN_PRICING: Record<(typeof PUBLIC_PLAN_ORDER)[number], string> = {
  free: "Gratuit",
  paid_light: "5,99 $/mois",
  paid: "9,99 $/mois",
  paid_full: "14,99 $/mois",
};

const PLAN_CTA: Record<(typeof PUBLIC_PLAN_ORDER)[number], { label: string; href: string }> = {
  free: { label: "Commencer maintenant", href: "/handler/sign-in?redirect=/generateur-entrainement" },
  paid_light: { label: "Passer au plan Light", href: "/contact" },
  paid: { label: "Passer au plan Paid", href: "/contact" },
  paid_full: { label: "Parler à l’équipe", href: "/contact" },
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
          Chaque plan inclut les mêmes fonctionnalités. Seuls les quotas de générations quotidiennes et d’envois Garmin varient.
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
                <CardTitle className="flex items-center justify-between gap-3 text-2xl">
                  {plan.label}
                  <span className="text-sm font-semibold text-primary">{price}</span>
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6">
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
              </CardContent>
            </Card>
          );
        })}
      </section>

    </main>
  );
}
