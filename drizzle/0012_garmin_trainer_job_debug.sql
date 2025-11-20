ALTER TABLE "garmin_trainer_jobs"
ADD COLUMN "ai_raw_response" text,
ADD COLUMN "ai_debug_payload" jsonb;
