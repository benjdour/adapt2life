import { index, integer, jsonb, numeric, pgTable, primaryKey, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  stackId: text("stack_id").notNull().unique(),
  name: text("name"),
  pseudo: text("pseudo"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  birthDate: text("birth_date"),
  sportLevel: integer("sport_level"),
  heightCm: integer("height_cm"),
  weightKg: numeric("weight_kg", { precision: 6, scale: 2 }),
  trainingGoal: text("training_goal"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // ex: "run", "bike", "swim"
    duration: text("duration"), // ex: "45min"
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    userIndex: index("workouts_user_id_idx").on(table.userId),
    typeUserIndex: index("workouts_type_user_idx").on(table.type, table.userId),
  }),
);

export const garminConnections = pgTable(
  "garmin_connections",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    garminUserId: text("garmin_user_id").notNull(),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted").notNull(),
    tokenType: text("token_type").notNull(),
    scope: text("scope").notNull(),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    userIdUnique: uniqueIndex("garmin_connections_user_id_unique").on(table.userId),
    garminUserUnique: uniqueIndex("garmin_connections_garmin_user_id_unique").on(table.garminUserId),
  }),
);

export const garminDailySummaries = pgTable(
  "garmin_daily_summaries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    garminUserId: text("garmin_user_id").notNull(),
    summaryId: text("summary_id").notNull(),
    calendarDate: text("calendar_date").notNull(),
    steps: integer("steps"),
    distanceMeters: integer("distance_meters"),
    calories: integer("calories"),
    stressLevel: integer("stress_level"),
    sleepSeconds: integer("sleep_seconds"),
    raw: jsonb("raw").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    summaryIdUnique: uniqueIndex("garmin_daily_summaries_summary_id_unique").on(table.summaryId),
    garminUserDateIdx: index("garmin_daily_summaries_user_date_idx").on(table.garminUserId, table.calendarDate),
  }),
);

export const garminWebhookEvents = pgTable(
  "garmin_webhook_events",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    garminUserId: text("garmin_user_id").notNull(),
    type: text("type").notNull(),
    entityId: text("entity_id"),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => ({
    typeIndex: index("garmin_webhook_events_type_idx").on(table.type),
    userTypeIndex: index("garmin_webhook_events_user_type_idx").on(table.userId, table.type),
  }),
);

export const garminPullCursors = pgTable(
  "garmin_pull_cursors",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    garminUserId: text("garmin_user_id").notNull(),
    type: text("type").notNull(),
    lastUploadEndTime: timestamp("last_upload_end_time", { withTimezone: true }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    userTypeUnique: uniqueIndex("garmin_pull_cursors_user_type_unique").on(table.userId, table.type),
    garminCursorIdx: index("garmin_pull_cursors_garmin_user_type_idx").on(table.garminUserId, table.type),
  }),
);

export const userGeneratedArtifacts = pgTable(
  "user_generated_artifacts",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trainingPlanMarkdown: text("training_plan_markdown"),
    garminWorkoutJson: jsonb("garmin_workout_json"),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId], name: "user_generated_artifacts_pk" }),
  }),
);

export const garminTrainerJobs = pgTable(
  "garmin_trainer_jobs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planMarkdown: text("plan_markdown").notNull(),
    status: text("status").notNull().default("pending"),
    resultJson: jsonb("result_json"),
    error: text("error"),
    aiRawResponse: text("ai_raw_response"),
    aiDebugPayload: jsonb("ai_debug_payload"),
    phase: text("phase").notNull().default("pending"),
    aiModelId: text("ai_model_id"),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
    processedAt: timestamp("processed_at"),
  },
  (table) => ({
    statusIndex: index("garmin_trainer_jobs_status_idx").on(table.status),
    userIndex: index("garmin_trainer_jobs_user_idx").on(table.userId),
    phaseIndex: index("garmin_trainer_jobs_phase_idx").on(table.phase),
  }),
);

export const aiModelConfigs = pgTable("ai_model_configs", {
  featureId: text("feature_id").primaryKey(),
  modelId: text("model_id").notNull(),
  updatedBy: text("updated_by"),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
});
