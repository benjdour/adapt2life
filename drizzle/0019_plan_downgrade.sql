ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "plan_downgrade_at" timestamp with time zone;
