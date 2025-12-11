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
import { buildLocalePath, resolveLocaleFromParams } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";
import { BlogPostImportForm, BlogPostImportFormCopy } from "@/components/BlogPostImportForm";

const adminCopyByLocale = (locale: Locale) =>
  locale === "fr"
    ? {
        heroTitle: "Espace Admin",
        heroDescription: "Outils internes réservés au staff Adapt2Life.",
        welcome: "Bienvenue",
        fallbackUser: "Utilisateur",
        intro: [
          "Utilise les sélecteurs ci-dessous pour choisir les modèles IA utilisés par chaque fonctionnalité clé.",
          "Le changement est immédiat et s’applique à la prochaine requête utilisateur.",
        ],
        usersCard: {
          title: "Utilisateurs",
          description: "Liste des comptes Adapt2Life (nom, prénom, email).",
        },
        jobsCard: {
          title: "Jobs Garmin Trainer",
          description: "Statut des 20 derniers jobs (phase, modèle IA, mise à jour).",
        },
        blogImportCard: {
          title: "Importer un article de blog (Markdown)",
          description: "Ajoute un nouvel article en fournissant un fichier .md avec front matter YAML.",
          form: {
            helperText: "Le front matter doit inclure title, slug, excerpt et publishedAt.",
            fileLabel: "Fichier Markdown (.md)",
            imageLabel: "Image hero à uploader (optionnelle)",
            heroImageUrlLabel: "URL d’image hero déjà hébergée (optionnelle)",
            submitLabel: "Importer l’article",
            successMessage: "Article importé avec succès 🎉",
            errorMessage: "Impossible d’importer l’article. Vérifie les champs obligatoires.",
          } satisfies BlogPostImportFormCopy,
        },
      }
    : {
        heroTitle: "Admin area",
        heroDescription: "Internal tools reserved for the Adapt2Life staff.",
        welcome: "Welcome",
        fallbackUser: "User",
        intro: [
          "Use the selectors below to pick which AI models back each core feature.",
          "Changes apply instantly and affect the very next user request.",
        ],
        usersCard: {
          title: "Users",
          description: "List of Adapt2Life accounts (name, surname, email).",
        },
        jobsCard: {
          title: "Garmin Trainer jobs",
          description: "Status of the latest 20 jobs (phase, AI model, updated at).",
        },
        blogImportCard: {
          title: "Import a blog post (Markdown)",
          description: "Upload a .md file with YAML front matter to create a new article.",
          form: {
            helperText: "Front matter must include title, slug, excerpt, and publishedAt fields.",
            fileLabel: "Markdown file (.md)",
            imageLabel: "Hero image to upload (optional)",
            heroImageUrlLabel: "Existing hero image URL (optional)",
            submitLabel: "Import article",
            successMessage: "Blog post imported successfully 🎉",
            errorMessage: "Unable to import the article. Please check the required fields.",
          } satisfies BlogPostImportFormCopy,
        },
      };

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocaleFromParams(params);
  const copy = adminCopyByLocale(locale);
  const fallbackPath = buildLocalePath(locale, "/");
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });
  if (!user || !canAccessAdminArea(user.id)) {
    redirect(fallbackPath);
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
          <CardTitle>{copy.heroTitle}</CardTitle>
          <CardDescription>{copy.heroDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            {copy.welcome} {user.displayName ?? user.primaryEmail ?? copy.fallbackUser}.
          </p>
          {copy.intro.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </CardContent>
      </Card>

      <AdminAiModelManager availableModels={snapshot.availableModels} features={snapshot.features} locale={locale} />

      <Card>
        <CardHeader>
          <CardTitle>{copy.usersCard.title}</CardTitle>
          <CardDescription>{copy.usersCard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUserTable users={adminUsers} locale={locale} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.jobsCard.title}</CardTitle>
          <CardDescription>{copy.jobsCard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminGarminJobsTable jobs={recentJobs} locale={locale} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{copy.blogImportCard.title}</CardTitle>
          <CardDescription>{copy.blogImportCard.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <BlogPostImportForm copy={copy.blogImportCard.form} />
        </CardContent>
      </Card>
    </div>
  );
}
