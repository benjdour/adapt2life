CREATE TABLE IF NOT EXISTS "ai_model_configs" (
  "feature_id" text PRIMARY KEY,
  "model_id" text NOT NULL,
  "updated_by" text,
  "updated_at" timestamp DEFAULT now()
);
