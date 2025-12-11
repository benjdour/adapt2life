import Link from "next/link";
import { StackHandler } from "@stackframe/stack";

import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Locale } from "@/lib/i18n/locales";
import { buildLocalePath, resolveLocale } from "@/lib/i18n/routing";

const HANDLER_COPY: Record<
  Locale,
  {
    tag: string;
    title: string;
    description: string;
    bulletPoints: string[];
    contact: string;
    contactLinkLabel: string;
    contactSuffix: string;
    cardTitle: string;
    cardDescription: string;
  }
> = {
  fr: {
    tag: "Adapt2Life",
    title: "Connecte-toi pour débloquer ton coach IA",
    description:
      "Accède à tes plans générés en temps réel, synchronise Garmin et suis ta progression sur une interface pensée pour les athlètes hybrides.",
    bulletPoints: [
      "• Authentification sécurisée",
      "• Synchronisation automatique avec Garmin Connect",
      "• Plans recalculés selon ton énergie, ton sommeil et tes contraintes",
    ],
    contact: "Besoin d’aide ?",
    contactLinkLabel: "Contacte-nous",
    contactSuffix: "en 1 clic.",
    cardTitle: "Connexion / Inscription",
    cardDescription: "Identifie-toi pour continuer vers l’espace sécurisé.",
  },
  en: {
    tag: "Adapt2Life",
    title: "Sign in to unlock your AI coach",
    description:
      "Access real-time workout plans, sync Garmin and monitor your progress with an interface built for hybrid athletes.",
    bulletPoints: [
      "• Secure authentication",
      "• Automatic sync with Garmin Connect",
      "• Plans adjusted to your energy, sleep and constraints",
    ],
    contact: "Need help?",
    contactLinkLabel: "Contact us",
    contactSuffix: "in one click.",
    cardTitle: "Sign in / Sign up",
    cardDescription: "Identify yourself to continue to the secure area.",
  },
};

type HandlerProps = {
  params: Promise<{ locale: string; stack: string[] }>;
  searchParams?: Promise<Record<string, string | string[]> | URLSearchParams>;
} & Record<string, unknown>;

export const dynamic = "force-dynamic";

export default async function Handler(props: HandlerProps) {
  const resolvedParams = await props.params;
  const rawSearchParams = (await props.searchParams) ?? {};
  const resolvedSearchParams =
    rawSearchParams instanceof URLSearchParams ? Object.fromEntries(rawSearchParams.entries()) : rawSearchParams;
  const locale = resolveLocale(resolvedParams.locale);
  const copy = HANDLER_COPY[locale];

  return (
    <main className="mx-auto flex h-full w-full max-w-5xl flex-col gap-10 px-6 py-12 text-foreground">
      <div className="flex flex-col gap-8 md:flex-row md:items-center">
        <section className="space-y-4 md:w-1/2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary/80">{copy.tag}</p>
          <h1 className="text-4xl font-heading md:text-5xl">{copy.title}</h1>
          <p className="text-base text-muted-foreground">{copy.description}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {copy.bulletPoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {copy.contact}{" "}
            <Link href={buildLocalePath(locale, "/contact")} className="underline">
              {copy.contactLinkLabel}
            </Link>{" "}
            {copy.contactSuffix}
          </p>
        </section>

        <Card className="md:w-1/2 border-white/10 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle>{copy.cardTitle}</CardTitle>
            <CardDescription>{copy.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <StackHandler
              fullPage={false}
              app={stackServerApp}
              params={resolvedParams}
              searchParams={resolvedSearchParams}
              routeProps={{ ...props, params: resolvedParams, searchParams: resolvedSearchParams }}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
