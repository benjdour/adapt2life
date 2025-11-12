import Link from "next/link";
import { StackHandler } from "@stackframe/stack";

import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Handler(props: unknown) {
  return (
    <main className="bg-background px-4 py-10 text-foreground md:px-6">
      <div className="mx-auto mt-2 flex min-h-[calc(100vh-150px)] w-full max-w-5xl flex-col gap-8 md:flex-row md:items-center">
        <section className="space-y-4 md:w-1/2">
          <p className="text-sm uppercase tracking-[0.3em] text-primary">Adapt2Life</p>
          <h1 className="text-4xl font-heading md:text-5xl">Connecte-toi pour débloquer ton coach IA</h1>
          <p className="text-base text-muted-foreground">
            Accède à tes plans générés en temps réel, synchronise Garmin et suis ta progression sur une interface pensée pour les
            athlètes hybrides.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Authentification sécurisée via Stack Auth</li>
            <li>• Synchronisation automatique avec Garmin Connect</li>
            <li>• Plans recalculés selon ton énergie, ton sommeil et tes contraintes</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Besoin d’aide ? <Link href="/contact" className="underline">Contacte-nous</Link> en 1 clic.
          </p>
        </section>

        <Card className="md:w-1/2 border-white/10 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle>Connexion / Inscription</CardTitle>
            <CardDescription>Identifie-toi pour continuer vers l’espace sécurisé.</CardDescription>
          </CardHeader>
          <CardContent>
            <StackHandler fullPage={false} app={stackServerApp} routeProps={props} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
