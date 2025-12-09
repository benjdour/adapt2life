import Link from "next/link";
import { StackHandler } from "@stackframe/stack";

import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

type HandlerCopy = {
  brandLabel: string;
  heroTitle: string;
  heroDescription: string;
  bullets: string[];
  contactLabel: string;
  authCardTitle: string;
  authCardDescription: string;
};

const copyByLocale: Record<Locale, HandlerCopy> = {
  fr: {
    brandLabel: "Adapt2Life",
    heroTitle: "Connecte-toi pour débloquer ton coach IA",
    heroDescription:
      "Accède à tes plans générés en temps réel, synchronise Garmin et suis ta progression sur une interface pensée pour les athlètes hybrides.",
    bullets: [
      "• Authentification sécurisée",
      "• Synchronisation automatique avec Garmin Connect",
      "• Plans recalculés selon ton énergie, ton sommeil et tes contraintes",
    ],
    contactLabel: "Besoin d’aide ?",
    authCardTitle: "Connexion / Inscription",
    authCardDescription: "Identifie-toi pour continuer vers l’espace sécurisé.",
  },
  en: {
    brandLabel: "Adapt2Life",
    heroTitle: "Sign in to unlock your AI coach",
    heroDescription:
      "Access real-time generated plans, sync with Garmin and follow your progress in an experience built for hybrid athletes.",
    bullets: [
      "• Secure authentication",
      "• Automatic sync with Garmin Connect",
      "• Plans recalculated based on energy, sleep and constraints",
    ],
    contactLabel: "Need help?",
    authCardTitle: "Sign in / Register",
    authCardDescription: "Authenticate to continue to the secure area.",
  },
};

export default async function Handler(props: unknown) {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  const contactHref = buildLocalePath(locale, "/contact");
  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <section className="space-y-4 md:w-1/2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.brandLabel}</p>
          <h1 className="text-4xl font-heading md:text-5xl">{copy.heroTitle}</h1>
          <p className="text-base text-muted-foreground">{copy.heroDescription}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {copy.contactLabel}{" "}
            <Link href={contactHref} className="underline">
              Contacte-nous
            </Link>{" "}
            en 1 clic.
          </p>
        </section>

        <Card className="md:w-1/2 border-white/10 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle>{copy.authCardTitle}</CardTitle>
            <CardDescription>{copy.authCardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <StackHandler fullPage={false} app={stackServerApp} routeProps={props} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
