import { db } from "@/lib/db";
import {
  sessions,
  sessionSets,
  planDayExercises,
  planDays,
  users,
  muscleGroupXp,
  xpTransactions,
  exercises,
} from "@/lib/db/schema";
import { eq, and, gte, lte, isNotNull, sql, desc } from "drizzle-orm";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInWeeks,
} from "date-fns";
import { getXpProgress, sortMuscleGroups } from "./gamification";

export interface ConsistencyMetrics {
  session: number; // 0-100: % of exercises completed per session (avg)
  weekly: number; // 0-100: % of sessions completed this week
  monthly: number; // 0-100: % of sessions completed this month
  hasEnoughData: boolean; // Whether user has enough data to show metrics
}

export interface MuscleXpData {
  muscleGroup: string;
  totalXp: number;
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
}

export interface ProgressDataPoint {
  date: Date;
  totalVolume: number;
  xpGained: number;
}

/**
 * Get consistency metrics for a user
 */
export async function getConsistencyMetrics(
  userId: string
): Promise<ConsistencyMetrics> {
  // Get user's plan info
  const user = await db
    .select({
      currentPlanId: users.currentPlanId,
      planStartDate: users.planStartDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user[0]?.currentPlanId) {
    return { session: 0, weekly: 0, monthly: 0, hasEnoughData: false };
  }

  const planId = user[0].currentPlanId;
  const planStartDate = user[0].planStartDate
    ? new Date(user[0].planStartDate)
    : null;

  // Get plan's daysPerWeek
  const planDaysResult = await db
    .select({ dayNumber: planDays.dayNumber })
    .from(planDays)
    .where(eq(planDays.planId, planId));

  const daysPerWeek = new Set(planDaysResult.map((d) => d.dayNumber)).size || 3;

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Get completed sessions this week
  const weekSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNotNull(sessions.endedAt),
        gte(sessions.startedAt, weekStart),
        lte(sessions.startedAt, weekEnd)
      )
    );

  // Get completed sessions this month
  const monthSessions = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        isNotNull(sessions.endedAt),
        gte(sessions.startedAt, monthStart),
        lte(sessions.startedAt, monthEnd)
      )
    );

  // Calculate session completion rate (avg % of target sets completed per session)
  const sessionCompletionRate = await calculateSessionCompletionRate(userId);

  // Weekly rate: sessions this week / expected sessions per week
  const weeklyRate = Math.min(
    100,
    Math.round((weekSessions.length / daysPerWeek) * 100)
  );

  // Monthly rate: sessions this month / expected sessions per month
  // Expected = daysPerWeek * (weeks in month, typically ~4.3)
  const weeksInMonth = 4;
  const expectedMonthSessions = daysPerWeek * weeksInMonth;
  const monthlyRate = Math.min(
    100,
    Math.round((monthSessions.length / expectedMonthSessions) * 100)
  );

  // Check if user has enough data (at least 1 completed session)
  const totalSessions = await db
    .select({ count: sql<number>`count(*)` })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.endedAt)));

  const hasEnoughData = (totalSessions[0]?.count ?? 0) >= 1;

  return {
    session: sessionCompletionRate,
    weekly: weeklyRate,
    monthly: monthlyRate,
    hasEnoughData,
  };
}

/**
 * Calculate average session completion rate
 * (% of target sets actually logged, averaged over recent sessions)
 */
