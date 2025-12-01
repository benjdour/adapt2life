import { Metadata } from "next";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

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
};

const GENDER_OPTIONS = [
  { value: "homme", label: "Homme" },
  { value: "femme", label: "Femme" },
  { value: "non-specifie", label: "Non spécifié" },
];

const SPORT_LEVEL_OPTIONS = [
  { value: 1, label: "Sédentaire", description: "Activité physique très faible, aucun entraînement régulier." },
  { value: 2, label: "Débutant absolu", description: "Commence tout juste une activité sportive, peu d’expérience." },
  { value: 3, label: "Débutant régulier", description: "Pratique légère 1 à 2 fois par semaine, encore en phase d’apprentissage." },
  { value: 4, label: "Loisir occasionnel", description: "Activité de loisir sans objectif particulier, rythme irrégulier." },
  { value: 5, label: "Loisir sérieux", description: "Pratique structurée 2 à 3 fois par semaine, objectifs personnels simples." },
  { value: 6, label: "Intermédiaire", description: "Bon niveau d’endurance, séances régulières avec planification basique." },
  { value: 7, label: "Avancé", description: "S’entraîne fréquemment avec planification, vise des performances mesurées." },
  { value: 8, label: "Expert", description: "Suit un programme exigeant avec encadrement ou suivi précis des données." },
  { value: 9, label: "Compétiteur élite amateur", description: "Participe à des compétitions de haut niveau, gros volume d’entraînement." },
  { value: 10, label: "Professionnel", description: "Athlète professionnel ou semi-pro avec calendrier compétitif intense." },
];

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
    redirect("/handler/sign-in?redirect=/secure/user-information");
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

  revalidatePath("/secure/user-information");
  redirect("/secure/user-information?status=updated");
}

