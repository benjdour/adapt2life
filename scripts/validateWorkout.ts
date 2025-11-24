import fs from "fs";
import { stdin } from "node:process";
import { GarminWorkoutSchema } from "../src/schemas/garminWorkout.schema";

const file = process.argv[2];
if (!file) {
  console.error("Usage: npm run validate:workout <workout.json | ->");
  process.exit(1);
}

const readFromStdin = async (): Promise<string> =>
  await new Promise((resolve, reject) => {
    let data = "";
    stdin.setEncoding("utf8");
    stdin.on("data", (chunk) => {
      data += chunk;
    });
    stdin.on("end", () => resolve(data));
    stdin.on("error", reject);
  });

const loadContent = async (): Promise<string> => {
  if (file === "-") {
    const stdinContent = await readFromStdin();
    if (!stdinContent.trim()) {
      console.error("❌ Aucun contenu reçu sur stdin.");
      process.exit(1);
    }
    return stdinContent;
  }
  return fs.readFileSync(file, "utf8");
};

const main = async () => {
  const rawContent = await loadContent();

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
};

main().catch((error) => {
  console.error("❌ Erreur lors de la validation:", error);
  process.exit(1);
});
