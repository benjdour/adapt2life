import { redirect } from "next/navigation";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAiModelAdminSnapshot } from "@/lib/services/aiModelConfig";
import { AdminAiModelManager } from "@/components/AdminAiModelManager";

export default async function AdminPage() {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!user || !canAccessAdminArea(user.id)) {
    redirect("/");
  }

  const snapshot = await buildAiModelAdminSnapshot();

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Espace Admin</CardTitle>
          <CardDescription>Outils internes réservés au staff Adapt2Life.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>Bienvenue {user.displayName ?? user.primaryEmail ?? "Utilisateur"}.</p>
          <p>Utilise les sélecteurs ci-dessous pour choisir les modèles IA utilisés par chaque fonctionnalité clé.</p>
          <p>Le changement est immédiat et s’applique à la prochaine requête utilisateur.</p>
        </CardContent>
      </Card>

      <AdminAiModelManager availableModels={snapshot.availableModels} features={snapshot.features} />
    </div>
  );
}
