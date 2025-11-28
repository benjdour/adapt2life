ALTER TABLE "garmin_trainer_jobs" ADD COLUMN "conversion_credit_reserved" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "training_generations_remaining" integer DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "garmin_conversions_remaining" integer DEFAULT 5 NOT NULL;