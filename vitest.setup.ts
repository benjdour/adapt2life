import "@testing-library/jest-dom";
import { randomBytes } from "crypto";

const ensureEnv = (key: string, value: string) => {
  if (!process.env[key]) {
    process.env[key] = value;
  }
};

ensureEnv("GARMIN_CLIENT_ID", "test-client");
ensureEnv("GARMIN_CLIENT_SECRET", "test-secret");
ensureEnv("GARMIN_REDIRECT_URI", "https://example.com/api/garmin/oauth/callback");
ensureEnv("GARMIN_TOKEN_ENCRYPTION_KEY", randomBytes(32).toString("base64"));
ensureEnv("CRON_SECRET", "test-cron-secret");
