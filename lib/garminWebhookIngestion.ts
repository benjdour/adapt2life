export const SUMMARY_KEY_ALIASES: Record<string, string[]> = {
  activities: ["activities", "activitySummaries"],
  activityDetails: ["activityDetails"],
  activityFiles: ["activityFiles"],
  manuallyUpdatedActivities: ["manuallyUpdatedActivities"],
  moveIQ: ["moveIQ", "moveIqEvents"],
  deregistrations: ["deregistrations"],
  userPermissionsChange: ["userPermissionsChange", "userPermissionChange"],
  bloodPressure: ["bloodPressure", "bloodPressures"],
  bodyCompositions: ["bodyCompositions", "bodyComposition"],
  epochs: ["epochs"],
  hrv: ["hrv", "hrvSummaries"],
  healthSnapshot: ["healthSnapshot", "healthSnapshots"],
  pulseOx: ["pulseOx", "pulseox"],
  respiration: ["respiration", "respirationSummaries", "allDayRespiration"],
  skinTemp: ["skinTemp", "skinTemps"],
  sleeps: ["sleeps", "sleep", "sleepSummaries"],
  stressDetails: ["stressDetails"],
  userMetrics: ["userMetrics"],
  womenHealth: ["womenHealth", "womenHealthData"],
};

export type GarminGenericPayload = Record<string, unknown>;

export const extractEntriesForSummary = (payload: unknown, summaryType: string): GarminGenericPayload[] => {
  if (!payload) {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload as GarminGenericPayload[];
  }

  if (typeof payload === "object") {
    const aliases = SUMMARY_KEY_ALIASES[summaryType] ?? [summaryType, `${summaryType}s`];
    for (const key of aliases) {
      const maybeArray = (payload as Record<string, unknown>)[key];
      if (Array.isArray(maybeArray)) {
        return maybeArray as GarminGenericPayload[];
      }
    }

    const firstArray = Object.values(payload).find((value) => Array.isArray(value));
    if (Array.isArray(firstArray)) {
      return firstArray as GarminGenericPayload[];
    }
  }

  return [];
};

export const resolveGarminUserId = (entry: GarminGenericPayload): string | null => {
  const record = entry as Record<string, unknown>;
  const candidates = [
    record.userId,
    record.userProfileId,
    record.ownerId,
    record.profileId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }

  return null;
};

export const resolveEntityId = (entry: GarminGenericPayload): string | null => {
  const record = entry as Record<string, unknown>;
  const candidates = [
    record.summaryId,
    record.activityId,
    record.snapshotId,
    record.measurementId,
    record.id,
    record.fileId,
    record.startTimeInSeconds,
    record.changeTimeInSeconds,
    record.recordId,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
    if (typeof candidate === "number" && Number.isFinite(candidate)) {
      return candidate.toString();
    }
  }

  return null;
};
