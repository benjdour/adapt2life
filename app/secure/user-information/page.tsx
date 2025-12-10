import { Metadata } from "next";
import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReactNode } from "react";

import { db } from "@/db";
import { garminWebhookEvents, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DEFAULT_USER_PLAN, getUserPlanConfig } from "@/lib/constants/userPlans";
import { ManageSubscriptionButton } from "@/components/profile/ManageSubscriptionButton";
import { PlanDowngradeToast } from "@/components/profile/PlanDowngradeToast";
import { getRequestLocale } from "@/lib/i18n/request";
import { buildLocalePath } from "@/lib/i18n/routing";
import { Locale } from "@/lib/i18n/locales";

const userSelection = {
  id: users.id,
  name: users.name,
  email: users.email,
  pseudo: users.pseudo,
  firstName: users.firstName,
  lastName: users.lastName,
  gender: users.gender,
  birthDate: users.birthDate,
  sportLevel: users.sportLevel,
  heightCm: users.heightCm,
  weightKg: users.weightKg,
  trainingGoal: users.trainingGoal,
  createdAt: users.createdAt,
  trainingGenerationsRemaining: users.trainingGenerationsRemaining,
  garminConversionsRemaining: users.garminConversionsRemaining,
  planType: users.planType,
  stripeCustomerId: users.stripeCustomerId,
  stripeSubscriptionId: users.stripeSubscriptionId,
  stripePlanId: users.stripePlanId,
  planDowngradeAt: users.planDowngradeAt,
};

const WEIGHT_KG_PATHS: string[][] = [
  ["weightKg"],
  ["weightInKilograms"],
  ["bodyCompositions", "0", "weightKg"],
  ["bodyCompositions", "0", "weightInKilograms"],
  ["bodyComposition", "weightKg"],
  ["bodyComposition", "weightInKilograms"],
];

const WEIGHT_GRAM_PATHS: string[][] = [
  ["weightInGrams"],
  ["bodyCompositions", "0", "weightInGrams"],
  ["bodyCompositions", "0", "weight"],
  ["bodyComposition", "weightInGrams"],
  ["bodyComposition", "weight"],
  ["weight"],
];

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

const normalizeSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

const getNullableText = (value: FormDataEntryValue | null) => {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNumeric = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getNestedValue = (source: unknown, path: readonly string[]): unknown => {
  let current: unknown = source;
  for (const segment of path) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (Array.isArray(current)) {
      const index = Number.parseInt(segment, 10);
      if (Number.isNaN(index) || index < 0 || index >= current.length) {
        return undefined;
      }
      current = current[index];
      continue;
    }
    if (typeof current === "object") {
      current = (current as Record<string, unknown>)[segment];
      continue;
    }
    return undefined;
  }
  return current;
};

const pickNumberFromPaths = (source: unknown, paths: readonly string[][]): number | null => {
  for (const pathSegments of paths) {
    const value = getNestedValue(source, pathSegments);
    const numeric = toNumeric(value);
    if (numeric !== null) {
      return numeric;
    }
  }
  return null;
};

async function fetchLatestGarminWeightKg(userId: number): Promise<number | null> {
  const [event] = await db
    .select({
      payload: garminWebhookEvents.payload,
    })
    .from(garminWebhookEvents)
    .where(and(eq(garminWebhookEvents.userId, userId), eq(garminWebhookEvents.type, "bodyCompositions")))
    .orderBy(desc(garminWebhookEvents.createdAt))
    .limit(1);

  if (!event?.payload) {
    return null;
  }

  const payload = event.payload as Record<string, unknown>;

  const weightKg = pickNumberFromPaths(payload, WEIGHT_KG_PATHS);
  if (weightKg !== null) {
    return weightKg;
  }

  const weightGrams = pickNumberFromPaths(payload, WEIGHT_GRAM_PATHS);
  return weightGrams !== null ? weightGrams / 1000 : null;
}

const calculateAge = (value: string | null | undefined) => {
  if (!value || typeof value !== "string") {
    return null;
  }
  const [yearStr, monthStr, dayStr] = value.split("-");
  const year = Number.parseInt(yearStr ?? "", 10);
  const month = Number.parseInt(monthStr ?? "", 10);
  const day = Number.parseInt(dayStr ?? "", 10);
  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }
  const birthDate = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }
  const today = new Date();
  let age = today.getUTCFullYear() - birthDate.getUTCFullYear();
  const hasBirthdayPassed =
    today.getUTCMonth() > birthDate.getUTCMonth() ||
    (today.getUTCMonth() === birthDate.getUTCMonth() && today.getUTCDate() >= birthDate.getUTCDate());
  if (!hasBirthdayPassed) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};


