import type { GarminExerciseSport } from "@/constants/garminExerciseData";

export type GarminExerciseLocale = "fr" | "en";

const SUPPORTED_LOCALES = new Set<GarminExerciseLocale>(["fr", "en"]);

const SPECIAL_NAME_TRANSLATIONS_FR: Record<string, string> = {
  PUSH_UP: "Pompe",
  PUSH_UPS: "Pompes",
  PULL_UP: "Traction",
  PULL_UPS: "Tractions",
  JUMPING_JACKS: "Jumping jacks",
  BURPEE: "Burpee",
  BURPEES: "Burpees",
  DEADLIFT: "Soulevé de terre",
  DEADLIFTS: "Soulevés de terre",
  SQUAT: "Squat",
  SQUATS: "Squats",
  LUNGE: "Fente",
  LUNGES: "Fentes",
  JUMP_SQUAT: "Squat sauté",
  JUMP_SQUATS: "Squats sautés",
};

const MULTI_TOKEN_TRANSLATIONS_FR: Record<string, string> = {
  SINGLE_LEG: "Une jambe",
  SINGLE_ARM: "Un bras",
  DOUBLE_ARM: "Deux bras",
  SIDE_PLANK: "Gainage latéral",
  HIGH_PLANK: "Gainage haut",
  KNEE_DRIVE: "Montée de genou",
  KNEE_RAISE: "Élévation de genou",
  ROMANIAN_DEADLIFT: "Soulevé de terre roumain",
  GOOD_MORNING: "Good morning",
  GLUTE_BRIDGE: "Pont fessier",
  RUSSIAN_TWIST: "Twist russe",
  BANDED_EXERCISES: "Exercices avec élastique",
  BENCH_PRESS: "Développé couché",
  BARBELL_BENCH_PRESS: "Développé couché barre",
  DUMBBELL_BENCH_PRESS: "Développé couché haltères",
};

const TOKEN_TRANSLATIONS_FR: Record<string, string> = {
  AB: "abdos",
  ABS: "abdos",
  CORE: "gainage",
  TWIST: "rotation",
  BACK: "dos",
  EXTENSION: "extension",
  BICYCLE: "vélo",
  CRUNCH: "crunch",
  CRUNCHES: "crunchs",
  EXERCISE: "exercice",
  EXERCISES: "exercices",
  CALF: "mollet",
  CALVES: "mollets",
  RAISE: "élévation",
  RAISES: "élévations",
  FRONT: "avant",
  REAR: "arrière",
  LATERAL: "latéral",
  SIDE: "côté",
  BRIDGE: "pont",
  HIP: "hanche",
  HIPS: "hanches",
  HAMSTRING: "ischio",
  CURL: "curl",
  CURLS: "curls",
  PRESS: "développé",
  PRESSES: "développés",
  BENCH: "banc",
  ROW: "tirage",
  ROWS: "tirages",
  ROWING: "tirage",
  PULL: "tirage",
  PUSH: "poussée",
  PUSHES: "poussées",
  JUMP: "saut",
  JUMPS: "sauts",
  JUMPING: "saut",
  JACK: "jack",
  JACKS: "jacks",
  HOLD: "maintien",
  HOLDS: "maintien",
  WALK: "marche",
  WALKS: "marches",
  WALKING: "marche",
  STEP: "step",
  STEPS: "steps",
  PLANK: "gainage",
  PLANKS: "gainages",
  FLY: "écarté",
  FLYES: "écartés",
  PLYO: "plyo",
  CLIMBER: "grimpeur",
  CLIMBERS: "grimpeurs",
  SPRINT: "sprint",
  SPRINTS: "sprints",
  THRUSTER: "thruster",
  THRUSTERS: "thrusters",
  CARRY: "carry",
  CARRIES: "carries",
  SWING: "swing",
  SWINGS: "swings",
  PRESSING: "développé",
  LIFT: "élévation",
  LIFTS: "élévations",
  HOLDING: "maintien",
  STRAIGHT: "droit",
  BENT: "fléchi",
  KNEE: "genou",
  KNEES: "genoux",
  LEG: "jambe",
  LEGS: "jambes",
  ARM: "bras",
  ARMS: "bras",
  SHOULDER: "épaule",
  SHOULDERS: "épaules",
  CHEST: "poitrine",
  TRICEP: "triceps",
  TRICEPS: "triceps",
  BICEP: "biceps",
  BICEPS: "biceps",
  DUMBBELL: "haltère",
  DUMBBELLS: "haltères",
  KETTLEBELL: "kettlebell",
  KETTLEBELLS: "kettlebells",
  BARBELL: "barre",
  MACHINE: "machine",
  BAND: "élastique",
  BANDED: "avec élastique",
  ROPE: "corde",
  BATTLE: "battle",
  FLOOR: "sol",
  SEATED: "assis",
  STANDING: "debout",
  WEIGHTED: "lesté",
  WEIGHT: "charge",
  BODYWEIGHT: "poids du corps",
  SIDEWAYS: "latéral",
  OVERHEAD: "au-dessus de la tête",
  HANGING: "en suspension",
  DIP: "dips",
  DIPS: "dips",
  ROWING_MACHINE: "rameur",
  BIKE: "vélo",
};

