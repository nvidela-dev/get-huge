"use server";

import { db } from "@/lib/db";
import {
  sessions,
  sessionSets,
  exercises,
  muscleGroupXp,
  xpTransactions,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  calculateVolume,
  calculateProgressionBonus,
  getLevelFromXp,
} from "@/lib/gamification";
import { getPreviousSet } from "@/lib/stats";

export async function logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: string,
  reps: number,
  isWarmup: boolean = false
) {
  await db.insert(sessionSets).values({
    sessionId,
    exerciseId,
    setNumber,
    weight,
    reps,
    isWarmup,
  });

  revalidatePath(`/session/${sessionId}`);
}

export async function endSession(sessionId: string, notes?: string) {
  // End the session
  await db
    .update(sessions)
    .set({
      endedAt: new Date(),
      notes,
    })
    .where(eq(sessions.id, sessionId));

  // Process XP for this session
  await processSessionXp(sessionId);

  revalidatePath("/");
  revalidatePath(`/session/${sessionId}`);
  revalidatePath("/stats");
}

/**
 * Process XP gains for a completed session
 */
async function processSessionXp(sessionId: string) {
  // Get session info
  const session = await db
    .select({ userId: sessions.userId })
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .limit(1);

  if (!session[0]) return;

  const userId = session[0].userId;

  // Get all non-warmup sets from this session with exercise info
  const sets = await db
    .select({
      weight: sessionSets.weight,
      reps: sessionSets.reps,
      exerciseId: sessionSets.exerciseId,
      muscleGroup: exercises.muscleGroup,
      isBodyweight: exercises.isBodyweight,
      difficultyMultiplier: exercises.difficultyMultiplier,
    })
    .from(sessionSets)
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(
      and(eq(sessionSets.sessionId, sessionId), eq(sessionSets.isWarmup, false))
    );

  if (sets.length === 0) return;

  // Group XP by muscle group
  const xpByMuscle: Record<
    string,
    { baseXp: number; progressionBonus: number; exerciseIds: Set<string> }
  > = {};

  for (const set of sets) {
    const muscleGroup = set.muscleGroup;
    const weight = parseFloat(set.weight);
    const reps = set.reps;

    // Calculate base volume/XP
    const baseXp = calculateVolume({
      weight,
      reps,
      isBodyweight: set.isBodyweight,
      difficultyMultiplier: parseFloat(set.difficultyMultiplier),
    });

    // Initialize muscle group if needed
    if (!xpByMuscle[muscleGroup]) {
      xpByMuscle[muscleGroup] = {
        baseXp: 0,
        progressionBonus: 0,
        exerciseIds: new Set(),
      };
    }

    xpByMuscle[muscleGroup].baseXp += baseXp;

    // Only check progression once per exercise (not per set)
    if (!xpByMuscle[muscleGroup].exerciseIds.has(set.exerciseId)) {
      xpByMuscle[muscleGroup].exerciseIds.add(set.exerciseId);

      // Get previous set for this exercise
      const previousSet = await getPreviousSet(
        userId,
        set.exerciseId,
        sessionId
      );

      // Calculate progression bonus
      const bonus = calculateProgressionBonus(baseXp, {
        currentWeight: weight,
        currentReps: reps,
        previousWeight: previousSet?.weight ?? null,
        previousReps: previousSet?.reps ?? null,
      });

      xpByMuscle[muscleGroup].progressionBonus += bonus;
    }
  }

  // Insert XP transactions and update totals
  for (const [muscleGroup, xp] of Object.entries(xpByMuscle)) {
    const totalXp = xp.baseXp + xp.progressionBonus;

    // Insert XP transaction record
    await db.insert(xpTransactions).values({
      userId,
      sessionId,
      muscleGroup,
      baseXp: xp.baseXp,
      progressionBonus: xp.progressionBonus,
      totalXp,
    });

    // Check if muscle group XP record exists
    const existing = await db
      .select({ id: muscleGroupXp.id, totalXp: muscleGroupXp.totalXp })
      .from(muscleGroupXp)
      .where(
        and(
          eq(muscleGroupXp.userId, userId),
          eq(muscleGroupXp.muscleGroup, muscleGroup)
        )
      )
      .limit(1);

    if (existing[0]) {
      // Update existing record
      const newTotalXp = existing[0].totalXp + totalXp;
      const newLevel = getLevelFromXp(newTotalXp);

      await db
        .update(muscleGroupXp)
        .set({
          totalXp: newTotalXp,
          currentLevel: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(muscleGroupXp.id, existing[0].id));
    } else {
      // Insert new record
      const level = getLevelFromXp(totalXp);

      await db.insert(muscleGroupXp).values({
        userId,
        muscleGroup,
        totalXp,
        currentLevel: level,
      });
    }
  }
}

/**
 * Mark an exercise as complete in Track Later mode
 * Uses a placeholder set (setNumber: 0, isWarmup: true) to track completion
 * This doesn't award XP but counts for session consistency
 */
export async function markExerciseComplete(
  sessionId: string,
  exerciseId: string,
  completed: boolean
) {
  if (completed) {
    // Insert a placeholder set to mark as complete
    // Using setNumber: 0 and isWarmup: true so it's excluded from XP calculations
    await db.insert(sessionSets).values({
      sessionId,
      exerciseId,
      setNumber: 0,
      weight: "0",
      reps: 0,
      isWarmup: true,
    });
  } else {
    // Remove the placeholder set
    await db
      .delete(sessionSets)
      .where(
        and(
          eq(sessionSets.sessionId, sessionId),
          eq(sessionSets.exerciseId, exerciseId),
          eq(sessionSets.setNumber, 0),
          eq(sessionSets.isWarmup, true)
        )
      );
  }

  revalidatePath(`/session/${sessionId}`);
}
