import { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainingGeneratorsSection } from "@/components/TrainingGeneratorsSection";
import { stackServerApp } from "@/stack/server";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Adapt2Life — Générateur d’entraînement",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrainingGeneratorPage() {
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

      <TrainingGeneratorsSection />
    </div>
  );
}
