import { z } from "zod";

const envSchema = z.object({
  GARMIN_CLIENT_ID: z.string().min(1, "GARMIN_CLIENT_ID is required"),
  GARMIN_CLIENT_SECRET: z.string().min(1, "GARMIN_CLIENT_SECRET is required"),
  GARMIN_REDIRECT_URI: z.string().url("GARMIN_REDIRECT_URI must be a valid URL"),
  CRON_SECRET: z.string().min(1, "CRON_SECRET is required").default("dev-cron-secret"),
  GARMIN_TOKEN_ENCRYPTION_KEY: z
    .string()
    .min(1, "GARMIN_TOKEN_ENCRYPTION_KEY is required")
    .refine(
      (value) => {
        try {
          return Buffer.from(value, "base64").length === 32;
        } catch {
          return false;
        }
      },
      { message: "GARMIN_TOKEN_ENCRYPTION_KEY must be a base64 string for a 32-byte key" },
    ),
  APP_URL: z.string().url().optional(),
});

const rawEnv = {
  GARMIN_CLIENT_ID: process.env.GARMIN_CLIENT_ID,
  GARMIN_CLIENT_SECRET: process.env.GARMIN_CLIENT_SECRET,
  GARMIN_REDIRECT_URI: process.env.GARMIN_REDIRECT_URI,
  CRON_SECRET: process.env.CRON_SECRET,
  GARMIN_TOKEN_ENCRYPTION_KEY: process.env.GARMIN_TOKEN_ENCRYPTION_KEY,
  APP_URL: process.env.APP_URL,
};

const trimmedEnv = Object.fromEntries(
  Object.entries(rawEnv).map(([key, value]) => [key, typeof value === "string" ? value.trim() : value]),
) as typeof rawEnv;

export const env = envSchema.parse(trimmedEnv);

export type Env = typeof env;
