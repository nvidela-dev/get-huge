import { db } from "@/lib/db";
import {
  sessions,
  planDays,
  planDayExercises,
  exercises,
  sessionSets,
} from "@/lib/db/schema";
import { eq, and, desc, ne } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { SessionView } from "./session-view";
import { getTranslations, type Language } from "@/lib/translations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActiveSessionPage({ params }: Props) {
  const user = await getOrCreateUser();
  const { id } = await params;

  if (!user) {
    redirect("/sign-in");
  }

  const t = getTranslations(user.language as Language);

  // Get session with plan day info
  const sessionResults = await db
    .select({
      session: sessions,
      planDay: planDays,
    })
    .from(sessions)
    .innerJoin(planDays, eq(sessions.planDayId, planDays.id))
    .where(and(eq(sessions.id, id), eq(sessions.userId, user.id)))
    .limit(1);

  const result = sessionResults[0];

  if (!result) {
    notFound();
  }

  // If session is already ended, redirect to summary (future feature)
  if (result.session.endedAt) {
    redirect("/");
  }

  // Get exercises for this session
  const dayExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      targetSets: planDayExercises.targetSets,
      targetReps: planDayExercises.targetReps,
      defaultReps: planDayExercises.defaultReps,
      rpeTarget: planDayExercises.rpeTarget,
      order: planDayExercises.order,
    })
    .from(planDayExercises)
    .innerJoin(exercises, eq(planDayExercises.exerciseId, exercises.id))
    .where(eq(planDayExercises.planDayId, result.planDay.id))
    .orderBy(planDayExercises.order);

  // Get last weight and reps for each exercise from previous sessions
  const exerciseIds = dayExercises.map((e) => e.id);
  const exerciseHistory: Record<string, { weight: string; reps: number }> = {};

  for (const exerciseId of exerciseIds) {
    // Get the most recent set for this exercise from a previous session
    const lastSet = await db
      .select({ weight: sessionSets.weight, reps: sessionSets.reps })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
      .where(
        and(
          eq(sessionSets.exerciseId, exerciseId),
          eq(sessions.userId, user.id),
          ne(sessionSets.sessionId, id), // Exclude current session
          eq(sessionSets.isWarmup, false)
        )
      )
      .orderBy(desc(sessionSets.createdAt))
      .limit(1);

    if (lastSet[0]) {
      exerciseHistory[exerciseId] = {
        weight: lastSet[0].weight,
        reps: lastSet[0].reps,
      };
    }
  }

  // Get logged sets for this session
  const loggedSets = await db
    .select()
    .from(sessionSets)
    .where(eq(sessionSets.sessionId, id));

  return (
    <SessionView
      session={result.session}
      planDay={result.planDay}
      exercises={dayExercises}
      loggedSets={loggedSets}
      exerciseHistory={exerciseHistory}
      weightUnit={user.weightUnit}
      translations={t}
    />
  );
}
