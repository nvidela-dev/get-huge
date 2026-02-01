import { db } from "@/lib/db";
import {
  sessions,
  planDays,
  planDayExercises,
  exercises,
  sessionSets,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { SessionView } from "./session-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ActiveSessionPage({ params }: Props) {
  const user = await getOrCreateUser();
  const { id } = await params;

  if (!user) {
    redirect("/sign-in");
  }

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
      rpeTarget: planDayExercises.rpeTarget,
      order: planDayExercises.order,
    })
    .from(planDayExercises)
    .innerJoin(exercises, eq(planDayExercises.exerciseId, exercises.id))
    .where(eq(planDayExercises.planDayId, result.planDay.id))
    .orderBy(planDayExercises.order);

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
      weightUnit={user.weightUnit}
    />
  );
}
