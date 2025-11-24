import { z } from "zod";

import type { GarminExerciseSport } from "@/constants/garminExerciseData";
import {
  SPORTS_REQUIRING_EXERCISE_METADATA,
  hasGarminExerciseCategory,
  isKnownGarminExercise,
} from "@/constants/garminExerciseData";

/** --- Enums Garmin --- */
export const Sport = z.enum([
  "RUNNING",
  "CYCLING",
  "LAP_SWIMMING",
  "STRENGTH_TRAINING",
  "CARDIO_TRAINING",
  "GENERIC",
  "YOGA",
  "PILATES",
  "MULTI_SPORT",
]);

export const Intensity = z.enum(["REST", "WARMUP", "COOLDOWN", "RECOVERY", "ACTIVE", "INTERVAL", "MAIN"]);

export const DurationType = z.enum([
  "TIME",
  "DISTANCE",
  "HR_LESS_THAN",
  "HR_GREATER_THAN",
  "CALORIES",
  "OPEN",
  "POWER_LESS_THAN",
  "POWER_GREATER_THAN",
  "TIME_AT_VALID_CDA",
  "FIXED_REST",
  "REPS",
  "REPETITION_SWIM_CSS_OFFSET",
  "FIXED_REPETITION",
]);

export const RepeatType = z.enum([
  "REPEAT_UNTIL_STEPS_CMPLT",
  "REPEAT_UNTIL_TIME",
  "REPEAT_UNTIL_DISTANCE",
  "REPEAT_UNTIL_CALORIES",
  "REPEAT_UNTIL_HR_LESS_THAN",
  "REPEAT_UNTIL_HR_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LESS_THAN",
  "REPEAT_UNTIL_POWER_GREATER_THAN",
  "REPEAT_UNTIL_POWER_LAST_LAP_LESS_THAN",
  "REPEAT_UNTIL_MAX_POWER_LAST_LAP_LESS_THAN",
]);

export const TargetType = z.enum([
  "SPEED",
  "HEART_RATE",
  "OPEN",
  "CADENCE",
  "POWER",
  "GRADE",
  "RESISTANCE",
  "POWER_3S",
  "POWER_10S",
  "POWER_30S",
  "POWER_LAP",
  "SPEED_LAP",
  "HEART_RATE_LAP",
  "PACE",
]);

export const SecondaryTargetType = z.enum([
  ...TargetType.options,
  "PACE_ZONE",
  "SWIM_INSTRUCTION",
  "SWIM_CSS_OFFSET",
]);

export const StrokeType = z.enum([
  "BACKSTROKE",
  "BREASTSTROKE",
  "BUTTERFLY",
  "FREESTYLE",
  "MIXED",
  "IM",
  "RIMO",
  "CHOICE",
]);

export const DrillType = z.enum(["KICK", "PULL", "DRILL", "BUTTERFLY"]);

export const EquipmentType = z.enum([
  "NONE",
  "SWIM_FINS",
  "SWIM_KICKBOARD",
  "SWIM_PADDLES",
  "SWIM_PULL_BUOY",
  "SWIM_SNORKEL",
]);

export const WeightDisplayUnit = z.enum(["KILOGRAM", "POUND"]);

export const PoolLengthUnit = z.enum(["YARD", "METER"]);

/** --- Contraintes génériques --- */
const nullable = <T extends z.ZodTypeAny>(schema: T) => schema.nullable().optional();

