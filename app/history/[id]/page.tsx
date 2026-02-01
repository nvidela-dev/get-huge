import { db } from "@/lib/db";
import { sessions, planDays, sessionSets, exercises } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";

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
      exercise: typeof exercises.$inferSelect;
      sets: (typeof sessionSets.$inferSelect)[];
    }
  >();

  for (const { set, exercise } of allSets) {
    if (!exerciseMap.has(exercise.id)) {
      exerciseMap.set(exercise.id, { exercise, sets: [] });
    }
    exerciseMap.get(exercise.id)!.sets.push(set);
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/history"
          className="text-bone/60 hover:text-bone transition-colors"
        >
          ← Back
        </Link>
        <span className="text-bone/40 text-sm">
          {format(new Date(session.startedAt), "MMMM d, yyyy")}
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          {/* Session header */}
          <div className="text-center mb-8">
            <p className="text-bone/60 text-xs uppercase tracking-wider">
              Week {session.weekNumber} • Day {session.dayInWeek}
            </p>
            <h1 className="font-[family-name:var(--font-bebas)] text-5xl tracking-wide text-foreground">
              {planDay.name.toUpperCase()}
            </h1>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {totalSets}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Sets
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {duration ? formatDuration(duration) : "-"}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Duration
              </p>
            </div>
            <div className="card-brutal p-4 text-center">
              <p className="font-[family-name:var(--font-bebas)] text-2xl text-crimson">
                {totalVolume.toLocaleString()}
              </p>
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                Volume ({user.weightUnit})
              </p>
            </div>
          </div>

          {/* Exercise breakdown */}
          <div className="space-y-6">
            {exerciseGroups.map(({ exercise, sets }) => {
              const workingSets = sets.filter((s) => !s.isWarmup);
              const bestSet = workingSets.reduce(
                (best, s) =>
                  parseFloat(s.weight) > parseFloat(best.weight) ? s : best,
                workingSets[0]
              );

              return (
                <div key={exercise.id} className="card-brutal p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                        {exercise.name.toUpperCase()}
                      </h3>
                      <p className="text-bone/40 text-xs uppercase">
                        {exercise.muscleGroup}
                      </p>
                    </div>
                    {bestSet && (
                      <div className="text-right">
                        <p className="text-crimson font-bold">
                          {bestSet.weight} {user.weightUnit} × {bestSet.reps}
                        </p>
                        <p className="text-bone/40 text-xs">Best set</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    {workingSets.map((set) => (
                      <div
                        key={set.id}
                        className="flex justify-between text-sm py-1 border-b border-steel-light last:border-0"
                      >
                        <span className="text-bone/60">Set {set.setNumber}</span>
                        <span className="text-bone">
                          {set.weight} {user.weightUnit} × {set.reps}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mt-8 card-brutal p-4">
              <p className="text-bone/60 text-xs uppercase tracking-wider mb-2">
                Notes
              </p>
              <p className="text-bone">{session.notes}</p>
            </div>
          )}

          {exerciseGroups.length === 0 && (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">No sets logged in this session.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) {
    return `${h}h ${m}m`;
  }
  return `${m}m`;
}
