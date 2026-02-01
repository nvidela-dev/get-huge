import { db } from "@/lib/db";
import { sessionSets, sessions, exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProgressView } from "./progress-view";

interface Props {
  searchParams: Promise<{ exercise?: string }>;
}

export default async function ProgressPage({ searchParams }: Props) {
  const user = await getOrCreateUser();
  const params = await searchParams;

  if (!user) {
    redirect("/sign-in");
  }

  // Get all exercises the user has logged sets for
  const userExercises = await db
    .selectDistinct({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(sessionSets)
    .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
    .innerJoin(exercises, eq(sessionSets.exerciseId, exercises.id))
    .where(eq(sessions.userId, user.id))
    .orderBy(exercises.name);

  // Get selected exercise or default to first one
  const selectedExerciseId = params.exercise || userExercises[0]?.id;
  const selectedExercise = userExercises.find((e) => e.id === selectedExerciseId);

  // Get all sets for selected exercise
  let exerciseData: {
    date: Date;
    weight: number;
    reps: number;
    volume: number;
  }[] = [];

  if (selectedExerciseId) {
    const sets = await db
      .select({
        weight: sessionSets.weight,
        reps: sessionSets.reps,
        isWarmup: sessionSets.isWarmup,
        sessionDate: sessions.startedAt,
      })
      .from(sessionSets)
      .innerJoin(sessions, eq(sessionSets.sessionId, sessions.id))
      .where(eq(sessionSets.exerciseId, selectedExerciseId))
      .orderBy(sessions.startedAt);

    // Filter out warmup sets and transform data
    exerciseData = sets
      .filter((s) => !s.isWarmup)
      .map((s) => ({
        date: new Date(s.sessionDate),
        weight: parseFloat(s.weight),
        reps: s.reps,
        volume: parseFloat(s.weight) * s.reps,
      }));
  }

  // Calculate PRs
  const maxWeight = exerciseData.length > 0
    ? Math.max(...exerciseData.map((d) => d.weight))
    : 0;
  const maxVolume = exerciseData.length > 0
    ? Math.max(...exerciseData.map((d) => d.volume))
    : 0;
  const totalSets = exerciseData.length;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson"
        >
          LIFTTRACK
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-2">
            PROGRESS
          </h1>
          <p className="text-bone/60 mb-6">Track your gains over time</p>

          {userExercises.length === 0 ? (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">No data yet.</p>
              <p className="text-bone/40 text-sm mt-2">
                Complete some sessions to see your progress.
              </p>
              <Link
                href="/"
                className="btn-brutal inline-block px-6 py-2 mt-4 text-sm font-[family-name:var(--font-bebas)] tracking-wider"
              >
                GO TRAIN
              </Link>
            </div>
          ) : (
            <ProgressView
              exercises={userExercises}
              selectedExerciseId={selectedExerciseId}
              selectedExercise={selectedExercise}
              exerciseData={exerciseData}
              stats={{
                maxWeight,
                maxVolume,
                totalSets,
              }}
              weightUnit={user.weightUnit}
            />
          )}
        </div>
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <Link href="/" className="hover:text-bone">
            Today
          </Link>
          <Link href="/history" className="hover:text-bone">
            History
          </Link>
          <span className="text-crimson">Progress</span>
          <Link href="/plans" className="hover:text-bone">
            Plans
          </Link>
        </div>
      </nav>
    </div>
  );
}
