import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/lib/auth";
import { getTrainingStatus } from "@/lib/training";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration, intervalToDuration } from "date-fns";

export default async function Home() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const status = await getTrainingStatus(user.id);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <h1 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson">
          LIFTTRACK
        </h1>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-10 h-10",
            },
          }}
        />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {status.type === "no_plan" && <NoPlanView userName={user.name} />}
        {status.type === "week_complete" && (
          <WeekCompleteView sessionsThisWeek={status.sessionsThisWeek ?? 3} />
        )}
        {status.type === "trained_today" && status.todaysWorkout && (
          <TodaysWorkoutView workout={status.todaysWorkout} />
        )}
        {status.type === "recovery_day" && <RecoveryDayView />}
        {status.type === "ready" && status.trainingDay && (
          <ReadyToTrainView
            userName={user.name}
            trainingDay={status.trainingDay}
          />
        )}
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <span className="text-crimson">Today</span>
          <Link href="/history" className="hover:text-bone">
            History
          </Link>
          <Link href="/progress" className="hover:text-bone">
            Progress
          </Link>
          <Link href="/plans" className="hover:text-bone">
            Plans
          </Link>
        </div>
      </nav>
    </div>
  );
}

function NoPlanView({ userName }: { userName: string | null }) {
  return (
    <div className="text-center space-y-8">
      <p className="text-bone text-lg">
        {userName ? `Welcome, ${userName}` : "Welcome"}
      </p>

      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground">
          NO PLAN SELECTED
        </h2>
        <p className="text-bone/60 max-w-xs mx-auto">
          Choose a training plan to start tracking your lifts
        </p>
      </div>

      <Link
        href="/plans"
        className="btn-brutal inline-block px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest"
      >
        CHOOSE PLAN
      </Link>
    </div>
  );
}

function WeekCompleteView({ sessionsThisWeek }: { sessionsThisWeek: number }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-crimson uppercase tracking-widest text-sm">
          Week Complete
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          REST UP
        </h2>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-2">
          This Week
        </p>
        <p className="text-4xl font-[family-name:var(--font-bebas)] text-crimson">
          {sessionsThisWeek}/3
        </p>
        <p className="text-bone/60 text-sm mt-2">sessions completed</p>
      </div>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        You crushed it. Recovery is part of the process. Come back Monday ready
        to lift.
      </p>
    </div>
  );
}

function TodaysWorkoutView({
  workout,
}: {
  workout: {
    sessionId: string;
    dayName: string;
    weekNumber: number;
    dayNumber: number;
    startedAt: Date;
    endedAt: Date;
    totalSets: number;
    exercises: { name: string; sets: number }[];
  };
}) {
  const duration = intervalToDuration({
    start: workout.startedAt,
    end: workout.endedAt,
  });
  const formattedDuration = formatDuration(duration, {
    format: ["hours", "minutes"],
    zero: false,
  }) || "< 1 min";

  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-green-500 uppercase tracking-widest text-sm">
          Crushed It
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          {workout.dayName.toUpperCase()}
        </h2>
        <p className="text-bone/60 text-sm">
          Week {workout.weekNumber} • Day {workout.dayNumber}
        </p>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          Today&apos;s Session
        </p>
        <div className="flex justify-around mb-4">
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {workout.totalSets}
            </p>
            <p className="text-bone/60 text-xs uppercase">Sets</p>
          </div>
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {formattedDuration}
            </p>
            <p className="text-bone/60 text-xs uppercase">Duration</p>
          </div>
        </div>
        <ul className="space-y-1 text-left text-bone/80 text-sm">
          {workout.exercises.map((ex) => (
            <li key={ex.name}>
              • {ex.name} — {ex.sets} sets
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/history/${workout.sessionId}`}
        className="text-crimson hover:underline text-sm"
      >
        View full session details →
      </Link>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        Great work today. Rest up and recover. Your muscles grow while you
        sleep.
      </p>
    </div>
  );
}

function RecoveryDayView() {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-amber-500 uppercase tracking-widest text-sm">
          Recovery Day
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          ACTIVE REST
        </h2>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          The Interference Effect
        </p>
        <p className="text-bone/80 text-sm leading-relaxed">
          Training heavy lifts on consecutive days can interfere with muscle
          recovery and strength gains. Your nervous system and muscles need time
          to rebuild.
        </p>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto bg-steel-dark/50">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          Suggested Activities
        </p>
        <ul className="space-y-3 text-left">
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">🚶</span>
            <div>
              <p className="font-medium">Walk</p>
              <p className="text-xs text-bone/50">20-45 min low intensity</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="font-medium">Light Jog or Run</p>
              <p className="text-xs text-bone/50">Keep heart rate moderate</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">⚽</span>
            <div>
              <p className="font-medium">Play Sports</p>
              <p className="text-xs text-bone/50">Basketball, soccer, tennis</p>
            </div>
          </li>
        </ul>
      </div>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        Light cardio promotes blood flow and recovery without taxing your
        muscles. Come back tomorrow ready to lift.
      </p>
    </div>
  );
}

function ReadyToTrainView({
  userName,
  trainingDay,
}: {
  userName: string | null;
  trainingDay: {
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
    }[];
  };
}) {
  // Group exercises by muscle group
  const exercisesByMuscle = trainingDay.exercises.reduce((acc, ex) => {
    const group = ex.muscleGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, typeof trainingDay.exercises>);

  return (
    <div className="text-center space-y-8">
      {/* Greeting */}
      <p className="text-bone text-lg">
        {userName ? `Let's go, ${userName}` : "Let's go"}
      </p>

      {/* Day indicator */}
      <div className="space-y-2">
        <p className="text-bone/60 uppercase tracking-widest text-sm">
          Week {trainingDay.weekNumber} • Day {trainingDay.dayNumber}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-6xl sm:text-7xl tracking-wide text-foreground">
          {trainingDay.dayName.toUpperCase()}
        </h2>
      </div>

      {/* Start button */}
      <Link
        href={`/session/start?planDayId=${trainingDay.planDayId}&week=${trainingDay.weekNumber}&day=${trainingDay.dayNumber}`}
        className="btn-brutal inline-block px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest"
      >
        START SESSION
      </Link>

      {/* Exercise preview */}
      <div className="card-brutal p-6 max-w-sm mx-auto mt-8">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          Today&apos;s Lifts
        </p>
        <div className="space-y-4 text-left">
          {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]) => (
            <div key={muscleGroup}>
              <p className="text-crimson text-xs uppercase tracking-wider mb-1">
                {muscleGroup}
              </p>
              <ul className="space-y-1 text-bone/80">
                {exercises.map((ex) => (
                  <li key={ex.id}>
                    • {ex.name} — {ex.targetSets}×{ex.targetReps}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
