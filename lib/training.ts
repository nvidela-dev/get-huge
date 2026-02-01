import { db } from "@/lib/db";
import { sessions, users, planDays, planDayExercises, exercises } from "@/lib/db/schema";
import { eq, and, gte, lte, isNotNull, count } from "drizzle-orm";
import { startOfWeek, endOfWeek, differenceInDays } from "date-fns";

interface TrainingDay {
  weekNumber: number;
  dayNumber: number;
  dayName: string;
  planDayId: string;
  exercises: {
    id: string;
    name: string;
    muscleGroup: string;
    targetSets: number;
    targetReps: string;
    rpeTarget: string | null;
  }[];
}

interface TrainingStatus {
  type: "ready" | "week_complete" | "no_plan";
  trainingDay?: TrainingDay;
  sessionsThisWeek?: number;
}

export async function getTrainingStatus(userId: string): Promise<TrainingStatus> {
  // Get user with their plan
  const userResults = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const user = userResults[0];

  if (!user || !user.currentPlanId || !user.planStartDate) {
    return { type: "no_plan" };
  }

  const today = new Date();
  const planStartDate = new Date(user.planStartDate);

  // Calculate which week of the program we're in
  const daysSinceStart = differenceInDays(today, planStartDate);
  const currentWeek = Math.floor(daysSinceStart / 7) + 1;

  // Get Monday and Sunday of current calendar week
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });

  // Count completed sessions this calendar week
  const sessionCountResult = await db
    .select({ count: count() })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.startedAt, weekStart),
        lte(sessions.startedAt, weekEnd),
        isNotNull(sessions.endedAt)
      )
    );

  const sessionsThisWeek = sessionCountResult[0]?.count ?? 0;

  // If 3 or more sessions this week, week is complete
  if (sessionsThisWeek >= 3) {
    return { type: "week_complete", sessionsThisWeek };
  }

  // Next day is sessions + 1
  const nextDayNumber = sessionsThisWeek + 1;

  // Get the plan day for this day number
  const planDayResults = await db
    .select()
    .from(planDays)
    .where(
      and(
        eq(planDays.planId, user.currentPlanId),
        eq(planDays.dayNumber, nextDayNumber)
      )
    )
    .limit(1);

  const planDay = planDayResults[0];

  if (!planDay) {
    return { type: "no_plan" };
  }

  // Get exercises for this day
  const dayExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      targetSets: planDayExercises.targetSets,
      targetReps: planDayExercises.targetReps,
      rpeTarget: planDayExercises.rpeTarget,
      order: planDayExercises.order,
    })
    .from(planDayExercises)
    .innerJoin(exercises, eq(planDayExercises.exerciseId, exercises.id))
    .where(eq(planDayExercises.planDayId, planDay.id))
    .orderBy(planDayExercises.order);

  return {
    type: "ready",
    sessionsThisWeek,
    trainingDay: {
      weekNumber: currentWeek,
      dayNumber: nextDayNumber,
      dayName: planDay.name,
      planDayId: planDay.id,
      exercises: dayExercises,
    },
  };
}

export async function startSession(
  userId: string,
  planDayId: string,
  weekNumber: number,
  dayInWeek: number
) {
  const [session] = await db
    .insert(sessions)
    .values({
      userId,
      planDayId,
      weekNumber,
      dayInWeek,
    })
    .returning();

  return session;
}

export async function endSession(sessionId: string, notes?: string) {
  const [session] = await db
    .update(sessions)
    .set({
      endedAt: new Date(),
      notes,
    })
    .where(eq(sessions.id, sessionId))
    .returning();

  return session;
}
