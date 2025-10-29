CREATE TABLE "garmin_connections" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "garmin_user_id" text NOT NULL,
  "access_token_encrypted" text NOT NULL,
  "refresh_token_encrypted" text NOT NULL,
  "token_type" text NOT NULL,
  "scope" text NOT NULL,
  "access_token_expires_at" timestamptz NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
ALTER TABLE "garmin_connections" ADD CONSTRAINT "garmin_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE cascade ON UPDATE no action;
CREATE UNIQUE INDEX "garmin_connections_garmin_user_id_unique" ON "garmin_connections" ("garmin_user_id");
CREATE UNIQUE INDEX "garmin_connections_user_id_unique" ON "garmin_connections" ("user_id");
