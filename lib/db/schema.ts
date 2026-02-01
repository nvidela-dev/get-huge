import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users - synced with Clerk
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  currentPlanId: uuid("current_plan_id").references(() => plans.id),
  planStartDate: date("plan_start_date"),
  weightUnit: text("weight_unit").default("kg").notNull(), // 'kg' or 'lbs'
  language: text("language").default("en").notNull(), // 'en' or 'es'
});

// Plans - loaded from JSON, not user-editable
export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").default("weightlifting").notNull(), // 'weightlifting' or 'bodyweight'
  totalWeeks: integer("total_weeks"), // null = indefinite
  daysPerWeek: integer("days_per_week").default(3).notNull(),
  isTemplate: boolean("is_template").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plan Days - e.g., "Push", "Pull", "Legs"
export const planDays = pgTable("plan_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id")
    .references(() => plans.id, { onDelete: "cascade" })
    .notNull(),
  dayNumber: integer("day_number").notNull(), // 1, 2, or 3
  name: text("name").notNull(), // e.g., "Push", "Pull", "Legs"
  weekVariant: integer("week_variant").default(1).notNull(), // for periodization
});

// Exercises - master list of exercises
export const exercises = pgTable("exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  muscleGroup: text("muscle_group").notNull(),
  isCompound: boolean("is_compound").default(false).notNull(),
  // For bodyweight progressions: links to the next harder variation
  nextProgressionId: uuid("next_progression_id"),
});

// Plan Day Exercises - which exercises on which day
export const planDayExercises = pgTable("plan_day_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  planDayId: uuid("plan_day_id")
    .references(() => planDays.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id, { onDelete: "cascade" })
    .notNull(),
  order: integer("order").notNull(),
  targetSets: integer("target_sets").notNull(),
  targetReps: text("target_reps").notNull(), // "5" or "8-12"
  defaultReps: integer("default_reps").default(8).notNull(),
  rpeTarget: decimal("rpe_target", { precision: 3, scale: 1 }),
});

// Sessions - a single workout session
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  planDayId: uuid("plan_day_id")
    .references(() => planDays.id)
    .notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
  weekNumber: integer("week_number").notNull(),
  dayInWeek: integer("day_in_week").notNull(), // 1, 2, or 3
  notes: text("notes"),
});

// Session Sets - individual sets logged during a session
export const sessionSets = pgTable("session_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .references(() => sessions.id, { onDelete: "cascade" })
    .notNull(),
  exerciseId: uuid("exercise_id")
    .references(() => exercises.id)
    .notNull(),
  setNumber: integer("set_number").notNull(),
  weight: decimal("weight", { precision: 6, scale: 2 }).notNull(),
  reps: integer("reps").notNull(),
  rpe: decimal("rpe", { precision: 3, scale: 1 }),
  isWarmup: boolean("is_warmup").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  currentPlan: one(plans, {
    fields: [users.currentPlanId],
    references: [plans.id],
  }),
  sessions: many(sessions),
}));

export const plansRelations = relations(plans, ({ many }) => ({
  planDays: many(planDays),
  users: many(users),
}));

export const planDaysRelations = relations(planDays, ({ one, many }) => ({
  plan: one(plans, {
    fields: [planDays.planId],
    references: [plans.id],
  }),
  exercises: many(planDayExercises),
  sessions: many(sessions),
}));

export const exercisesRelations = relations(exercises, ({ one, many }) => ({
  planDayExercises: many(planDayExercises),
  sessionSets: many(sessionSets),
  nextProgression: one(exercises, {
    fields: [exercises.nextProgressionId],
    references: [exercises.id],
  }),
}));

export const planDayExercisesRelations = relations(
  planDayExercises,
  ({ one }) => ({
    planDay: one(planDays, {
      fields: [planDayExercises.planDayId],
      references: [planDays.id],
    }),
    exercise: one(exercises, {
      fields: [planDayExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one, many }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
  planDay: one(planDays, {
    fields: [sessions.planDayId],
    references: [planDays.id],
  }),
  sets: many(sessionSets),
}));

export const sessionSetsRelations = relations(sessionSets, ({ one }) => ({
  session: one(sessions, {
    fields: [sessionSets.sessionId],
    references: [sessions.id],
  }),
  exercise: one(exercises, {
    fields: [sessionSets.exerciseId],
    references: [exercises.id],
  }),
}));
