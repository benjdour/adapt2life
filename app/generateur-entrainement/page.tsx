import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { TrainingGeneratorsSection } from "@/components/TrainingGeneratorsSection";
import { stackServerApp } from "@/stack/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasStackSessionCookie } from "@/lib/stack/sessionCookies";

export const metadata: Metadata = {
  title: "Adapt2Life — Générateur d’entraînement",
};

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
  if (!(await hasStackSessionCookie())) {
    redirect("/handler/sign-in?redirect=/generateur-entrainement");
  }

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/generateur-entrainement");
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">Coaching IA</p>
          <CardTitle>Générateur d’entraînement</CardTitle>
          <CardDescription>
            Décris ton objectif et tes contraintes : Adapt2Life te conçoit un plan personnalisé en quelques secondes. Plus tu donnes de
            contexte, plus la séance est pertinente.
          </CardDescription>
        </CardHeader>
      </Card>

      <Suspense fallback={<TrainingGeneratorSkeleton />}>
        <TrainingGeneratorsSection />
      </Suspense>
    </div>
  );
}
