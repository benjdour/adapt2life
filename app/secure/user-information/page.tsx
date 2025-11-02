import { Metadata } from "next";
import { revalidatePath, unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { users } from "@/db/schema";
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
  createdAt: users.createdAt,
};

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

  const [localUser] = await db
    .select(userSelection)
    .from(users)
    .where(eq(users.stackId, stackUser.id))
    .limit(1);

  const primaryEmail = stackUser.primaryEmail ?? localUser?.email ?? "Email non renseigné";
  const signedUpAt =
    stackUser.signedUpAt instanceof Date ? stackUser.signedUpAt : stackUser.signedUpAt ? new Date(stackUser.signedUpAt) : null;
  const statusMessage = normalizeSearchParam(searchParams?.status) === "updated" ? "Profil mis à jour avec succès 🎉" : null;
  const computedAge = calculateAge(localUser?.birthDate ?? null);
  const formattedAge = computedAge !== null ? `${computedAge} ans` : null;
  const genderOptions = [
    { value: "homme", label: "Homme" },
    { value: "femme", label: "Femme" },
    { value: "non-specifie", label: "Non spécifié" },
  ];
  const sportLevelOptions = [
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
  const sportLevelLabel = (level: number | null | undefined) => {
    if (typeof level !== "number") {
      return null;
    }
    const match = sportLevelOptions.find((option) => option.value === level);
    return match ? `${level} — ${match.label}` : String(level);
  };
  const genderLabel = (value: string | null | undefined) => {
    if (!value) {
      return null;
    }
    const match = genderOptions.find((option) => option.value === value);
    if (match) {
      return match.label;
    }
    const legacyLabels: Record<string, string> = {
      "non-binaire": "Non binaire",
      "transgenre": "Transgenre",
      "prefere-ne-pas-dire": "Préfère ne pas répondre",
      autre: "Autre",
    };
    return legacyLabels[value] ?? value;
  };
  const formatHeight = (value: number | null | undefined) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return null;
    }
    return `${value} cm`;
  };
