import { DEFAULT_LOCALE, Locale } from "@/lib/i18n/locales";

type AppErrorSeverity = "error" | "warning" | "info" | "success";

export type AppErrorDescriptor = {
  title: string;
  description?: string;
  severity: AppErrorSeverity;
};

type LocalizedErrorDescriptor = Record<Locale, AppErrorDescriptor>;

const APP_ERROR_REGISTRY = {
  "training-plan/empty-brief": {
    fr: {
      title: "Brief requis",
      description: "Merci de préciser ton objectif, tes contraintes ou disponibilités avant de lancer la génération.",
      severity: "warning",
    },
    en: {
      title: "Brief required",
      description: "Please describe your goal, constraints or availability before launching the generator.",
      severity: "warning",
    },
  },
  "training-plan/request-failed": {
    fr: {
      title: "Génération impossible",
      description: "Impossible de générer le plan d’entraînement pour le moment. Réessaie dans quelques instants.",
      severity: "error",
    },
    en: {
      title: "Generation failed",
      description: "We can’t generate this workout right now. Please try again in a few seconds.",
      severity: "error",
    },
  },
  "training-plan/invalid-response": {
    fr: {
      title: "Réponse inattendue",
      description: "Le serveur n’a pas renvoyé de séance exploitable. Merci de réessayer.",
      severity: "error",
    },
    en: {
      title: "Unexpected response",
      description: "The server did not return a usable workout. Please try again.",
      severity: "error",
    },
  },
  "training-plan/quota-exhausted": {
    fr: {
      title: "Quota de génération atteint",
      description: "Tu as utilisé les séances incluses dans ton plan actuel. Contacte l’équipe pour prolonger l’accès.",
      severity: "warning",
    },
    en: {
      title: "Generation quota reached",
      description: "You used all workouts included in your current plan. Contact the team if you need more access.",
      severity: "warning",
    },
  },
  "garmin-trainer/no-source-plan": {
    fr: {
      title: "Plan requis",
      description: "Génère ou colle un plan d’entraînement avant de lancer la conversion Garmin.",
      severity: "warning",
    },
    en: {
      title: "Plan required",
      description: "Generate or paste a workout before launching the Garmin conversion.",
      severity: "warning",
    },
  },
  "garmin-trainer/request-failed": {
    fr: {
      title: "Conversion impossible",
      description: "La conversion vers le format Garmin a échoué. Patiente quelques secondes et réessaie.",
      severity: "error",
    },
    en: {
      title: "Conversion failed",
      description: "The conversion to the Garmin format failed. Wait a few seconds and try again.",
      severity: "error",
    },
  },
  "garmin-trainer/raw-missing": {
    fr: {
      title: "Données manquantes",
      description: "Le serveur n’a pas renvoyé le JSON brut attendu. La conversion doit être relancée.",
      severity: "error",
    },
    en: {
      title: "Missing data",
      description: "The server did not return the expected raw JSON. Please relaunch the conversion.",
      severity: "error",
    },
  },
  "garmin-trainer/push-failed": {
    fr: {
      title: "Envoi Garmin impossible",
      description: "Impossible d’envoyer l’entraînement à Garmin. Vérifie ta connexion et réessaie.",
      severity: "error",
    },
    en: {
      title: "Garmin delivery failed",
      description: "We couldn’t push the workout to Garmin. Check your connection and try again.",
      severity: "error",
    },
  },
  "garmin-trainer/push-unavailable": {
    fr: {
      title: "Connexion Garmin requise",
      description: "Connecte ton compte Garmin avant de tenter l’envoi automatique.",
      severity: "warning",
    },
    en: {
      title: "Garmin link required",
      description: "Connect your Garmin account before trying the automatic delivery.",
      severity: "warning",
    },
  },
  "garmin-trainer/quota-exhausted": {
    fr: {
      title: "Conversions offertes épuisées",
      description: "Tu as utilisé les conversions incluses dans ton plan actuel. Contacte l’équipe pour prolonger ton accès.",
      severity: "warning",
    },
    en: {
      title: "Conversion quota reached",
      description: "You used all conversions included in your plan. Contact the team if you need more.",
      severity: "warning",
    },
  },
  "garmin-trainer/auth-required": {
    fr: {
      title: "Authentification requise",
      description: "Connecte-toi pour lancer une conversion Garmin.",
      severity: "warning",
    },
    en: {
      title: "Authentication required",
      description: "Sign in before launching a Garmin conversion.",
      severity: "warning",
    },
  },
  "app/unexpected": {
    fr: {
      title: "Erreur inattendue",
      description: "Un événement imprévu est survenu. Réessaie ou contacte le support si le problème persiste.",
      severity: "error",
    },
    en: {
      title: "Unexpected error",
      description: "Something went wrong. Try again or contact support if it keeps happening.",
      severity: "error",
    },
  },
} satisfies Record<string, LocalizedErrorDescriptor>;