async function ensureLocalUser(stackUser: NonNullable<Awaited<ReturnType<typeof stackServerApp.getUser>>>) {
  const [existingUser] = await db
    .select(userSelection)
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  if (existingUser) {
    return existingUser;
  }

  const [inserted] = await db
    .insert(users)
    .values({
      stackId: stackUser.id,
      name: stackUser.displayName ?? null,
      email: stackUser.primaryEmail ?? `user-${stackUser.id}@example.com`,
      pseudo: null,
      firstName: null,
      lastName: null,
      gender: null,
      birthDate: null,
      sportLevel: null,
      heightCm: null,
      weightKg: null,
      trainingGoal: null,
      planType: DEFAULT_USER_PLAN,
      trainingGenerationsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).trainingQuota ?? 0,
      garminConversionsRemaining: getUserPlanConfig(DEFAULT_USER_PLAN).conversionQuota ?? 0,
    })
    .returning(userSelection);

  if (!inserted) {
    throw new Error("Impossible de créer le profil utilisateur local.");
  }

  return inserted;
}

async function updateProfile(formData: FormData) {
  "use server";

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    const locale = await getRequestLocale();
    const signInPath = "/handler/sign-in";
    const profilePath = buildLocalePath(locale, "/secure/user-information");
    redirect(`${signInPath}?redirect=${encodeURIComponent(profilePath)}`);
  }

  const firstName = getNullableText(formData.get("firstName"));
  const lastName = getNullableText(formData.get("lastName"));
  const pseudo = getNullableText(formData.get("pseudo"));
  const trainingGoal = getNullableText(formData.get("trainingGoal"));
  const gender = getNullableText(formData.get("gender"));
  const birthDate = getNullableText(formData.get("birthDate"));

  const sportLevelRaw = formData.get("sportLevel");
  const parsedSportLevel =
    typeof sportLevelRaw === "string" && sportLevelRaw.length > 0 ? Number.parseInt(sportLevelRaw, 10) : null;
  const sportLevel =
    parsedSportLevel && !Number.isNaN(parsedSportLevel) && parsedSportLevel >= 1 && parsedSportLevel <= 10
      ? parsedSportLevel
      : null;
  const heightRaw = formData.get("heightCm");
  const parsedHeight =
    typeof heightRaw === "string" && heightRaw.length > 0 ? Number.parseInt(heightRaw, 10) : null;
  const heightCm = parsedHeight && !Number.isNaN(parsedHeight) && parsedHeight > 0 ? parsedHeight : null;
  const weightRaw = formData.get("weightKg");
  const parsedWeight =
    typeof weightRaw === "string" && weightRaw.length > 0 ? Number.parseFloat(weightRaw) : null;
  const weightKg =
    parsedWeight && !Number.isNaN(parsedWeight) && parsedWeight > 0 ? Number.parseFloat(parsedWeight.toFixed(2)) : null;

  const localUser = await ensureLocalUser(stackUser);

  const fullName =
    firstName || lastName ? [firstName, lastName].filter((part): part is string => Boolean(part)).join(" ") : null;

  await db
    .update(users)
    .set({
      name: fullName,
      firstName,
      lastName,
      pseudo,
      gender,
      birthDate,
      sportLevel,
      heightCm,
      weightKg: weightKg !== null ? weightKg.toFixed(2) : null,
      trainingGoal,
    })
    .where(eq(users.id, localUser.id));

  const locale = await getRequestLocale();
  const profilePath = buildLocalePath(locale, "/secure/user-information");
  revalidatePath(profilePath);
  redirect(`${profilePath}?status=updated`);
}