export const metadata: Metadata = {
  title: "Adapt2Life — Informations utilisateur",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function UserInformationPage({ searchParams }: PageProps) {
  noStore();

  const stackUser = await stackServerApp.getUser({ or: "return-null", tokenStore: "nextjs-cookie" });

  if (!stackUser) {
    redirect("/handler/sign-in?redirect=/secure/user-information");
  }

  const [maybeLocalUser] = await db
    .select(userSelection)
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  const localUser = maybeLocalUser ?? (await ensureLocalUser(stackUser));

  const planConfig = getUserPlanConfig(localUser.planType);
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

  const statusMessage = normalizeSearchParam(searchParams?.status) === "updated" ? "Profil mis à jour avec succès 🎉" : null;
  const computedAge = calculateAge(localUser.birthDate ?? null);
  const genderOptions = GENDER_OPTIONS;
  const sportLevelOptions = SPORT_LEVEL_OPTIONS;
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
  const weightInputDefault =
    weightPrefill !== null && Number.isFinite(weightPrefill) ? weightPrefill.toFixed(2) : "";
  const showGarminHint = weightPrefillSource === "garmin" && weightInputDefault !== "";

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-12 text-foreground">
      <Card>
        <CardHeader>
          <p className="text-xs uppercase tracking-wide text-primary/80">Compte</p>
          <CardTitle>Informations utilisateur</CardTitle>
          <CardDescription>
            Consulte les informations associées à ton profil Adapt2Life et mets-les à jour pour personnaliser tes recommandations.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-card to-card">
        <CardHeader>
          <CardTitle>Abonnement & crédits</CardTitle>
          <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary">
              {planConfig.label}
            </span>
            <span className="text-foreground/80">{planConfig.description}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/pricing">Choisir un abonnement</Link>
            </Button>
            <ManageSubscriptionButton canManage={canManageSubscription} />
            <p className="text-xs text-muted-foreground">
              Les quotas mensuels se remettent à zéro le 1<sup>er</sup> de chaque mois.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Générations IA</p>
              {trainingCap === null || trainingUsed === null ? (
                <p className="text-3xl font-semibold text-primary">Illimité</p>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-primary">
                    {trainingUsed}
                    <span className="text-base font-medium text-muted-foreground"> / {trainingCap}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {trainingRemaining !== null && trainingRemaining > 0
                      ? `${trainingRemaining} séance${trainingRemaining > 1 ? "s" : ""} restantes`
                      : "Quota utilisé — contacte-nous pour prolonger l’accès"}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{ width: `${trainingUsagePercent}%` }}
                    />
                  </div>
                </>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-background/50 p-4">
              <p className="text-sm text-muted-foreground">Conversions Garmin</p>
              {conversionCap === null || conversionsUsed === null ? (
                <p className="text-3xl font-semibold text-secondary">Illimité</p>
              ) : (
                <>
                  <p className="text-3xl font-semibold text-secondary">
                    {conversionsUsed}
                    <span className="text-base font-medium text-muted-foreground"> / {conversionCap}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {conversionRemaining !== null && conversionRemaining > 0
                      ? `${conversionRemaining} conversion${conversionRemaining > 1 ? "s" : ""} restantes`
                      : "Quota utilisé — contacte-nous pour prolonger l’accès"}
                  </p>
                  <div className="mt-3 h-2 rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-secondary"
                      style={{ width: `${conversionUsagePercent}%` }}
                    />
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
            <CardTitle>Profil Adapt2Life</CardTitle>
            <CardDescription>
              {localUser
                ? "Informations synchronisées avec la base interne."
                : "Complète ce formulaire pour enregistrer ton profil Adapt2Life."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateProfile} className="space-y-6">
              {statusMessage ? (
                <p className="rounded-2xl border border-secondary/30 bg-secondary/10 px-4 py-2 text-sm text-secondary">
                  {statusMessage}
                </p>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="pseudo">Pseudo</Label>
                  <Input id="pseudo" name="pseudo" defaultValue={localUser?.pseudo ?? ""} placeholder="Ex. IronRunner" />
                </div>

                <div>
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    defaultValue={localUser?.lastName ?? ""}
                    placeholder="Ex. Dupont"
                    autoComplete="family-name"
                  />
                </div>

                <div>
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    defaultValue={localUser?.firstName ?? ""}
                    placeholder="Ex. Marie"
                    autoComplete="given-name"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Genre</Label>
                  <select
                    id="gender"
                    name="gender"
                    defaultValue={localUser?.gender ?? ""}
                    className="h-11 w-full rounded-md border border-white/10 bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  >
                    <option value="">Sélectionne ton genre</option>
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="birthDate">Date de naissance</Label>
                  <Input
                    id="birthDate"
                    name="birthDate"
                    type="date"
                    defaultValue={localUser?.birthDate ?? ""}
                    className="appearance-none text-left"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Âge (calculé)</Label>
                  <Input id="age" type="number" readOnly value={computedAge ?? ""} placeholder="Ex. 29" />
                </div>

                <div>
                  <Label htmlFor="heightCm">Taille (cm)</Label>
                  <Input
                    id="heightCm"
                    name="heightCm"
                    type="number"
                    min="0"
                    step="1"
                    defaultValue={typeof localUser?.heightCm === "number" ? String(localUser.heightCm) : ""}
                    placeholder="Ex. 172"
                  />
                </div>

                <div>
                  <Label htmlFor="weightKg">Poids (kg)</Label>
                  <Input
                    id="weightKg"
                    name="weightKg"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={weightInputDefault}
                    placeholder="Ex. 68.5"
                  />
                  {showGarminHint ? (
                    <p className="text-xs text-muted-foreground">Valeur suggérée d’après ta dernière mesure Garmin.</p>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="sportLevel">Niveau sportif</Label>
                  <select
                    id="sportLevel"
                    name="sportLevel"
                    defaultValue={localUser?.sportLevel ? String(localUser.sportLevel) : ""}
                    className="h-11 w-full rounded-md border border-white/10 bg-muted/30 px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/60"
                  >
                    <option value="">Sélectionne ton niveau</option>
                    {sportLevelOptions.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {`${option.value} — ${option.label}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="trainingGoal">Objectif sportif principal</Label>
                  <Textarea
                    id="trainingGoal"
                    name="trainingGoal"
                    defaultValue={localUser?.trainingGoal ?? ""}
                    rows={3}
                    placeholder="Ex. Terminer un marathon en moins de 4h, préparer un triathlon sprint..."
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit">Enregistrer le profil</Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </section>
    </div>
  );
}