async function calculateSessionCompletionRate(userId: string): Promise<number> {
  // Get last 10 completed sessions with their plan day info
  const recentSessions = await db
    .select({
      sessionId: sessions.id,
      planDayId: sessions.planDayId,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), isNotNull(sessions.endedAt)))
    .orderBy(desc(sessions.startedAt))
    .limit(10);

  if (recentSessions.length === 0) return 0;

  const completionRates: number[] = [];

  for (const session of recentSessions) {
    // Get target sets for this plan day
    const targetSets = await db
      .select({
        exerciseId: planDayExercises.exerciseId,
        targetSets: planDayExercises.targetSets,
      })
      .from(planDayExercises)
      .where(eq(planDayExercises.planDayId, session.planDayId));

    // Get actual sets logged (excluding warmup)
    const actualSets = await db
      .select({
        exerciseId: sessionSets.exerciseId,
        count: sql<number>`count(*)`,
      })
      .from(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionId, session.sessionId),
          eq(sessionSets.isWarmup, false)
        )
      )
      .groupBy(sessionSets.exerciseId);

    // Calculate total target vs actual
    let totalTarget = 0;
    let totalActual = 0;

    for (const target of targetSets) {
      totalTarget += target.targetSets;
      const actual = actualSets.find(
        (a) => a.exerciseId === target.exerciseId
      );
      totalActual += Math.min(actual?.count ?? 0, target.targetSets);
    }

    if (totalTarget > 0) {
      completionRates.push((totalActual / totalTarget) * 100);
    }
  }

  if (completionRates.length === 0) return 0;

  // Return average completion rate
  return Math.round(
    completionRates.reduce((a, b) => a + b, 0) / completionRates.length
  );
}

/**
 * Get muscle group XP data for a user
 */
export async function getMuscleGroupXp(
  userId: string
): Promise<MuscleXpData[]> {
  const xpData = await db
    .select({
      muscleGroup: muscleGroupXp.muscleGroup,
      totalXp: muscleGroupXp.totalXp,
      currentLevel: muscleGroupXp.currentLevel,
    })
    .from(muscleGroupXp)
    .where(eq(muscleGroupXp.userId, userId));

  const result = xpData.map((row) => {
    const progress = getXpProgress(row.totalXp);
    return {
      muscleGroup: row.muscleGroup,
      totalXp: row.totalXp,
      currentLevel: progress.currentLevel,
      xpInCurrentLevel: progress.xpInCurrentLevel,
      xpToNextLevel: progress.xpToNextLevel,
      progressPercent: progress.progressPercent,
    };
  });

  return sortMuscleGroups(result);
}

/**
 * Get overall character level (average of all muscle groups)
 */
export async function getCharacterLevel(userId: string): Promise<number> {
  const xpData = await getMuscleGroupXp(userId);
  if (xpData.length === 0) return 1;

  const totalLevels = xpData.reduce((sum, m) => sum + m.currentLevel, 0);
  return Math.round(totalLevels / xpData.length);
}

/**
 * Get progress data over time for charting
 */
export async function getProgressData(
  userId: string,
  limit: number = 30
): Promise<ProgressDataPoint[]> {
  // Get XP transactions grouped by session date
  const transactions = await db
    .select({
      sessionId: xpTransactions.sessionId,
      totalXp: sql<number>`sum(${xpTransactions.totalXp})`,
      baseXp: sql<number>`sum(${xpTransactions.baseXp})`,
      createdAt: xpTransactions.createdAt,
    })
    .from(xpTransactions)
    .where(eq(xpTransactions.userId, userId))
    .groupBy(xpTransactions.sessionId, xpTransactions.createdAt)
    .orderBy(desc(xpTransactions.createdAt))
    .limit(limit);

  return transactions
    .map((t) => ({
      date: t.createdAt,
      totalVolume: t.baseXp, // Base XP is effectively volume
      xpGained: t.totalXp,
    }))
    .reverse(); // Chronological order for chart
}

/**
 * Get previous set for an exercise (for progression detection)
 */
export async function getPreviousSet(
  userId: string,
  exerciseId: string,
  excludeSessionId?: string
): Promise<{ weight: number; reps: number } | null> {
  const query = db
    .select({
      weight: sessionSets.weight,
      reps: sessionSets.reps,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
    .where(
      and(
        eq(sessions.userId, userId),
        eq(sessionSets.exerciseId, exerciseId),
        eq(sessionSets.isWarmup, false),
        isNotNull(sessions.endedAt),
        excludeSessionId
          ? sql`${sessionSets.sessionId} != ${excludeSessionId}`
          : sql`1=1`
      )
    )
    .orderBy(desc(sessionSets.createdAt))
    .limit(1);

  const result = await query;

  if (result.length === 0) return null;

  return {
    weight: parseFloat(result[0].weight),
    reps: result[0].reps,
  };
}
