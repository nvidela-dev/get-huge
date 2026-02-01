import { db } from "@/lib/db";
import { sessions, planDays, sessionSets, exercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { SessionDetailView } from "./session-detail-view";
import { getTranslations, type Language } from "@/lib/translations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: Props) {
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

  const { session, planDay } = result;

  // Get all sets for this session grouped by exercise
  const allSets = await db
    .select({
      set: sessionSets,
      exercise: exercises,
    })
    .from(sessionSets)
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(eq(sessionSets.sessionId, id))
    .orderBy(sessionSets.createdAt);

  // Group sets by exercise
  const exerciseMap = new Map<
    string,
    {
      exercise: { id: string; name: string; muscleGroup: string };
      sets: { id: string; setNumber: number; weight: string; reps: number; isWarmup: boolean }[];
    }
  >();

  for (const { set, exercise } of allSets) {
    if (!exerciseMap.has(exercise.id)) {
      exerciseMap.set(exercise.id, {
        exercise: {
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
        },
        sets: [],
      });
    }
    exerciseMap.get(exercise.id)!.sets.push({
      id: set.id,
      setNumber: set.setNumber,
      weight: set.weight,
      reps: set.reps,
      isWarmup: set.isWarmup,
    });
  }

  const exerciseGroups = Array.from(exerciseMap.values());

  // Calculate stats
  const duration =
    session.endedAt && session.startedAt
      ? Math.floor(
          (new Date(session.endedAt).getTime() -
            new Date(session.startedAt).getTime()) /
            1000
        )
      : null;

  const totalSets = allSets.filter((s) => !s.set.isWarmup).length;
  const totalVolume = allSets
    .filter((s) => !s.set.isWarmup)
    .reduce((sum, s) => sum + parseFloat(s.set.weight) * s.set.reps, 0);

  const t = getTranslations(user.language as Language);

  return (
    <SessionDetailView
      session={{
        id: session.id,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        weekNumber: session.weekNumber,
        dayInWeek: session.dayInWeek,
        notes: session.notes,
      }}
      planDayName={planDay.name}
      exerciseGroups={exerciseGroups}
      weightUnit={user.weightUnit}
      totalSets={totalSets}
      totalVolume={totalVolume}
      duration={duration}
      translations={t}
    />
  );
}
