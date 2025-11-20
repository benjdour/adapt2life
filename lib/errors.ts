type AppErrorSeverity = "error" | "warning" | "info" | "success";

export type AppErrorDescriptor = {
  title: string;
  description?: string;
  severity: AppErrorSeverity;
};

const APP_ERROR_REGISTRY = {
  "training-plan/empty-brief": {
    title: "Brief requis",
    description: "Merci de préciser ton objectif, tes contraintes ou disponibilités avant de lancer la génération.",
    severity: "warning",
  },
  "training-plan/request-failed": {
    title: "Génération impossible",
    description: "Impossible de générer le plan d’entraînement pour le moment. Réessaie dans quelques instants.",
    severity: "error",
  },
  "training-plan/invalid-response": {
    title: "Réponse inattendue",
    description: "Le serveur n’a pas renvoyé de séance exploitable. Merci de réessayer.",
    severity: "error",
  },
  "garmin-trainer/no-source-plan": {
    title: "Plan requis",
    description: "Génère ou colle un plan d’entraînement avant de lancer la conversion Garmin.",
    severity: "warning",
  },
  "garmin-trainer/request-failed": {
    title: "Conversion impossible",
    description: "La conversion vers le format Garmin a échoué. Patiente quelques secondes et réessaie.",
    severity: "error",
  },
  "garmin-trainer/raw-missing": {
    title: "Données manquantes",
    description: "Le serveur n’a pas renvoyé le JSON brut attendu. La conversion doit être relancée.",
    severity: "error",
  },
  "garmin-trainer/push-failed": {
    title: "Envoi Garmin impossible",
    description: "Impossible d’envoyer l’entraînement à Garmin. Vérifie ta connexion et réessaie.",
    severity: "error",
  },
  "garmin-trainer/push-unavailable": {
    title: "Connexion Garmin requise",
    description: "Connecte ton compte Garmin avant de tenter l’envoi automatique.",
    severity: "warning",
  },
  "app/unexpected": {
    title: "Erreur inattendue",
    description: "Un événement imprévu est survenu. Réessaie ou contacte le support si le problème persiste.",
    severity: "error",
  },
} satisfies Record<string, AppErrorDescriptor>;

export type AppErrorCode = keyof typeof APP_ERROR_REGISTRY;

const DEFAULT_DESCRIPTOR: AppErrorDescriptor = APP_ERROR_REGISTRY["app/unexpected"];

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

export const getErrorDescriptor = (
  code?: AppErrorCode,
  overrides?: Partial<AppErrorDescriptor>,
): AppErrorDescriptor => {
  const base = code ? APP_ERROR_REGISTRY[code] ?? DEFAULT_DESCRIPTOR : DEFAULT_DESCRIPTOR;
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
    super(options?.message ?? APP_ERROR_REGISTRY[code]?.description ?? DEFAULT_DESCRIPTOR.description, {
      cause: options?.cause,
    });
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
): AppErrorDescriptor => {
  if (error instanceof AppError) {
    return mergeDescriptor(getErrorDescriptor(error.code), error.details ?? error.message);
  }
  if (error instanceof Error) {
    const descriptor = getErrorDescriptor(fallbackCode);
    return mergeDescriptor(descriptor, error.message);
  }
  return getErrorDescriptor(fallbackCode);
};

export const resolveErrorMessage = (
  code: AppErrorCode,
  options?: { details?: string | null; fallback?: string },
): string => {
  const descriptor = getErrorDescriptor(code);
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
