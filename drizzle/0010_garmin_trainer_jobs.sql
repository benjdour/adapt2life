CREATE TABLE IF NOT EXISTS "garmin_trainer_jobs" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "plan_markdown" text NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "result_json" jsonb,
    "error" text,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    "processed_at" timestamp,
    CONSTRAINT "garmin_trainer_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

CREATE INDEX IF NOT EXISTS "garmin_trainer_jobs_status_idx" ON "garmin_trainer_jobs" ("status");
CREATE INDEX IF NOT EXISTS "garmin_trainer_jobs_user_idx" ON "garmin_trainer_jobs" ("user_id");
