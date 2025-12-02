const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const GARMIN_SUPPORTED_SPORTS = new Set([
  "MULTI_SPORT",
  "RUNNING",
  "CYCLING",
  "LAP_SWIMMING",
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "YOGA",
  "PILATES",
]);

const SPORT_SYNONYMS: Record<string, Record<string, string>> = {
  fr: {
    "course a pied": "RUNNING",
    course: "RUNNING",
    "course pied": "RUNNING",
    footing: "RUNNING",
    trail: "RUNNING",
    marathon: "RUNNING",
    triathlon: "MULTI_SPORT",
    duathlon: "MULTI_SPORT",
    multisport: "MULTI_SPORT",
    multisports: "MULTI_SPORT",
    "multi sport": "MULTI_SPORT",
    velo: "CYCLING",
    vélo: "CYCLING",
    cyclisme: "CYCLING",
    spinning: "CYCLING",
    natation: "LAP_SWIMMING",
    piscine: "LAP_SWIMMING",
    "nage en piscine": "LAP_SWIMMING",
    "musculation": "STRENGTH_TRAINING",
    "renforcement musculaire": "STRENGTH_TRAINING",
    renforcement: "STRENGTH_TRAINING",
    "entrainement force": "STRENGTH_TRAINING",
    cardio: "CARDIO_TRAINING",
    "cardio training": "CARDIO_TRAINING",
    hiit: "CARDIO_TRAINING",
    hit: "CARDIO_TRAINING",
    rameur: "CARDIO_TRAINING",
    "velo elliptique": "CARDIO_TRAINING",
    "vélo elliptique": "CARDIO_TRAINING",
    rower: "CARDIO_TRAINING",
    yoga: "YOGA",
    pilates: "PILATES",
  },
  en: {
    running: "RUNNING",
    run: "RUNNING",
    trail: "RUNNING",
    marathon: "RUNNING",
    triathlon: "MULTI_SPORT",
    duathlon: "MULTI_SPORT",
    "multi-sport": "MULTI_SPORT",
    multisport: "MULTI_SPORT",
    cycling: "CYCLING",
    bike: "CYCLING",
    biking: "CYCLING",
    spinning: "CYCLING",
    swimming: "LAP_SWIMMING",
    swim: "LAP_SWIMMING",
    "pool swim": "LAP_SWIMMING",
    strength: "STRENGTH_TRAINING",
    "strength training": "STRENGTH_TRAINING",
    weights: "STRENGTH_TRAINING",
    gym: "STRENGTH_TRAINING",
    cardio: "CARDIO_TRAINING",
    "cardio training": "CARDIO_TRAINING",
    hiit: "CARDIO_TRAINING",
    rowing: "CARDIO_TRAINING",
    rower: "CARDIO_TRAINING",
    "elliptical": "CARDIO_TRAINING",
    yoga: "YOGA",
    pilates: "PILATES",
  },
};

const LOCALE_PRIORITY = ["fr", "en"] as const;

const RAW_UNSUPPORTED_KEYWORDS = [
  { keyword: "yoga", label: "une séance de yoga" },
  { keyword: "pilates", label: "une séance de pilates" },
  { keyword: "danse", label: "une séance de danse" },
  { keyword: "dance", label: "une séance de danse" },
  { keyword: "escalade", label: "une séance d'escalade" },
  { keyword: "randonnee", label: "une randonnée" },
  { keyword: "randonnée", label: "une randonnée" },
  { keyword: "marche nordique", label: "de la marche nordique" },
  { keyword: "equitation", label: "de l'équitation" },
  { keyword: "équitation", label: "de l'équitation" },
  { keyword: "ski", label: "une séance de ski" },
  { keyword: "boxe", label: "une séance de boxe" },
  { keyword: "stretching", label: "une session de stretching" },
  { keyword: "respiration", label: "un atelier de respiration" },
  { keyword: "meditation", label: "une session de méditation" },
  { keyword: "méditation", label: "une session de méditation" },
];

const UNSUPPORTED_KEYWORDS = RAW_UNSUPPORTED_KEYWORDS.map((entry) => ({
  ...entry,
  normalized: removeDiacritics(entry.keyword).toLowerCase(),
}));

const normalizeSportKey = (value: string) =>
  removeDiacritics(value)
    .toLowerCase()
    .replace(/[\s\-_/]+/g, " ")
    .trim();

export const detectPlanSport = (plan: string | null | undefined, preferredLocale?: string | null) => {
  if (!plan) {
    return { label: null as string | null, garminSportId: null as string | null, locale: null as string | null };
  }
  const match = plan.match(/^\s*(?:sport|deporte|deporte)\s*[:：]\s*(.+)$/im);
  if (!match) {
    return { label: null, garminSportId: null, locale: null };
  }
  const label = match[1].trim();
  const normalized = normalizeSportKey(label);

  const localesToCheck = preferredLocale
    ? [preferredLocale, ...LOCALE_PRIORITY.filter((locale) => locale !== preferredLocale)]
    : LOCALE_PRIORITY;

  for (const locale of localesToCheck) {
    const synonymMap = SPORT_SYNONYMS[locale];
    const garminSportId = synonymMap?.[normalized];
    if (garminSportId) {
      return { label, garminSportId, locale };
    }
  }

  return { label, garminSportId: null, locale: null };
};

export const evaluatePlanCompatibility = (text: string | null | undefined, detectedSportId?: string | null) => {
  if (detectedSportId) {
    if (GARMIN_SUPPORTED_SPORTS.has(detectedSportId.toUpperCase())) {
      return { isCompatible: true, blocker: null as string | null };
    }
    return { isCompatible: false, blocker: "Le sport de cette séance n’est pas pris en charge par Garmin Training." };
  }

  if (!text) {
    return { isCompatible: true, blocker: null as string | null };
  }
  const normalized = removeDiacritics(text).toLowerCase();
  const blocker = UNSUPPORTED_KEYWORDS.find((entry) => normalized.includes(entry.normalized));
  if (blocker) {
    return { isCompatible: false, blocker: blocker.label };
  }

  return { isCompatible: true, blocker: null };
};

export const isGarminSportSupported = (sport: string | null | undefined) => {
  if (!sport) {
    return false;
  }
  return GARMIN_SUPPORTED_SPORTS.has(sport.toUpperCase());
};
