CREATE TABLE IF NOT EXISTS "garmin_pull_cursors" (
    "id" serial PRIMARY KEY NOT NULL,
    "user_id" integer NOT NULL,
    "garmin_user_id" text NOT NULL,
    "type" text NOT NULL,
    "last_upload_end_time" timestamptz,
    "created_at" timestamp DEFAULT now(),
    "updated_at" timestamp DEFAULT now(),
    CONSTRAINT "garmin_pull_cursors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade
);

CREATE UNIQUE INDEX IF NOT EXISTS "garmin_pull_cursors_user_type_unique" ON "garmin_pull_cursors" ("user_id", "type");
