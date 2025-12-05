import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";

import { stackServerApp } from "@/stack/server";
import { canAccessAdminArea } from "@/lib/accessControl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buildAiModelAdminSnapshot } from "@/lib/services/aiModelConfig";
import { AdminAiModelManager } from "@/components/AdminAiModelManager";
import { db } from "@/db";
import { garminTrainerJobs, users } from "@/db/schema";
import { AdminUserTable } from "@/components/AdminUserTable";
import { AdminGarminJobsTable } from "@/components/AdminGarminJobsTable";

export default async function AdminPage() {
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!user || !canAccessAdminArea(user.id)) {
    redirect("/");
  }

  const snapshot = await buildAiModelAdminSnapshot();
  const adminUsers = (
    await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        pseudo: users.pseudo,
        email: users.email,
        createdAt: users.createdAt,
        trainingGenerationsRemaining: users.trainingGenerationsRemaining,
        garminConversionsRemaining: users.garminConversionsRemaining,
        trainingGenerationsUsedMonth: users.trainingGenerationsUsedMonth,
        garminConversionsUsedMonth: users.garminConversionsUsedMonth,
        planType: users.planType,
      })
      .from(users)
      .orderBy(desc(users.createdAt))
  ).map((entry) => ({
    ...entry,
    createdAt: entry.createdAt?.toISOString() ?? null,
  }));

  const recentJobs = (
    await db
      .select({
        id: garminTrainerJobs.id,
        status: garminTrainerJobs.status,
        phase: garminTrainerJobs.phase,
        aiModelId: garminTrainerJobs.aiModelId,
        createdAt: garminTrainerJobs.createdAt,
        updatedAt: garminTrainerJobs.updatedAt,
        userEmail: users.email,
        error: garminTrainerJobs.error,
      })
      .from(garminTrainerJobs)
      .leftJoin(users, eq(garminTrainerJobs.userId, users.id))
      .orderBy(desc(garminTrainerJobs.updatedAt))
      .limit(20)
  ).map((entry) => ({
    ...entry,
    createdAt: entry.createdAt?.toISOString() ?? null,
    updatedAt: entry.updatedAt?.toISOString() ?? null,
  }));

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
          <AdminUserTable users={adminUsers} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Jobs Garmin Trainer</CardTitle>
          <CardDescription>Statut des 20 derniers jobs (phase, modèle IA, mise à jour).</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminGarminJobsTable jobs={recentJobs} />
        </CardContent>
      </Card>
    </div>
  );
}
