const removeDiacritics = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const GARMIN_SUPPORTED_SPORTS = new Set([
  "RUNNING",
  "CYCLING",
  "LAP_SWIMMING",
  "CARDIO_TRAINING",
  "STRENGTH_TRAINING",
  "GENERIC",
]);

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

export const evaluatePlanCompatibility = (text: string | null | undefined) => {
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