export const metadata: Metadata = {
  title: "Adapt2Life — Informations utilisateur",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

type GenderOption = { value: string; label: string };
type SportLevelOption = { value: number; label: string; description: string };

type Copy = {
  accountTag: string;
  accountTitle: string;
  accountDescription: string;
  subscriptionTitle: string;
  downgradeWarning: (date: string) => string;
  pickPlan: string;
  starterNote: string;
  quotaNote: ReactNode;
  trainingLabel: string;
  conversionLabel: string;
  unlimited: string;
  sessionsRemaining: (count: number) => string;
  conversionsRemaining: (count: number) => string;
  profileCardTitle: string;
  profileCardSynced: string;
  profileCardEmpty: string;
  firstNameLabel: string;
  lastNameLabel: string;
  pseudoLabel: string;
  genderLabel: string;
  birthDateLabel: string;
  sportLevelLabel: string;
  heightLabel: string;
  weightLabel: string;
  goalLabel: string;
  ageLabel: string;
  agePlaceholder: string;
  updateButton: string;
  weightHint: string;
  statusUpdated: string;
  genderPlaceholder: string;
  sportLevelPlaceholder: string;
  pseudoPlaceholder: string;
  lastNamePlaceholder: string;
  firstNamePlaceholder: string;
  heightPlaceholder: string;
  weightPlaceholder: string;
  goalPlaceholder: string;
  genderOptions: GenderOption[];
  sportLevelOptions: SportLevelOption[];
};

const copyByLocale = {
  fr: {
    accountTag: "Compte",
    accountTitle: "Informations utilisateur",
    accountDescription:
      "Consulte les informations associées à ton profil Adapt2Life et mets-les à jour pour personnaliser tes recommandations.",
    subscriptionTitle: "Abonnement & crédits",
    downgradeWarning: (date: string) =>
      `Ton abonnement restera actif jusqu’au ${date}. Tu repasseras automatiquement sur Starter lors de la prochaine remise à zéro des quotas.`,
    pickPlan: "Choisir un abonnement",
    starterNote: "Crédits Starter utilisables une seule fois — aucune recharge mensuelle.",
    quotaNote: (
      <>
        Les quotas mensuels se remettent à zéro le 1<sup>er</sup> de chaque mois.
      </>
    ),
    trainingLabel: "Générations IA",
    conversionLabel: "Conversions Garmin",
    unlimited: "Illimité",
    sessionsRemaining: (count: number) =>
      count > 0 ? `${count} séance${count > 1 ? "s" : ""} restantes` : "Quota utilisé — contacte-nous pour prolonger l’accès",
    conversionsRemaining: (count: number) =>
      count > 0 ? `${count} conversion${count > 1 ? "s" : ""} restantes` : "Quota utilisé — contacte-nous pour prolonger l’accès",
    profileCardTitle: "Profil Adapt2Life",
    profileCardSynced: "Informations synchronisées avec la base interne.",
    profileCardEmpty: "Complète ce formulaire pour enregistrer ton profil Adapt2Life.",
    firstNameLabel: "Prénom",
    lastNameLabel: "Nom",
    pseudoLabel: "Pseudo (optionnel)",
    genderLabel: "Genre",
    birthDateLabel: "Date de naissance",
    sportLevelLabel: "Niveau sportif",
    heightLabel: "Taille (cm)",
    weightLabel: "Poids (kg)",
    goalLabel: "Objectif principal",
    ageLabel: "Âge (calculé)",
    agePlaceholder: "Ex. 29",
    updateButton: "Mettre à jour le profil",
    weightHint: "Valeur suggérée d’après ta dernière mesure Garmin.",
    statusUpdated: "Profil mis à jour avec succès 🎉",
    genderPlaceholder: "Sélectionne ton genre",
    sportLevelPlaceholder: "Sélectionne ton niveau",
    pseudoPlaceholder: "Ex. IronRunner",
    lastNamePlaceholder: "Ex. Dupont",
    firstNamePlaceholder: "Ex. Marie",
    heightPlaceholder: "Ex. 172",
    weightPlaceholder: "Ex. 68.5",
    goalPlaceholder: "Ex. Terminer un marathon en moins de 4h, préparer un triathlon sprint...",
    genderOptions: [
      { value: "homme", label: "Homme" },
      { value: "femme", label: "Femme" },
      { value: "non-specifie", label: "Non spécifié" },
    ],
    sportLevelOptions: [
      { value: 1, label: "Sédentaire", description: "Activité physique très faible, aucun entraînement régulier." },
      { value: 2, label: "Débutant absolu", description: "Commence tout juste une activité sportive, peu d’expérience." },
      {
        value: 3,
        label: "Débutant régulier",
        description: "Pratique légère 1 à 2 fois par semaine, encore en phase d’apprentissage.",
      },
      { value: 4, label: "Loisir occasionnel", description: "Activité de loisir sans objectif particulier, rythme irrégulier." },
      { value: 5, label: "Loisir sérieux", description: "Pratique structurée 2 à 3 fois par semaine, objectifs personnels simples." },
      { value: 6, label: "Intermédiaire", description: "Bon niveau d’endurance, séances régulières avec planification basique." },
      { value: 7, label: "Avancé", description: "S’entraîne fréquemment avec planification, vise des performances mesurées." },
      { value: 8, label: "Expert", description: "Suit un programme exigeant avec encadrement ou suivi précis des données." },
      {
        value: 9,
        label: "Compétiteur élite amateur",
        description: "Participe à des compétitions de haut niveau, gros volume d’entraînement.",
      },
      { value: 10, label: "Professionnel", description: "Athlète professionnel ou semi-pro avec calendrier compétitif intense." },
    ],
  },
  en: {
    accountTag: "Account",
    accountTitle: "User information",
    accountDescription: "Review and edit your Adapt2Life profile to personalize recommendations.",
    subscriptionTitle: "Plan & credits",
    downgradeWarning: (date: string) =>
      `Your subscription stays active until ${date}. You’ll automatically return to Starter when quotas reset.`,
    pickPlan: "Choose a plan",
    starterNote: "Starter credits can be used once — no monthly refill.",
    quotaNote: (
      <>
        Monthly quotas reset on the 1<sup>st</sup> of every month.
      </>
    ),
    trainingLabel: "AI generations",
    conversionLabel: "Garmin conversions",
    unlimited: "Unlimited",
    sessionsRemaining: (count: number) =>
      count > 0 ? `${count} session${count > 1 ? "s" : ""} left` : "Quota used — contact us to extend access",
    conversionsRemaining: (count: number) =>
      count > 0 ? `${count} conversion${count > 1 ? "s" : ""} left` : "Quota used — contact us to extend access",
    profileCardTitle: "Adapt2Life profile",
    profileCardSynced: "Information synced with the internal database.",
    profileCardEmpty: "Complete this form to save your Adapt2Life profile.",
    firstNameLabel: "First name",
    lastNameLabel: "Last name",
    pseudoLabel: "Handle (optional)",
    genderLabel: "Gender",
    birthDateLabel: "Date of birth",
    sportLevelLabel: "Sport level",
    heightLabel: "Height (cm)",
    weightLabel: "Weight (kg)",
    goalLabel: "Primary goal",
    ageLabel: "Age (calculated)",
    agePlaceholder: "e.g. 29",
    updateButton: "Save profile",
    weightHint: "Suggested from your latest Garmin measurement.",
    statusUpdated: "Profile updated successfully 🎉",
    genderPlaceholder: "Select your gender",
    sportLevelPlaceholder: "Select your level",
    pseudoPlaceholder: "e.g. IronRunner",
    lastNamePlaceholder: "e.g. Smith",
    firstNamePlaceholder: "e.g. Anna",
    heightPlaceholder: "e.g. 172",
    weightPlaceholder: "e.g. 68.5",
    goalPlaceholder: "e.g. Finish a marathon under 4h, prepare a sprint triathlon…",
    genderOptions: [
      { value: "homme", label: "Male" },
      { value: "femme", label: "Female" },
      { value: "non-specifie", label: "Unspecified" },
    ],
    sportLevelOptions: [
      { value: 1, label: "Sedentary", description: "Very little activity, no regular training plan." },
      { value: 2, label: "Absolute beginner", description: "Just starting to move, nearly no experience." },
      {
        value: 3,
        label: "Regular beginner",
        description: "Light practice 1–2 times per week, still learning.",
      },
      { value: 4, label: "Casual leisure", description: "Occasional workouts without a structured goal." },
      { value: 5, label: "Serious leisure", description: "Structured 2–3 sessions per week with simple objectives." },
      { value: 6, label: "Intermediate", description: "Solid endurance base with basic planning." },
      { value: 7, label: "Advanced", description: "Trains frequently with a program and measured performance." },
      { value: 8, label: "Expert", description: "Follows a demanding program with close data monitoring." },
      {
        value: 9,
        label: "Elite amateur",
        description: "Competes at a high level with significant training volume.",
      },
      { value: 10, label: "Professional", description: "Pro or semi-pro athlete with an intense race calendar." },
    ],
  },
} satisfies Record<Locale, Copy>;

export default async function UserInformationPage({ searchParams }: PageProps) {
  const locale = await getRequestLocale();
  const copy = copyByLocale[locale];
  const signInPath = "/handler/sign-in";
  const profilePath = buildLocalePath(locale, "/secure/user-information");

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect(`${signInPath}?redirect=${encodeURIComponent(profilePath)}`);
  }

  const [maybeLocalUser] = await db
    .select(userSelection)
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  const localUser = maybeLocalUser ?? (await ensureLocalUser(stackUser));

  const planConfig = getUserPlanConfig(localUser.planType);
  const planDowngradeAtDate =
    localUser.planDowngradeAt instanceof Date
      ? localUser.planDowngradeAt
      : localUser.planDowngradeAt
        ? new Date(localUser.planDowngradeAt)
        : null;
  const nowIso = new Date().toISOString();
  const hasScheduledDowngrade =
    Boolean(planDowngradeAtDate) && planDowngradeAtDate && planDowngradeAtDate.toISOString() > nowIso;
  const dateFormatter = new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const planDowngradeLabel = planDowngradeAtDate ? dateFormatter.format(planDowngradeAtDate) : null;
  const downgradeNotice = hasScheduledDowngrade && planDowngradeLabel ? copy.downgradeWarning(planDowngradeLabel) : null;
  const isStarterPlan = planConfig.id === "free";
  const canManageSubscription = Boolean(localUser.stripeCustomerId);
  const trainingCap = planConfig.trainingQuota;
  const conversionCap = planConfig.conversionQuota;
  const trainingRemaining =
    trainingCap === null ? null : Number(localUser.trainingGenerationsRemaining ?? trainingCap);
  const conversionRemaining =
    conversionCap === null ? null : Number(localUser.garminConversionsRemaining ?? conversionCap);
  const trainingUsed =
    trainingCap === null || trainingRemaining === null ? null : Math.max(0, trainingCap - trainingRemaining);
  const conversionsUsed =
    conversionCap === null || conversionRemaining === null ? null : Math.max(0, conversionCap - conversionRemaining);
  const trainingUsagePercent =
    trainingCap && trainingCap > 0 && trainingUsed !== null ? Math.min(100, Math.round((trainingUsed / trainingCap) * 100)) : 0;
  const conversionUsagePercent =
    conversionCap && conversionCap > 0 && conversionsUsed !== null
      ? Math.min(100, Math.round((conversionsUsed / conversionCap) * 100))
      : 0;

  const statusMessage = normalizeSearchParam(searchParams?.status) === "updated" ? copy.statusUpdated : null;
  const computedAge = calculateAge(localUser.birthDate ?? null);
  const genderOptions = copy.genderOptions;
  const sportLevelOptions = copy.sportLevelOptions;
  const storedWeightValue =
    localUser.weightKg !== null && localUser.weightKg !== undefined
      ? Number.parseFloat(String(localUser.weightKg))
      : null;

  const latestGarminWeight = await fetchLatestGarminWeightKg(localUser.id);

  let weightPrefillSource: "profile" | "garmin" | null = null;
  let weightPrefill: number | null = null;

  if (latestGarminWeight !== null && Number.isFinite(latestGarminWeight)) {
    weightPrefill = latestGarminWeight;
    weightPrefillSource = "garmin";
  } else if (storedWeightValue !== null && Number.isFinite(storedWeightValue)) {
    weightPrefill = storedWeightValue;
    weightPrefillSource = "profile";
  }
  const weightInputDefault = weightPrefill !== null && Number.isFinite(weightPrefill) ? weightPrefill.toFixed(2) : "";
  const showGarminHint = weightPrefillSource === "garmin" && weightInputDefault !== "";

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <PlanDowngradeToast downgradeAt={planDowngradeAtDate ? planDowngradeAtDate.toISOString() : null} />
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">{copy.accountTag}</p>
          <CardTitle>{copy.accountTitle}</CardTitle>
          <CardDescription>{copy.accountDescription}</CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader>
          <CardTitle>{copy.subscriptionTitle}</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              {planConfig.label}
            </span>
            <span className="text-foreground/80">{planConfig.description}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {downgradeNotice ? (
            <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
              {downgradeNotice}
            </div>
          ) : null}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href={buildLocalePath(locale, "/pricing")}>{copy.pickPlan}</Link>
            </Button>
            <ManageSubscriptionButton canManage={canManageSubscription} />
            <p className="text-xs text-muted-foreground">{isStarterPlan ? copy.starterNote : copy.quotaNote}</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">{copy.trainingLabel}</p>
              {trainingCap === null || trainingUsed === null ? (
                <p className="text-3xl font-semibold text-primary">{copy.unlimited}</p>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-primary">
                    {trainingUsed}
                    <span className="text-base font-medium text-muted-foreground"> / {trainingCap}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trainingRemaining !== null && trainingRemaining > 0
                      ? copy.sessionsRemaining(trainingRemaining)
                      : copy.sessionsRemaining(0)}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${trainingUsagePercent}%` }} />
                  </div>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">{copy.conversionLabel}</p>
              {conversionCap === null || conversionsUsed === null ? (
                <p className="text-3xl font-semibold text-secondary">{copy.unlimited}</p>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-secondary">
                    {conversionsUsed}
                    <span className="text-base font-medium text-muted-foreground"> / {conversionCap}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conversionRemaining !== null && conversionRemaining > 0
                      ? copy.conversionsRemaining(conversionRemaining)
                      : copy.conversionsRemaining(0)}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-secondary" style={{ width: `${conversionUsagePercent}%` }} />
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <section className="space-y-6">
        <Card className="bg-card/80">
          <CardHeader>
            <CardTitle>{copy.profileCardTitle}</CardTitle>
            <CardDescription>{localUser ? copy.profileCardSynced : copy.profileCardEmpty}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-6">
              {statusMessage ? (
                <p className="rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">{statusMessage}</p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="pseudo">{copy.pseudoLabel}</Label>
                  <Input id="pseudo" name="pseudo" defaultValue={localUser?.pseudo ?? ""} placeholder={copy.pseudoPlaceholder} />
                </div>

                <div>
                  <Label htmlFor="lastName">{copy.lastNameLabel}</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={localUser?.lastName ?? ""}
                    placeholder={copy.lastNamePlaceholder}
                    autoComplete="family-name"
                  />
                </div>

                <div>
                  <Label htmlFor="firstName">{copy.firstNameLabel}</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={localUser?.firstName ?? ""}
                    placeholder={copy.firstNamePlaceholder}
                    autoComplete="given-name"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">{copy.genderLabel}</Label>
                  <select
                    id="gender"
                    name="gender"
                    defaultValue={localUser?.gender ?? ""}
                    className="h-11 w-full rounded-md border border-white/10 bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <option value="">{copy.genderPlaceholder}</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="birthDate">{copy.birthDateLabel}</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={localUser?.birthDate ?? ""}
                    className="appearance-none text-left"
                  />
                </div>

                <div>
                  <Label htmlFor="age">{copy.ageLabel}</Label>
                  <Input id="age" type="number" readOnly value={computedAge ?? ""} placeholder={copy.agePlaceholder} />
                </div>

                <div>
                  <Label htmlFor="heightCm">{copy.heightLabel}</Label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={typeof localUser?.heightCm === "number" ? String(localUser.heightCm) : ""}
                    placeholder={copy.heightPlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="weightKg">{copy.weightLabel}</Label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={weightInputDefault}
                    placeholder={copy.weightPlaceholder}
                  />
                  {showGarminHint ? <p className="text-xs text-muted-foreground">{copy.weightHint}</p> : null}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="sportLevel">{copy.sportLevelLabel}</Label>
                  <select
                    id="sportLevel"
                    name="sportLevel"
                    defaultValue={localUser?.sportLevel ? String(localUser.sportLevel) : ""}
                    className="h-11 w-full rounded-md border border-white/10 bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                  >
                    <option value="">{copy.sportLevelPlaceholder}</option>
                    {sportLevelOptions.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {`${option.value} — ${option.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="trainingGoal">{copy.goalLabel}</Label>
                  <Textarea
                    id="trainingGoal"
                    name="trainingGoal"
                    defaultValue={localUser?.trainingGoal ?? ""}
                    rows={3}
                    placeholder={copy.goalPlaceholder}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">{copy.updateButton}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
