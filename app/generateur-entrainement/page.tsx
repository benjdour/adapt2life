import { Suspense } from "react";
import { redirect } from "next/navigation";

import { TrainingGeneratorsSection } from "@/components/TrainingGeneratorsSection";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasStackSessionCookie } from "@/lib/stack/sessionCookies";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

type GeneratorPageCopy = {
  metadataTitle: string;
  tag: string;
  title: string;
  description: string;
};

const copyByLocale: Record<Locale, GeneratorPageCopy> = {
  fr: {
    metadataTitle: "Adapt2Life — Générateur d’entraînement",
    tag: "Coaching IA",
    title: "Générateur d’entraînement",
    description:
      "Décris ton objectif et tes contraintes : Adapt2Life te conçoit un plan personnalisé en quelques secondes. Plus tu donnes de contexte, plus la séance est pertinente.",
  },
  en: {
    metadataTitle: "Adapt2Life — Training generator",
    tag: "AI coaching",
    title: "Workout generator",
    description:
      "Describe your goal and constraints: Adapt2Life crafts a personalized session in seconds. The more context you give, the more relevant the workout becomes.",
  },
};

export async function generateMetadata() {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale] ?? copyByLocale.fr;
  return {
    title: copy.metadataTitle,
  };
}

function TrainingGeneratorSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-card/50 p-6 shadow-sm">
      <div className="mb-4 h-4 w-28 animate-pulse rounded-full bg-foreground/10" />
      <div className="mb-2 h-6 w-1/3 animate-pulse rounded-full bg-foreground/10" />
      <div className="h-24 w-full animate-pulse rounded-xl bg-foreground/5" />
    </div>
  );
}

export default async function TrainingGeneratorPage() {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale] ?? copyByLocale.fr;
  const signInPath = buildLocalePath(locale, "/handler/sign-in");
  const generatorPath = buildLocalePath(locale, "/generateur-entrainement");
  if (!(await hasStackSessionCookie())) {
    redirect(`${signInPath}?redirect=${encodeURIComponent(generatorPath)}`);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">{copy.tag}</p>
          <CardTitle>{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<TrainingGeneratorSkeleton />}>
        <TrainingGeneratorsSection locale={locale} />
      </Suspense>
    </div>
  );
}
