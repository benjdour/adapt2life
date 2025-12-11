import { Metadata } from "next";
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
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";
import { BlogPostImportForm, BlogPostImportFormCopy } from "@/components/BlogPostImportForm";

type AdminCopy = {
  metadataTitle: string;
  heroTitle: string;
  heroDescription: string;
  welcome: (name: string) => string;
  introParagraphs: string[];
  usersCard: {
    title: string;
    description: string;
  };
  jobsCard: {
    title: string;
    description: string;
  };
  fallbackUserName: string;
  blogImportCard: {
    title: string;
    description: string;
    form: BlogPostImportFormCopy;
  };
};

const copyByLocale: Record<Locale, AdminCopy> = {
  fr: {
    metadataTitle: "Espace Admin — Adapt2Life",
    heroTitle: "Espace Admin",
    heroDescription: "Outils internes réservés au staff Adapt2Life.",
    welcome: (name) => `Bienvenue ${name}.`,
    introParagraphs: [
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
    fallbackUserName: "Utilisateur",
    blogImportCard: {
      title: "Importer un article de blog (Markdown)",
      description: "Ajoute un nouvel article en fournissant un fichier .md avec front matter YAML.",
      form: {
        helperText: "Le fichier doit contenir les champs title, slug, excerpt, publishedAt dans le front matter.",
        fileLabel: "Fichier Markdown (.md)",
        filenameHint: "Nomme le fichier avec le suffixe .fr.md ou .en.md (ex : mon-article.fr.md, my-article.en.md) pour indiquer la langue.",
        imageLabel: "Image hero à uploader (optionnelle)",
        heroImageUrlLabel: "URL d’image hero déjà hébergée (optionnelle)",
        submitLabel: "Importer l’article",
        successMessage: "Article importé avec succès 🎉",
        errorMessage: "Impossible d’importer l’article. Vérifie les champs obligatoires.",
      },
    },
  },
  en: {
    metadataTitle: "Admin Area — Adapt2Life",
    heroTitle: "Admin area",
    heroDescription: "Internal tooling reserved for the Adapt2Life staff.",
    welcome: (name) => `Welcome ${name}.`,
    introParagraphs: [
      "Use the selectors below to pick which AI models back each core feature.",
      "Changes apply instantly and affect the very next user request.",
    ],
    usersCard: {
      title: "Users",
      description: "List of Adapt2Life accounts (name, surname, email).",
    },
    jobsCard: {
      title: "Garmin Trainer jobs",
      description: "Status of the 20 latest jobs (phase, AI model, updated at).",
    },
    fallbackUserName: "User",
    blogImportCard: {
      title: "Import a blog post (Markdown)",
      description: "Upload a .md file with YAML front matter to create a new blog article.",
      form: {
        helperText: "Front matter must include title, slug, excerpt, and publishedAt fields.",
        fileLabel: "Markdown file (.md)",
        filenameHint: "Name your file with .fr.md or .en.md (e.g., article.fr.md, article.en.md) to set the language.",
        imageLabel: "Hero image to upload (optional)",
        heroImageUrlLabel: "Existing hero image URL (optional)",
        submitLabel: "Import article",
        successMessage: "Blog post imported successfully 🎉",
        errorMessage: "Unable to import the article. Please check the required fields.",
      },
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  return {
    title: copy.metadataTitle,
  };
}

export default async function AdminPage() {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  const homePath = buildLocalePath(locale, "/");
  const user = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!user || !canAccessAdminArea(user.id)) {
    redirect(homePath);
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
          <p>{copy.welcome(user.displayName ?? user.primaryEmail ?? copy.fallbackUserName)}</p>
          {copy.introParagraphs.map((paragraph) => (
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
