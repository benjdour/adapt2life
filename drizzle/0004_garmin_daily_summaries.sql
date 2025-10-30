CREATE TABLE "garmin_daily_summaries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "garmin_user_id" text NOT NULL,
  "summary_id" text NOT NULL,
  "calendar_date" text NOT NULL,
  "steps" integer,
  "distance_meters" integer,
  "calories" integer,
  "stress_level" integer,
  "sleep_seconds" integer,
  "raw" jsonb NOT NULL,
  "created_at" timestamp DEFAULT now()
);

ALTER TABLE "garmin_daily_summaries"
  ADD CONSTRAINT "garmin_daily_summaries_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;

CREATE UNIQUE INDEX "garmin_daily_summaries_summary_id_unique"
  ON "garmin_daily_summaries" ("summary_id");
