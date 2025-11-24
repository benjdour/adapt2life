CREATE TABLE "ai_model_configs" (
	"feature_id" text PRIMARY KEY NOT NULL,
	"model_id" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "garmin_pull_cursors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"garmin_user_id" text NOT NULL,
	"type" text NOT NULL,
	"last_upload_end_time" timestamp with time zone,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "garmin_trainer_jobs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"plan_markdown" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"result_json" jsonb,
	"error" text,
	"ai_raw_response" text,
	"ai_debug_payload" jsonb,
	"phase" text DEFAULT 'pending' NOT NULL,
	"ai_model_id" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"processed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "user_generated_artifacts" (
	"user_id" integer NOT NULL,
	"training_plan_markdown" text,
	"garmin_workout_json" jsonb,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_generated_artifacts_pk" PRIMARY KEY("user_id")
);
--> statement-breakpoint
ALTER TABLE "workouts" ALTER COLUMN "user_id" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pseudo" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "birth_date" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sport_level" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "height_cm" integer;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weight_kg" numeric(6, 2);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "training_goal" text;--> statement-breakpoint
ALTER TABLE "garmin_pull_cursors" ADD CONSTRAINT "garmin_pull_cursors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garmin_trainer_jobs" ADD CONSTRAINT "garmin_trainer_jobs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_generated_artifacts" ADD CONSTRAINT "user_generated_artifacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_pull_cursors_user_type_unique" ON "garmin_pull_cursors" USING btree ("user_id","type");--> statement-breakpoint
CREATE INDEX "garmin_pull_cursors_garmin_user_type_idx" ON "garmin_pull_cursors" USING btree ("garmin_user_id","type");--> statement-breakpoint
CREATE INDEX "garmin_trainer_jobs_status_idx" ON "garmin_trainer_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "garmin_trainer_jobs_user_idx" ON "garmin_trainer_jobs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "garmin_trainer_jobs_phase_idx" ON "garmin_trainer_jobs" USING btree ("phase");--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "garmin_daily_summaries_user_date_idx" ON "garmin_daily_summaries" USING btree ("garmin_user_id","calendar_date");--> statement-breakpoint
CREATE INDEX "workouts_user_id_idx" ON "workouts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workouts_type_user_idx" ON "workouts" USING btree ("type","user_id");