const formatWeight = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) {
    return null;
  }
  const numeric =
      typeof value === "string"
        ? Number.parseFloat(value)
        : typeof value === "number"
        ? value
        : Number.NaN;
    if (Number.isNaN(numeric)) {
      return null;
    }
  const hasDecimals = Math.abs(numeric % 1) > Number.EPSILON;
  return `${numeric.toLocaleString("fr-FR", {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })} kg`;
};
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
const formatAge = (value: string | null | undefined) => {
  const age = calculateAge(value);
  if (age === null) {
    return null;
  }
  return `${age} ans`;
};

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col gap-10 px-6 py-12 text-white">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-emerald-400">Compte</p>
        <h1 className="text-3xl font-semibold">Informations utilisateur</h1>
        <p className="max-w-2xl text-sm text-white/70">
          Consulte les informations essentielles associées à ton profil Adapt2Life et à ton compte Stack Auth.
        </p>
      </header>

      <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-xl backdrop-blur">
        <div className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-white/60">Identité Stack Auth</p>
          <div>
            <h2 className="text-2xl font-semibold">{stackUser.displayName ?? "Profil sans nom"}</h2>
            <p className="text-sm text-white/70">{primaryEmail}</p>
          </div>
          <p className="text-xs text-white/50">
            Pseudo Adapt2Life: <span className="font-semibold text-white/80">{localUser?.pseudo ?? "Non défini"}</span>
          </p>
          {stackUser.profileImageUrl ? (
            <p className="text-xs text-white/50">
              Image de profil:{" "}
              <a href={stackUser.profileImageUrl} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                {stackUser.profileImageUrl}
              </a>
            </p>
          ) : null}
        </div>

        <dl className="grid gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2 sm:gap-6 sm:p-6">
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Email vérifié</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.primaryEmailVerified ? "Oui ✅" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Mot de passe configuré</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.hasPassword ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Compte anonyme</dt>
            <dd className="mt-2 text-base font-semibold">{stackUser.isAnonymous ? "Oui" : "Non"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Inscription Stack</dt>
            <dd className="mt-2 text-base font-semibold">{signedUpAt ? signedUpAt.toLocaleString("fr-FR") : "Non disponible"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">ID Stack</dt>
            <dd className="mt-2 font-mono text-xs sm:text-sm">{stackUser.id}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-white/60">Métadonnées client</dt>
            <dd className="mt-2 text-xs text-white/60">
              {stackUser.clientMetadata ? JSON.stringify(stackUser.clientMetadata) : "Aucune métadonnée"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-6 rounded-3xl border border-emerald-700/40 bg-emerald-900/20 p-8 shadow-xl backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-wide text-emerald-300">Profil Adapt2Life</p>
          <p className="text-sm text-emerald-100/80">
            {localUser
              ? "Informations synchronisées avec la base de données interne."
              : "Complète le formulaire ci-dessous pour enregistrer ton profil Adapt2Life."}
          </p>
        </div>

        <form action={updateProfile} className="space-y-6 rounded-2xl border border-emerald-700/30 bg-emerald-900/30 p-6">
          {statusMessage ? (
            <p className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">{statusMessage}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="pseudo" className="text-sm font-semibold text-emerald-100">
                Pseudo
              </label>
              <input
                id="pseudo"
                name="pseudo"
                type="text"
                defaultValue={localUser?.pseudo ?? ""}
                placeholder="Ex. IronRunner"
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="lastName" className="text-sm font-semibold text-emerald-100">
                Nom
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                defaultValue={localUser?.lastName ?? ""}
                placeholder="Ex. Dupont"
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                autoComplete="family-name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="firstName" className="text-sm font-semibold text-emerald-100">
                Prénom
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                defaultValue={localUser?.firstName ?? ""}
                placeholder="Ex. Marie"
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                autoComplete="given-name"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="gender" className="text-sm font-semibold text-emerald-100">
                Genre
              </label>
              <select
                id="gender"
                name="gender"
                defaultValue={localUser?.gender ?? ""}
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
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
              <label htmlFor="birthDate" className="text-sm font-semibold text-emerald-100">
                Date de naissance
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                defaultValue={localUser?.birthDate ?? ""}
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                autoComplete="bday"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="age" className="text-sm font-semibold text-emerald-100">
                Âge (calculé)
              </label>
              <input
                id="age"
                type="number"
                readOnly
                value={computedAge ?? ""}
                placeholder="Ex. 29"
                className="rounded-md border border-emerald-700/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:outline-none"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="heightCm" className="text-sm font-semibold text-emerald-100">
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
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                inputMode="numeric"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="weightKg" className="text-sm font-semibold text-emerald-100">
                Poids (kg)
              </label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                min="0"
                step="0.1"
                defaultValue={localUser?.weightKg ? String(localUser.weightKg) : ""}
                placeholder="Ex. 68.5"
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 placeholder:text-emerald-200/40 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                inputMode="decimal"
              />
            </div>

            <div className="flex flex-col gap-2 sm:col-span-2">
              <label htmlFor="sportLevel" className="text-sm font-semibold text-emerald-100">
                Niveau sportif
              </label>
              <select
                id="sportLevel"
                name="sportLevel"
                defaultValue={localUser?.sportLevel ? String(localUser.sportLevel) : ""}
                className="rounded-md border border-emerald-700/40 bg-emerald-950/60 px-3 py-2 text-sm text-emerald-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
              >
                <option value="">Sélectionne ton niveau</option>
                {sportLevelOptions.map((option) => (
                  <option key={option.value} value={String(option.value)}>
                    {`${option.value} — ${option.label}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
            >
              Enregistrer le profil
            </button>
          </div>
        </form>

        {localUser ? (
          <dl className="grid gap-4 rounded-2xl border border-emerald-700/30 bg-emerald-900/30 p-4 text-sm sm:grid-cols-2 sm:gap-6 sm:p-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Identifiant interne</dt>
              <dd className="mt-2 font-mono text-xs sm:text-sm">{localUser.id}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Nom enregistré</dt>
              <dd className="mt-2 text-base font-semibold">{localUser.name ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Genre</dt>
              <dd className="mt-2 text-base font-semibold">{genderLabel(localUser.gender) ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Niveau sportif</dt>
              <dd className="mt-2 text-base font-semibold">{sportLevelLabel(localUser.sportLevel) ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Pseudo</dt>
              <dd className="mt-2 text-base font-semibold">{localUser.pseudo ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Âge</dt>
              <dd className="mt-2 text-base font-semibold">{formattedAge ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Taille</dt>
              <dd className="mt-2 text-base font-semibold">{formatHeight(localUser.heightCm) ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Poids</dt>
              <dd className="mt-2 text-base font-semibold">{formatWeight(localUser.weightKg) ?? "Non renseigné"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Email enregistré</dt>
              <dd className="mt-2 text-base font-semibold">{localUser.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-emerald-200/70">Créé le</dt>
              <dd className="mt-2 text-base font-semibold">
                {localUser.createdAt ? localUser.createdAt.toLocaleString("fr-FR") : "Non disponible"}
              </dd>
            </div>
          </dl>
        ) : null}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-md border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/80"
        >
          Retour à l’accueil
        </Link>
        <Link
          href="/integrations/garmin"
          className="inline-flex items-center justify-center rounded-md border border-emerald-500/60 bg-emerald-500/10 px-5 py-2.5 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
        >
          Gérer l’intégration Garmin
        </Link>
      </div>
    </div>
  );
}
