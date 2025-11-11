import { Metadata } from "next";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { garminWebhookEvents, users } from "@/db/schema";
import { stackServerApp } from "@/stack/server";

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

  const statusMessage = normalizeSearchParam(searchParams?.status) === "updated" ? "Profil mis à jour avec succès 🎉" : null;
  const computedAge = calculateAge(localUser.birthDate ?? null);
  const genderOptions = GENDER_OPTIONS;
  const sportLevelOptions = SPORT_LEVEL_OPTIONS;
  const storedWeightValue =
    localUser.weightKg !== null && localUser.weightKg !== undefined
      ? Number.parseFloat(String(localUser.weightKg))
      : null;
  let weightPrefillSource: "profile" | "garmin" | null = null;
  let weightPrefill =
    storedWeightValue !== null && Number.isFinite(storedWeightValue) ? storedWeightValue : null;
  if (weightPrefill !== null) {
    weightPrefillSource = "profile";
  } else {
    const garminWeight = await fetchLatestGarminWeightKg(localUser.id);
    if (garminWeight !== null) {
      weightPrefill = garminWeight;
      weightPrefillSource = "garmin";
    }
  }
  const weightInputDefault =
    weightPrefill !== null && Number.isFinite(weightPrefill) ? weightPrefill.toFixed(2) : "";
  const showGarminHint = weightPrefillSource === "garmin" && weightInputDefault !== "";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-white/60">Compte</p>
        <h1 className="text-3xl font-semibold">Informations utilisateur</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Consulte les informations essentielles associées à ton profil Adapt2Life et à ton compte Stack Auth.
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-wide text-white/60">Profil Adapt2Life</p>
          <p className="text-sm text-white/70">
            {localUser
              ? "Informations synchronisées avec la base de données interne."
              : "Complète le formulaire ci-dessous pour enregistrer ton profil Adapt2Life."}
          </p>
        </div>

        <form action={updateProfile} className="space-y-6 rounded-2xl border border-white/10 bg-black/30 p-6">
          {statusMessage ? (
            <p className="rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white">{statusMessage}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="pseudo" className="text-sm font-semibold text-white">
                Pseudo
              </label>
              <input
                id="pseudo"
                name="pseudo"
                type="text"
                defaultValue={localUser?.pseudo ?? ""}
                placeholder="Ex. IronRunner"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm font-semibold text-white">
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={localUser?.lastName ?? ""}
                placeholder="Ex. Dupont"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoComplete="family-name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm font-semibold text-white">
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={localUser?.firstName ?? ""}
                placeholder="Ex. Marie"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoComplete="given-name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-sm font-semibold text-white">
                Genre
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={localUser?.gender ?? ""}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <option value="">Sélectionne ton genre</option>
                {genderOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="birthDate" className="text-sm font-semibold text-white">
                Date de naissance
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={localUser?.birthDate ?? ""}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                autoComplete="bday"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="age" className="text-sm font-semibold text-white">
                Âge (calculé)
              </label>
              <input
                id="age"
                type="number"
                readOnly
                value={computedAge ?? ""}
                placeholder="Ex. 29"
                className="rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="heightCm" className="text-sm font-semibold text-white">
                Taille (cm)
              </label>
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                min="0"
                step="1"
                defaultValue={typeof localUser?.heightCm === "number" ? String(localUser.heightCm) : ""}
                placeholder="Ex. 172"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="weightKg" className="text-sm font-semibold text-white">
                Poids (kg)
              </label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                min="0"
                step="0.01"
                defaultValue={weightInputDefault}
                placeholder="Ex. 68.5"
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                inputMode="decimal"
              />
              {showGarminHint ? (
                <p className="text-xs text-white/60">Valeur suggérée d’après ta dernière mesure Garmin.</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="sportLevel" className="text-sm font-semibold text-white">
                Niveau sportif
              </label>
              <select
                id="sportLevel"
                name="sportLevel"
                defaultValue={localUser?.sportLevel ? String(localUser.sportLevel) : ""}
                className="rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              >
                <option value="">Sélectionne ton niveau</option>
                {sportLevelOptions.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {`${option.value} — ${option.label}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="trainingGoal" className="text-sm font-semibold text-white">
                Objectif sportif principal
              </label>
              <textarea
                id="trainingGoal"
                name="trainingGoal"
                defaultValue={localUser?.trainingGoal ?? ""}
                rows={3}
                placeholder="Ex. Terminer un marathon en moins de 4h, améliorer ma VO2max, préparer un triathlon sprint..."
                className="min-h-[96px] rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/50"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60"
            >
              Enregistrer le profil
            </button>
          </div>
        </form>

        {localUser ? null : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
      </div>
    </div>
  );
}
