import { Metadata } from "next";
import { redirect } from "next/navigation";

import { TrainingGeneratorsDebugSection } from "@/components/TrainingGeneratorsDebugSection";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Adapt2Life — Générateur debug",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TrainingGeneratorDebugPage() {
  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/generateur-debug");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Coaching IA</p>
          <CardTitle>Générateur debug</CardTitle>
          <CardDescription>
            Version technique du générateur pour reproduire ou comparer les sorties. Les fonctionnalités sont identiques mais isolées
            pour les tests.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Utilise cette page pour rejouer rapidement différents prompts, vérifier les réponses du modèle ou capturer des logs avant
            de publier une modification.
          </p>
        </CardContent>
      </Card>

      <TrainingGeneratorsDebugSection />
    </div>
  );
}
