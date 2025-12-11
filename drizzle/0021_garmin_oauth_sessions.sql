CREATE TABLE IF NOT EXISTS "garmin_oauth_sessions" (
  "id" serial PRIMARY KEY NOT NULL,
  "state" text NOT NULL,
  "code_verifier" text NOT NULL,
  "user_id" integer NOT NULL,
  "stack_user_id" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now()
);

ALTER TABLE "garmin_oauth_sessions"
  ADD CONSTRAINT "garmin_oauth_sessions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users" ("id")
  ON DELETE cascade;

CREATE UNIQUE INDEX IF NOT EXISTS "garmin_oauth_sessions_state_unique"
  ON "garmin_oauth_sessions" ("state");

CREATE INDEX IF NOT EXISTS "garmin_oauth_sessions_expires_idx"
  ON "garmin_oauth_sessions" ("expires_at");
