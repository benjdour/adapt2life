CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"type" text NOT NULL,
	"duration" text,
	"created_at" timestamp DEFAULT now()
);
