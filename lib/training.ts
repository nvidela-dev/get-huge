import { db } from "@/lib/db";
import { sessions, users, planDays, planDayExercises, exercises, sessionSets } from "@/lib/db/schema";
import { eq, and, gte, lte, lt, isNotNull, isNull, count, desc } from "drizzle-orm";
import { startOfWeek, endOfWeek, differenceInDays, startOfDay, endOfDay, subDays } from "date-fns";

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

interface TodaysWorkout {
  sessionId: string;
  dayName: string;
  weekNumber: number;
  dayNumber: number;
  startedAt: Date;
  endedAt: Date;
  totalSets: number;
  exercises: {
    name: string;
    sets: number;
  }[];
}

interface InProgressSession {
  sessionId: string;
  dayName: string;
  weekNumber: number;
  dayNumber: number;
  startedAt: Date;
  totalSets: number;
}

interface TrainingStatus {
  type: "ready" | "week_complete" | "no_plan" | "trained_today" | "recovery_day" | "session_in_progress";
  trainingDay?: TrainingDay;
  sessionsThisWeek?: number;
  todaysWorkout?: TodaysWorkout;
  inProgressSession?: InProgressSession;
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
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  const yesterday = subDays(today, 1);
  const yesterdayStart = startOfDay(yesterday);
  const yesterdayEnd = endOfDay(yesterday);

  // Check for in-progress session (started but not ended)
  const inProgressResults = await db
    .select({
      id: sessions.id,
      weekNumber: sessions.weekNumber,
      dayInWeek: sessions.dayInWeek,
      startedAt: sessions.startedAt,
      planDayId: sessions.planDayId,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.startedAt, todayStart),
        lte(sessions.startedAt, todayEnd),
        isNull(sessions.endedAt)
      )
    )
    .orderBy(desc(sessions.startedAt))
    .limit(1);

  const inProgressSession = inProgressResults[0];

  if (inProgressSession) {
    // Get the plan day name
    const planDayResult = await db
      .select({ name: planDays.name })
      .from(planDays)
      .where(eq(planDays.id, inProgressSession.planDayId))
      .limit(1);

    // Get total sets logged so far
    const setsResult = await db
      .select({ count: count() })
      .from(sessionSets)
      .where(eq(sessionSets.sessionId, inProgressSession.id));

    return {
      type: "session_in_progress",
      inProgressSession: {
        sessionId: inProgressSession.id,
        dayName: planDayResult[0]?.name ?? "Workout",
        weekNumber: inProgressSession.weekNumber,
        dayNumber: inProgressSession.dayInWeek,
        startedAt: inProgressSession.startedAt,
        totalSets: setsResult[0]?.count ?? 0,
      },
    };
  }

  // Check for completed session today
  const todaySessionResults = await db
    .select({
      id: sessions.id,
      weekNumber: sessions.weekNumber,
      dayInWeek: sessions.dayInWeek,
      startedAt: sessions.startedAt,
      endedAt: sessions.endedAt,
      planDayId: sessions.planDayId,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.startedAt, todayStart),
        lte(sessions.startedAt, todayEnd),
        isNotNull(sessions.endedAt)
      )
    )
    .orderBy(desc(sessions.endedAt))
    .limit(1);

  const todaySession = todaySessionResults[0];

  // If user trained today, show today's workout summary
  if (todaySession) {
    // Get the plan day name
    const planDayResult = await db
      .select({ name: planDays.name })
      .from(planDays)
      .where(eq(planDays.id, todaySession.planDayId))
      .limit(1);

    // Get exercise summary for today's session
    const exerciseSummary = await db
      .select({
        name: exercises.name,
        setCount: count(),
      })
      .from(sessionSets)
      .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
      .where(eq(sessionSets.sessionId, todaySession.id))
      .groupBy(exercises.name);

    const totalSets = exerciseSummary.reduce((sum, ex) => sum + ex.setCount, 0);

    return {
      type: "trained_today",
      todaysWorkout: {
        sessionId: todaySession.id,
        dayName: planDayResult[0]?.name ?? "Workout",
        weekNumber: todaySession.weekNumber,
        dayNumber: todaySession.dayInWeek,
        startedAt: todaySession.startedAt,
        endedAt: todaySession.endedAt!,
        totalSets,
        exercises: exerciseSummary.map(ex => ({
          name: ex.name,
          sets: ex.setCount,
        })),
      },
    };
  }

  // Check for completed session yesterday
  const yesterdaySessionResults = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        gte(sessions.startedAt, yesterdayStart),
        lte(sessions.startedAt, yesterdayEnd),
        isNotNull(sessions.endedAt)
      )
    )
    .limit(1);

  const trainedYesterday = yesterdaySessionResults.length > 0;

  // If user trained yesterday but not today, suggest recovery
  if (trainedYesterday) {
    return { type: "recovery_day" };
  }

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
