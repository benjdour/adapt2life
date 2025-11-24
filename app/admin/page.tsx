import { redirect } from "next/navigation";

import { desc } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAiModelAdminSnapshot } from "@/lib/services/aiModelConfig";
import { AdminAiModelManager } from "@/components/AdminAiModelManager";
import { db } from "@/db";
import { users } from "@/db/schema";

export default async function AdminPage() {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!user || !canAccessAdminArea(user.id)) {
    redirect("/");
  }

  const snapshot = await buildAiModelAdminSnapshot();
  const adminUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      pseudo: users.pseudo,
      email: users.email,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

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

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>Liste des comptes Adapt2Life (nom, prénom, email).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Nom</th>
                  <th className="py-2 pr-4">Prénom</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Inscription</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((entry) => {
                  const lastName = entry.lastName ?? "";
                  const firstName = entry.firstName ?? entry.pseudo ?? "";
                  const createdLabel = entry.createdAt
                    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(entry.createdAt)
                    : "—";
                  return (
                    <tr key={entry.id} className="border-b border-white/5">
                      <td className="py-2 pr-4">{lastName || "—"}</td>
                      <td className="py-2 pr-4">{firstName || "—"}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{entry.email}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{createdLabel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {adminUsers.length === 0 ? <p className="py-4 text-muted-foreground">Aucun utilisateur pour le moment.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
