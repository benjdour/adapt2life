import { index, integer, jsonb, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  stackId: text("stack_id").notNull().unique(),
  name: text("name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  gender: text("gender"),
  birthDate: text("birth_date"),
  sportLevel: integer("sport_level"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workouts = pgTable("workouts", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").notNull(),
  type: text("type").notNull(), // ex: "run", "bike", "swim"
  duration: text("duration"),   // ex: "45min"
  createdAt: timestamp("created_at").defaultNow(),
});

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
