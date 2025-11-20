import { tool } from "ai";

import { searchGarminExercises, type ExerciseLookupResult } from "@/lib/services/exerciseLookup";
import { createLogger } from "@/lib/logger";

const logger = createLogger("exercise-lookup");

type ExerciseLookupInput = {
  query: string;
  sport?: string;
};

export const exerciseLookupTool = tool<ExerciseLookupInput, ExerciseLookupResult[]>({
  name: "exercise_lookup",
  description:
    "Recherche un exercice Garmin exact à partir d'un libellé humain. Entrée attendue: { \"query\": string, \"sport\"?: string }.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Description libre de l'exercice (toutes langues)",
      },
      sport: {
        type: "string",
        description: "Sport cible (STRENGTH_TRAINING, CARDIO_TRAINING, etc.)",
      },
    },
    required: ["query"],
  },
  execute: async ({ query, sport }) => {
    const results = searchGarminExercises(query, { sport: sport ?? null, limit: 10 });
    try {
      logger.info("exercise_lookup", {
        query,
        sport: sport ?? null,
        hits: results.length,
      });
    } catch {
      // logging failures shouldn't block tool response
    }
    return results;
  },
});
