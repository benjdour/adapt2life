import { redirect } from "next/navigation";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!user || !canAccessAdminArea(user.id)) {
    redirect("/");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Espace Admin</CardTitle>
          <CardDescription>Outils internes réservés au staff Adapt2Life.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Bienvenue {user.displayName ?? user.primaryEmail ?? "Utilisateur"}.</p>
          <p>
            Cette page servira de hub pour les diagnostics, la vérification des synchronisations Garmin et les actions
            critiques (reset tokens, inspection des jobs, etc.).
          </p>
          <p>Contacte Benjamin pour ajouter de nouveaux modules ici.</p>
        </CardContent>
      </Card>
    </div>
  );
}
