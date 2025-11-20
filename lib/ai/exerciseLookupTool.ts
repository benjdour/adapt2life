import { Tool } from "ai";

import { searchGarminExercises } from "@/lib/services/exerciseLookup";
import { createLogger } from "@/lib/logger";

const logger = createLogger("exercise-lookup");

export const exerciseLookupTool = new Tool({
  name: "exercise_lookup",
  description:
    "Recherche un exercice Garmin exact à partir d'un libellé humain. Entrée attendue: { \"query\": string, \"sport\"?: string }.",
  parameters: {
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
  async execute({ query, sport }: { query: string; sport?: string }) {
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
