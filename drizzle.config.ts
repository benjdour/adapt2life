import { existsSync } from "node:fs";
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

const baseEnvFile = ".env";
if (existsSync(baseEnvFile)) {
  config({ path: baseEnvFile });
}

const localEnvFile = ".env.local";
if (existsSync(localEnvFile)) {
  config({ path: localEnvFile, override: true });
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
