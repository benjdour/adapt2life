import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainingGeneratorsSection } from "@/components/TrainingGeneratorsSection";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Coaching IA</p>
          <CardTitle>Générateur d’entraînement</CardTitle>
          <CardDescription>
            Décris ton objectif et tes contraintes : Adapt2Life te conçoit un plan personnalisé en quelques secondes. Plus tu donnes de
            contexte, plus la séance est pertinente.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Tu peux regénérer autant de fois que nécessaire, ajuster ton brief, puis convertir immédiatement le résultat en JSON prêt
            pour Garmin Training API V2.
          </p>
        </CardContent>
      </Card>

      <TrainingGeneratorsSection />

      <div className="mt-auto flex justify-end">
        <Button asChild variant="ghost">
          <Link href="/">Retour à l’accueil</Link>
        </Button>
      </div>
    </div>
  );
}