const toTitleCase = (value: string): string => {
  return value
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const capitalize = (value: string): string => {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const translateValueToFrench = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }
  const normalized = value.trim().toUpperCase();
  if (!normalized) {
    return null;
  }

  const special = SPECIAL_NAME_TRANSLATIONS_FR[normalized];
  if (special) {
    return special;
  }

  const tokens = normalized.split("_").filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  const words: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    let matchedSequence = false;
    for (let span = Math.min(3, tokens.length - index); span > 1; span -= 1) {
      const candidate = tokens.slice(index, index + span).join("_");
      const translation = MULTI_TOKEN_TRANSLATIONS_FR[candidate];
      if (translation) {
        words.push(translation);
        index += span - 1;
        matchedSequence = true;
        break;
      }
    }
    if (matchedSequence) {
      continue;
    }

    const token = tokens[index];
    const translation = TOKEN_TRANSLATIONS_FR[token];
    if (translation) {
      words.push(translation);
      continue;
    }

    words.push(token.toLowerCase());
  }

  const sentence = words.join(" ").replace(/\s+/g, " ").trim();
  return sentence ? capitalize(sentence) : null;
};

const translateValue = (value: string | null | undefined, locale: GarminExerciseLocale): string | null => {
  if (!value) {
    return null;
  }
  if (locale === "fr") {
    return translateValueToFrench(value);
  }
  return toTitleCase(value);
};

export const getGarminExerciseLabel = (
  name: string | null | undefined,
  locale: GarminExerciseLocale = "fr",
): string | null => {
  const effectiveLocale = SUPPORTED_LOCALES.has(locale) ? locale : "en";
  return translateValue(name, effectiveLocale);
};

export const getGarminExerciseCategoryLabel = (
  category: string | null | undefined,
  locale: GarminExerciseLocale = "fr",
): string | null => {
  const effectiveLocale = SUPPORTED_LOCALES.has(locale) ? locale : "en";
  return translateValue(category, effectiveLocale);
};

export const describeExerciseForUser = (
  options: {
    sport?: GarminExerciseSport | null;
    category?: string | null;
    name?: string | null;
  },
  locale: GarminExerciseLocale = "fr",
): string | null => {
  const nameLabel = getGarminExerciseLabel(options.name, locale);
  const categoryLabel = getGarminExerciseCategoryLabel(options.category, locale);

  if (nameLabel && categoryLabel) {
    return `${nameLabel} — ${categoryLabel.toLowerCase()}`;
  }
  return nameLabel ?? categoryLabel ?? null;
};