export type AppErrorCode = keyof typeof APP_ERROR_REGISTRY;

const DEFAULT_DESCRIPTOR = APP_ERROR_REGISTRY["app/unexpected"];

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

const resolveDescriptor = (code: AppErrorCode | undefined, locale: Locale): AppErrorDescriptor => {
  if (code) {
    const entry = APP_ERROR_REGISTRY[code];
    if (entry) {
      return entry[locale] ?? entry[DEFAULT_LOCALE] ?? DEFAULT_DESCRIPTOR[locale] ?? DEFAULT_DESCRIPTOR[DEFAULT_LOCALE];
    }
  }
  return DEFAULT_DESCRIPTOR[locale] ?? DEFAULT_DESCRIPTOR[DEFAULT_LOCALE];
};

export const getErrorDescriptor = (
  code?: AppErrorCode,
  overrides?: Partial<AppErrorDescriptor>,
  locale: Locale = DEFAULT_LOCALE,
): AppErrorDescriptor => {
  const base = resolveDescriptor(code, locale);
  return {
    ...base,
    ...overrides,
    description: overrides?.description ?? base.description,
    severity: overrides?.severity ?? base.severity,
  };
};

export type AppErrorOptions = {
  message?: string;
  details?: string | null;
  cause?: unknown;
};

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly details?: string | null;

  constructor(code: AppErrorCode, options?: AppErrorOptions) {
    super(
      options?.message ??
        APP_ERROR_REGISTRY[code]?.[DEFAULT_LOCALE]?.description ??
        DEFAULT_DESCRIPTOR[DEFAULT_LOCALE].description,
      {
        cause: options?.cause,
      },
    );
    this.code = code;
    this.details = options?.details ?? null;
    this.name = "AppError";
  }
}

const mergeDescriptor = (descriptor: AppErrorDescriptor, details?: string | null): AppErrorDescriptor => {
  if (!hasText(details)) {
    return descriptor;
  }
  return {
    ...descriptor,
    description: details.trim(),
  };
};

export const describeAppError = (
  error: unknown,
  fallbackCode: AppErrorCode = "app/unexpected",
  locale: Locale = DEFAULT_LOCALE,
): AppErrorDescriptor => {
  if (error instanceof AppError) {
    return mergeDescriptor(getErrorDescriptor(error.code, undefined, locale), error.details ?? error.message);
  }
  if (error instanceof Error) {
    const descriptor = getErrorDescriptor(fallbackCode, undefined, locale);
    return mergeDescriptor(descriptor, error.message);
  }
  return getErrorDescriptor(fallbackCode, undefined, locale);
};

export const resolveErrorMessage = (
  code: AppErrorCode,
  options?: { details?: string | null; fallback?: string; locale?: Locale },
): string => {
  const descriptor = getErrorDescriptor(code, undefined, options?.locale ?? DEFAULT_LOCALE);
  if (hasText(options?.details)) {
    return options?.details.trim();
  }
  if (hasText(descriptor.description)) {
    return descriptor.description!.trim();
  }
  if (hasText(options?.fallback)) {
    return options?.fallback.trim();
  }
  return descriptor.title;
};

export const getErrorCatalog = () => APP_ERROR_REGISTRY;

export type GarminConversionErrorMeta = {
  rawResponse?: string | null;
  debugPayload?: unknown;
  issues?: unknown;
};

export class GarminConversionError extends Error {
  public readonly rawResponse: string | null;
  public readonly debugPayload: unknown;
  public readonly issues: unknown;

  constructor(message: string, meta?: GarminConversionErrorMeta, options?: { cause?: unknown }) {
    super(message, { cause: options?.cause });
    this.name = "GarminConversionError";
    this.rawResponse = meta?.rawResponse ?? null;
    this.debugPayload = meta?.debugPayload;
    this.issues = meta?.issues;
  }
}
