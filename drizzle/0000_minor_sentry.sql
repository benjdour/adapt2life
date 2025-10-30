CREATE TABLE "garmin_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"garmin_user_id" text NOT NULL,
	"access_token_encrypted" text NOT NULL,
	"refresh_token_encrypted" text NOT NULL,
	"token_type" text NOT NULL,
	"scope" text NOT NULL,
	"access_token_expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "garmin_webhook_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"garmin_user_id" text NOT NULL,
	"type" text NOT NULL,
	"entity_id" text,
	"payload" jsonb NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"stack_id" text NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "users_stack_id_unique" UNIQUE("stack_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"type" text NOT NULL,
	"duration" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "garmin_connections" ADD CONSTRAINT "garmin_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garmin_daily_summaries" ADD CONSTRAINT "garmin_daily_summaries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "garmin_webhook_events" ADD CONSTRAINT "garmin_webhook_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_connections_user_id_unique" ON "garmin_connections" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_connections_garmin_user_id_unique" ON "garmin_connections" USING btree ("garmin_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_daily_summaries_summary_id_unique" ON "garmin_daily_summaries" USING btree ("summary_id");--> statement-breakpoint
CREATE INDEX "garmin_webhook_events_type_idx" ON "garmin_webhook_events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "garmin_webhook_events_user_type_idx" ON "garmin_webhook_events" USING btree ("user_id","type");