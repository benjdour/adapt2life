/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("fs");

/**
 * Remove null/undefined entries recursively.
 */
function clean(value) {
  if (Array.isArray(value)) {
    return value.map(clean).filter((item) => item !== null && item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([key, v]) => [key, clean(v)]),
    );
  }

  return value;
}

/**
 * Apply Garmin-specific fixes: repeatType, targetType adjustments.
 */
function fixGarmin(value, contextSport = null) {
  if (Array.isArray(value)) {
    value.forEach((item) => fixGarmin(item, contextSport));
    return;
  }

  if (value && typeof value === "object") {
    const currentSport = typeof value.sport === "string" ? value.sport : contextSport;

    if (value.repeatType === "TIMES") {
      value.repeatType = "REPEAT_COUNT";
    }

    const isLapSwim =
      currentSport === "LAP_SWIMMING" ||
      (typeof value.sport === "string" && value.sport === "LAP_SWIMMING");

    if (
      isLapSwim &&
      typeof value.targetType === "string" &&
      value.targetType === "HEART_RATE" &&
      typeof value.intensity === "string" &&
      ["MAIN", "INTERVAL"].includes(value.intensity.toUpperCase ? value.intensity.toUpperCase() : value.intensity)
    ) {
      value.targetType = "PACE";
    }

    Object.values(value).forEach((child) => fixGarmin(child, currentSport));
  }
}

/**
 * Compute per-segment and total durations/distances.
 */
function computeTotals(workout) {
  if (!workout || typeof workout !== "object" || !Array.isArray(workout.segments)) {
    return workout;
  }

  let totalDuration = 0;
  let totalDistance = 0;

  workout.segments.forEach((segment) => {
    let segmentDuration = 0;
    let segmentDistance = 0;

    const steps = Array.isArray(segment.steps) ? segment.steps : [];
    steps.forEach((step) => {
      if (step && typeof step === "object") {
        const durationValue = Number(step.durationValue) || 0;
        if (step.durationType === "TIME") {
          segmentDuration += durationValue;
        }
        if (step.durationType === "DISTANCE") {
          segmentDistance += durationValue;
        }
      }
    });

    segment.estimatedDurationInSecs = segmentDuration > 0 ? segmentDuration : null;
    segment.estimatedDistanceInMeters = segmentDistance > 0 ? segmentDistance : null;

    totalDuration += segmentDuration;
    totalDistance += segmentDistance;
  });

  workout.estimatedDurationInSecs = totalDuration > 0 ? totalDuration : null;
  workout.estimatedDistanceInMeters = totalDistance > 0 ? totalDistance : null;

  return workout;
}

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/compressWorkout.js full.json > full_clean.json");
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(file, "utf8"));
let cleaned = clean(data);
fixGarmin(cleaned);
cleaned = computeTotals(cleaned);
console.log(JSON.stringify(cleaned, null, 2));
