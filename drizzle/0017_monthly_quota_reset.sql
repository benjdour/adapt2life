ALTER TABLE "users" ADD COLUMN "last_quota_reset_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "users" SET "plan_type" = 'paid_full' WHERE "plan_type" = 'paid_unlimited';
