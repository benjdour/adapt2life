import fs from "fs";
import { GarminWorkoutSchema } from "../src/schemas/garminWorkout.schema";

const file = process.argv[2];
if (!file) {
  console.error("Usage: ts-node scripts/validateWorkout.ts <workout.json>");
  process.exit(1);
}

const rawContent = fs.readFileSync(file, "utf8");

let parsedJson: unknown;
try {
  parsedJson = JSON.parse(rawContent);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("❌ JSON invalide (parse error):", message);
  process.exit(1);
}

const validation = GarminWorkoutSchema.safeParse(parsedJson);
if (!validation.success) {
  console.error("❌ Validation échouée. Détails:");
  for (const issue of validation.error.issues) {
    console.error("-", issue.message, "(@ path:", issue.path.join(".") || "root", ")");
  }
  process.exit(1);
}

console.log("✅ Workout valide selon Zod (Garmin Training API V2).");
