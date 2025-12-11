CREATE TABLE "garmin_oauth_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"state" text NOT NULL,
	"code_verifier" text NOT NULL,
	"user_id" integer NOT NULL,
	"stack_user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" varchar(255) NOT NULL,
	"title" varchar(255) NOT NULL,
	"excerpt" text NOT NULL,
	"lang" varchar(5) NOT NULL,
	"hero_image" varchar(512),
	"published_at" timestamp with time zone NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "garmin_oauth_sessions" ADD CONSTRAINT "garmin_oauth_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "garmin_oauth_sessions_state_unique" ON "garmin_oauth_sessions" USING btree ("state");--> statement-breakpoint
CREATE INDEX "garmin_oauth_sessions_expires_idx" ON "garmin_oauth_sessions" USING btree ("expires_at");