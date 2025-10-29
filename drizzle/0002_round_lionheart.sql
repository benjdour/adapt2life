ALTER TABLE "users" ADD COLUMN "stack_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stack_id_unique" UNIQUE("stack_id");