/** --- Step simple --- */
const WorkoutStepSchema = z
  .object({
    type: z.literal("WorkoutStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: nullable(RepeatType),
    repeatValue: nullable(z.number()),
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.null().optional(), // un WorkoutStep n'a pas d'enfants
    intensity: Intensity,
    description: z.string().max(512).nullable(),
    durationType: DurationType,
    durationValue: nullable(z.number()),
    durationValueType: nullable(z.enum(["PERCENT"])),

    equipmentType: nullable(EquipmentType),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(WeightDisplayUnit),

    targetType: nullable(TargetType),
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(SecondaryTargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(StrokeType),
    drillType: nullable(DrillType),
  })
  .strict()
  /** Durée cohérente selon le type */
  .superRefine((s, ctx) => {
    const description = typeof s.description === "string" ? s.description : "";

    if (s.durationType === "OPEN") {
      if (s.durationValue != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "durationType OPEN => durationValue doit être null.",
        });
      }
      if (s.durationValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "durationType OPEN => durationValueType doit être null.",
        });
      }
    } else {
      const value = s.durationValue;
      if (value == null || Number.isNaN(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "durationValue est requis lorsque durationType est défini.",
        });
        return;
      }

      const positiveIntegerTypes = ["TIME", "DISTANCE", "REPS", "FIXED_REPETITION", "FIXED_REST"];
      if (positiveIntegerTypes.includes(s.durationType) && (!Number.isInteger(value) || value <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${s.durationType} => durationValue doit être un entier positif.`,
        });
      }

      if (s.durationType === "REPETITION_SWIM_CSS_OFFSET" && (value < -60 || value > 60)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "REPETITION_SWIM_CSS_OFFSET => durationValue doit être compris entre -60 et 60.",
        });
      }

      const percentageDurationTypes = [
        "HR_LESS_THAN",
        "HR_GREATER_THAN",
        "POWER_LESS_THAN",
        "POWER_GREATER_THAN",
        "TIME_AT_VALID_CDA",
      ];
      if (percentageDurationTypes.includes(s.durationType)) {
        if (s.durationValueType !== "PERCENT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${s.durationType} => durationValueType doit être 'PERCENT'.`,
          });
        }
      } else if (s.durationValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "durationValueType ne s'utilise que pour les durées HR/POWER (PERCENT).",
        });
      }
    }

    if (s.repeatType != null || s.repeatValue != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "repeatType/repeatValue ne sont pas autorisés sur WorkoutStep (utiliser WorkoutRepeatStep).",
      });
    }

    if (s.targetType === "OPEN") {
      if (s.targetValue != null || s.targetValueLow != null || s.targetValueHigh != null || s.targetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetType OPEN => targetValue/Low/High/Type doivent être null.",
        });
      }
    }

    if (s.targetType && s.targetType !== "OPEN") {
      if (s.targetValue != null && (s.targetValueLow != null || s.targetValueHigh != null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetValue et targetValueLow/High ne peuvent pas être utilisés simultanément.",
        });
      }
      if (["HEART_RATE", "POWER"].includes(s.targetType) && (s.targetValueLow != null || s.targetValueHigh != null)) {
        if (s.targetValueType !== "PERCENT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "HEART_RATE/POWER => targetValueType doit être 'PERCENT' pour les plages personnalisées.",
          });
        }
      }
    }

    if (s.targetValue != null) {
      if (!["HEART_RATE", "POWER"].includes(s.targetType ?? "")) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetValue ne peut être utilisé qu'avec HEART_RATE ou POWER (zones prédéfinies).",
        });
      } else if (!Number.isInteger(s.targetValue) || s.targetValue <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetValue doit être un entier positif représentant une zone.",
        });
      } else if (
        (s.targetType === "HEART_RATE" && (s.targetValue < 1 || s.targetValue > 5)) ||
        (s.targetType === "POWER" && (s.targetValue < 1 || s.targetValue > 7))
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "targetValue hors plage autorisée (HEART_RATE 1-5, POWER 1-7).",
        });
      }
    }

    if (s.targetValueLow != null && s.targetValueHigh != null && s.targetValueLow >= s.targetValueHigh) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "targetValueLow doit être strictement inférieur à targetValueHigh.",
      });
    }

    if (["HEART_RATE", "POWER"].includes(s.targetType ?? "")) {
      if (s.targetValue != null) {
        if (s.targetValueLow != null || s.targetValueHigh != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Lorsque targetValue est utilisé, targetValueLow/High doivent rester null.",
          });
        }
      } else if (s.targetValueLow == null || s.targetValueHigh == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "HEART_RATE/POWER => targetValueLow et targetValueHigh requis si targetValue n'est pas fourni.",
        });
      }
    } else if (
      ["SPEED", "PACE", "CADENCE", "GRADE", "RESISTANCE", "POWER_3S", "POWER_10S", "POWER_30S", "POWER_LAP", "SPEED_LAP", "HEART_RATE_LAP"].includes(
        s.targetType ?? "",
      )
    ) {
      if (s.targetValueLow == null || s.targetValueHigh == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${s.targetType} => targetValueLow et targetValueHigh sont requis.`,
        });
      }
    }

    if (s.secondaryTargetType && s.targetType && s.secondaryTargetType === s.targetType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le secondaryTargetType doit différer du targetType.",
      });
    }

    if (s.secondaryTargetType === "SWIM_INSTRUCTION") {
      if (
        s.secondaryTargetValueLow == null ||
        s.secondaryTargetValueHigh != null ||
        s.secondaryTargetValueType != null
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_INSTRUCTION => utilise secondaryTargetValueLow (1-10) uniquement.",
        });
      } else if (s.secondaryTargetValueLow < 1 || s.secondaryTargetValueLow > 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_INSTRUCTION => secondaryTargetValueLow doit être compris entre 1 et 10.",
        });
      }
      if (s.secondaryTargetValue != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_INSTRUCTION n'utilise pas secondaryTargetValue.",
        });
      }
    }

    if (s.secondaryTargetType === "SWIM_CSS_OFFSET") {
      if (s.secondaryTargetValueLow == null || s.secondaryTargetValueLow < -60 || s.secondaryTargetValueLow > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_CSS_OFFSET => secondaryTargetValueLow doit être renseigné entre -60 et 60.",
        });
      }
      if (s.secondaryTargetValueHigh != null || s.secondaryTargetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_CSS_OFFSET n'utilise pas secondaryTargetValueHigh ni secondaryTargetValueType.",
        });
      }
      if (s.secondaryTargetValue != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "SWIM_CSS_OFFSET n'utilise pas secondaryTargetValue.",
        });
      }
    }

    if (s.secondaryTargetType === "PACE_ZONE") {
      if (s.secondaryTargetValueLow == null || s.secondaryTargetValueHigh != null || s.secondaryTargetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PACE_ZONE => renseigne secondaryTargetValueLow (m/s) uniquement.",
        });
      }
      if (s.secondaryTargetValue != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "PACE_ZONE n'utilise pas secondaryTargetValue.",
        });
      }
    }

    const secondaryRangeTargets = [
      "SPEED",
      "PACE",
      "CADENCE",
      "POWER",
      "HEART_RATE",
      "GRADE",
      "RESISTANCE",
      "POWER_3S",
      "POWER_10S",
      "POWER_30S",
      "POWER_LAP",
      "SPEED_LAP",
      "HEART_RATE_LAP",
    ];
    if (secondaryRangeTargets.includes(s.secondaryTargetType ?? "")) {
      if (s.secondaryTargetValueLow == null || s.secondaryTargetValueHigh == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "secondaryTargetValueLow/High requis pour ce secondaryTargetType.",
        });
      }
      if (["HEART_RATE", "POWER"].includes(s.secondaryTargetType ?? "") && s.secondaryTargetValueType !== "PERCENT") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "secondaryTargetValueType doit être 'PERCENT' pour les cibles secondaires HR/POWER.",
        });
      }
      if (!["HEART_RATE", "POWER"].includes(s.secondaryTargetType ?? "") && s.secondaryTargetValueType != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "secondaryTargetValueType n'est utilisé que pour HEART_RATE/POWER en secondary target.",
        });
      }
    }

    if (s.drillType && !s.strokeType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "strokeType requis lorsque drillType est défini.",
      });
    }
  });

/** --- Step répété (contient des WorkoutStep enfants) --- */
const WorkoutRepeatStepSchema = z
  .object({
    type: z.literal("WorkoutRepeatStep"),
    stepId: nullable(z.string()),
    stepOrder: z.number().int().positive(),
    repeatType: RepeatType,
    repeatValue: z.number().positive(),
    skipLastRestStep: z.boolean().optional().default(false),
    steps: z.array(WorkoutStepSchema).min(1), // enfants = WorkoutStep uniquement
    intensity: Intensity,
    description: z.string().max(512).nullable(),

    durationType: nullable(DurationType),
    durationValue: nullable(z.number()),
    durationValueType: nullable(z.string()),

    equipmentType: nullable(EquipmentType),
    exerciseCategory: nullable(z.string()),
    exerciseName: nullable(z.string()),
    weightValue: nullable(z.number()),
    weightDisplayUnit: nullable(WeightDisplayUnit),

    targetType: nullable(TargetType),
    targetValue: nullable(z.number()),
    targetValueLow: nullable(z.number()),
    targetValueHigh: nullable(z.number()),
    targetValueType: nullable(z.enum(["PERCENT"])),

    secondaryTargetType: nullable(SecondaryTargetType),
    secondaryTargetValue: nullable(z.number()),
    secondaryTargetValueLow: nullable(z.number()),
    secondaryTargetValueHigh: nullable(z.number()),
    secondaryTargetValueType: nullable(z.enum(["PERCENT"])),

    strokeType: nullable(StrokeType),
    drillType: nullable(DrillType),
  })
  .strict()
  .superRefine((step, ctx) => {
    const description = typeof step.description === "string" ? step.description : "";
    const implicitRepeatPattern = /\b\d+\s*[x×]\s*\d/i;
    if (implicitRepeatPattern.test(description)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "description mentionne une répétition 'N × ...' mais les répétitions doivent être définies via repeatValue/steps.",
        path: ["description"],
      });
    }

    if (step.durationType != null || step.durationValue != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "WorkoutRepeatStep ne doit pas avoir de duration propre (durées dans ses steps enfants).",
      });
    }

    let lastChildOrder = 0;
    step.steps.forEach((child, index) => {
      if (child.stepOrder <= lastChildOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "stepOrder doit être strictement croissant dans un WorkoutRepeatStep.",
          path: ["steps", index, "stepOrder"],
        });
      }
      lastChildOrder = child.stepOrder;
    });
  });

/** --- Union de steps --- */
export const Step = z.union([WorkoutStepSchema, WorkoutRepeatStepSchema]);

/** --- Segment --- */
export const Segment = z
  .object({
    segmentOrder: z.number().int().positive(),
    sport: Sport,
    description: z.string().max(512).nullable().optional(),
    estimatedDurationInSecs: nullable(z.number().nonnegative()),
    estimatedDistanceInMeters: nullable(z.number()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(PoolLengthUnit),
    steps: z.array(Step).min(1),
  })
  .strict()
  .superRefine((segment, ctx) => {
    let lastOrder = 0;
    segment.steps.forEach((step, index) => {
      if (step.stepOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "stepOrder doit être strictement croissant dans un segment.",
          path: ["steps", index, "stepOrder"],
        });
      }
      lastOrder = step.stepOrder;
    });

    if (segment.sport === "LAP_SWIMMING") {
      const ensureSwimCompliance = (step: z.infer<typeof Step>, path: (string | number)[]) => {
        if (step.targetType != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Pour la natation, targetType doit être null (utiliser les secondaryTarget).",
            path: [...path, "targetType"],
          });
        }
        if (step.strokeType == null && (step.drillType != null || step.equipmentType != null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "strokeType doit être renseigné lorsque drillType ou equipmentType est défini (natation).",
            path: [...path, "strokeType"],
          });
        }
        const allowedSecondary = new Set(["PACE_ZONE", "SWIM_INSTRUCTION", "SWIM_CSS_OFFSET"]);
        if (step.secondaryTargetType != null && !allowedSecondary.has(step.secondaryTargetType)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "En natation, secondaryTargetType doit être PACE_ZONE, SWIM_INSTRUCTION ou SWIM_CSS_OFFSET.",
            path: [...path, "secondaryTargetType"],
          });
        }
        if (step.type === "WorkoutStep" && step.durationType === "TIME" && typeof step.durationValue === "number") {
          if (step.durationValue < 60 || step.durationValue > 3540) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Natation TIME => durationValue doit être compris entre 60 et 3540 secondes.",
              path: [...path, "durationValue"],
            });
          }
        }
        if (step.type === "WorkoutRepeatStep") {
          step.steps.forEach((child, childIndex) => {
            ensureSwimCompliance(child, [...path, "steps", childIndex]);
          });
        }
      };

      segment.steps.forEach((step, index) => ensureSwimCompliance(step, ["steps", index]));
    } else {
      const ensureLandCompliance = (step: z.infer<typeof Step>, path: (string | number)[]) => {
        if (step.intensity === "MAIN") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "L'intensité MAIN est réservée aux segments LAP_SWIMMING.",
            path: [...path, "intensity"],
          });
        }
        if (step.strokeType != null || step.drillType != null || step.equipmentType != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "strokeType, drillType et equipmentType sont réservés aux segments de natation.",
            path: [...path, "strokeType"],
          });
        }
        if (step.type === "WorkoutRepeatStep") {
          step.steps.forEach((child, childIndex) => ensureLandCompliance(child, [...path, "steps", childIndex]));
        }
      };

      segment.steps.forEach((step, index) => ensureLandCompliance(step, ["steps", index]));
    }

    const ensureSecondaryTargetRules = (step: z.infer<typeof Step>, path: (string | number)[]) => {
      if (segment.sport !== "LAP_SWIMMING") {
        if (step.secondaryTargetType != null && (step.targetType === "OPEN" || step.targetType == null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Lorsque secondaryTargetType est défini (hors natation), targetType doit être renseigné et différent de OPEN.",
            path: [...path, "secondaryTargetType"],
          });
        }
      }
      if (step.type === "WorkoutRepeatStep") {
        step.steps.forEach((child, childIndex) => ensureSecondaryTargetRules(child, [...path, "steps", childIndex]));
      }
    };

    const ensureExerciseMetadata = (step: z.infer<typeof Step>, path: (string | number)[]) => {
      if (step.type === "WorkoutRepeatStep") {
        if (step.exerciseCategory != null || step.exerciseName != null) {
          if (step.exerciseCategory != null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "WorkoutRepeatStep ne doit pas définir exerciseCategory.",
              path: [...path, "exerciseCategory"],
            });
          }
          if (step.exerciseName != null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "WorkoutRepeatStep ne doit pas définir exerciseName.",
              path: [...path, "exerciseName"],
            });
          }
        }
        if (step.weightValue != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "WorkoutRepeatStep ne doit pas définir weightValue.",
            path: [...path, "weightValue"],
          });
        }
        if (step.weightDisplayUnit != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "WorkoutRepeatStep ne doit pas définir weightDisplayUnit.",
            path: [...path, "weightDisplayUnit"],
          });
        }
        step.steps.forEach((child, childIndex) => ensureExerciseMetadata(child, [...path, "steps", childIndex]));
        return;
      }

      const requiresExercise = SPORTS_REQUIRING_EXERCISE_METADATA.has(segment.sport as GarminExerciseSport);
      const category = step.exerciseCategory;
      const name = step.exerciseName;
      const hasCategory = typeof category === "string" && category.trim().length > 0;
      const hasName = typeof name === "string" && name.trim().length > 0;

      if (requiresExercise) {
        if (!hasCategory) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "exerciseCategory est requis pour ce sport.",
            path: [...path, "exerciseCategory"],
          });
        }
        if (!hasName) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "exerciseName est requis pour ce sport.",
            path: [...path, "exerciseName"],
          });
        }
        if (hasCategory && !hasGarminExerciseCategory(segment.sport, category ?? null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `exerciseCategory inconnu pour ${segment.sport}.`,
            path: [...path, "exerciseCategory"],
          });
        }
        if (hasCategory && hasName && !isKnownGarminExercise(segment.sport, category ?? null, name ?? null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `exerciseName inconnu pour la catégorie ${category}.`,
            path: [...path, "exerciseName"],
          });
        }
      } else if (category != null || name != null) {
        if (category != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "exerciseCategory n'est pas autorisé pour ce sport.",
            path: [...path, "exerciseCategory"],
          });
        }
        if (name != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "exerciseName n'est pas autorisé pour ce sport.",
            path: [...path, "exerciseName"],
          });
        }
      }

      if (segment.sport === "STRENGTH_TRAINING") {
        if (step.weightValue != null) {
          if (typeof step.weightValue !== "number" || step.weightValue <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "weightValue doit être un nombre positif.",
              path: [...path, "weightValue"],
            });
          }
          if (step.weightDisplayUnit == null) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "weightDisplayUnit est requis lorsque weightValue est renseigné.",
              path: [...path, "weightDisplayUnit"],
            });
          }
        } else if (step.weightDisplayUnit != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "weightDisplayUnit ne peut être défini sans weightValue.",
            path: [...path, "weightDisplayUnit"],
          });
        }
      } else if (step.weightValue != null || step.weightDisplayUnit != null) {
        if (step.weightValue != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "weightValue est réservé aux entraînements de musculation.",
            path: [...path, "weightValue"],
          });
        }
        if (step.weightDisplayUnit != null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "weightDisplayUnit est réservé aux entraînements de musculation.",
            path: [...path, "weightDisplayUnit"],
          });
        }
      }

      const repsAllowedSports: GarminExerciseSport[] = ["STRENGTH_TRAINING", "CARDIO_TRAINING"];
      if (
        step.durationType === "REPS" &&
        !repsAllowedSports.includes(segment.sport as GarminExerciseSport)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "durationType REPS n'est autorisé que pour STRENGTH_TRAINING ou CARDIO_TRAINING.",
          path: [...path, "durationType"],
        });
      }
    };

    segment.steps.forEach((step, index) => ensureExerciseMetadata(step, ["steps", index]));
    segment.steps.forEach((step, index) => ensureSecondaryTargetRules(step, ["steps", index]));
  });

type StepType = z.infer<typeof Step>;

const countSteps = (steps: StepType[]): number =>
  steps.reduce((total, step) => {
    if (step.type === "WorkoutRepeatStep") {
      return total + countSteps(step.steps as StepType[]);
    }
    return total + 1;
  }, 0);

/** --- Workout racine --- */
export const GarminWorkoutSchema = z
  .object({
    ownerId: nullable(z.union([z.string(), z.number()])),
    workoutName: z.string().min(1).max(255),
    description: nullable(z.string().max(1024)),
    sport: Sport,
    estimatedDurationInSecs: nullable(z.number().nonnegative()),
    estimatedDistanceInMeters: nullable(z.number()),
    poolLength: nullable(z.number()),
    poolLengthUnit: nullable(PoolLengthUnit),
    workoutProvider: z.string().min(1).max(20),
    workoutSourceId: z.string().min(1).max(20),
    isSessionTransitionEnabled: z.boolean(),
    segments: z.array(Segment).min(1),
  })
  .strict()
  .superRefine((workout, ctx) => {
    let lastOrder = 0;
    workout.segments.forEach((segment, index) => {
      if (segment.segmentOrder <= lastOrder) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "segmentOrder doit être strictement croissant.",
          path: ["segments", index, "segmentOrder"],
        });
      }
      lastOrder = segment.segmentOrder;
    });

    if (workout.poolLength == null && workout.poolLengthUnit != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "poolLengthUnit ne peut être défini sans poolLength.",
        path: ["poolLengthUnit"],
      });
    }

    if (workout.sport === "MULTI_SPORT") {
      if (workout.segments.length > 25) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un workout MULTI_SPORT ne peut contenir plus de 25 segments.",
          path: ["segments"],
        });
      }
      const totalSteps = workout.segments.reduce((sum, segment) => sum + countSteps(segment.steps as StepType[]), 0);
      if (totalSteps > 250) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un workout MULTI_SPORT ne peut contenir plus de 250 steps au total.",
          path: ["segments"],
        });
      }
      if (!workout.isSessionTransitionEnabled) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "isSessionTransitionEnabled doit être true pour un workout MULTI_SPORT.",
          path: ["isSessionTransitionEnabled"],
        });
      }
      workout.segments.forEach((segment, index) => {
        if (segment.sport === "MULTI_SPORT") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Les segments d'un multi-sport ne peuvent pas avoir le sport MULTI_SPORT.",
            path: ["segments", index, "sport"],
          });
        }
      });
    } else {
      if (workout.segments.length !== 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un entraînement mono-sport doit contenir un seul segment.",
          path: ["segments"],
        });
      } else if (workout.segments[0]?.sport && workout.segments[0].sport !== workout.sport) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Le sport du segment unique doit correspondre au sport du workout.",
          path: ["segments", 0, "sport"],
        });
      }
      if (workout.sport !== "LAP_SWIMMING" && (workout.poolLength != null || workout.poolLengthUnit != null)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "poolLength/poolLengthUnit ne sont valides que pour la natation en piscine.",
          path: ["poolLength"],
        });
      }
      const segmentSteps = countSteps(workout.segments[0].steps as StepType[]);
      if (segmentSteps > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Un workout mono-sport ne peut contenir plus de 100 steps.",
          path: ["segments", 0, "steps"],
        });
      }
    }

    const swimSegments = workout.segments
      .map((segment, index) => ({ segment, index }))
      .filter(({ segment }) => segment.sport === "LAP_SWIMMING");

    if (swimSegments.length > 0) {
      const referenceLength = workout.poolLength ?? swimSegments[0].segment.poolLength ?? null;
      const referenceUnit = workout.poolLengthUnit ?? swimSegments[0].segment.poolLengthUnit ?? null;

      swimSegments.forEach(({ segment, index }) => {
        if ((segment.poolLength == null) !== (segment.poolLengthUnit == null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLength et poolLengthUnit doivent être fournis ensemble pour la natation.",
            path: ["segments", index, "poolLength"],
          });
        }

        if (referenceLength != null && segment.poolLength != null && segment.poolLength !== referenceLength) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLength doit être identique entre le workout et les segments natation.",
            path: ["segments", index, "poolLength"],
          });
        }

        if (referenceUnit != null && segment.poolLengthUnit != null && segment.poolLengthUnit !== referenceUnit) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "poolLengthUnit doit être identique entre le workout et les segments natation.",
            path: ["segments", index, "poolLengthUnit"],
          });
        }
      });
    }
  });
