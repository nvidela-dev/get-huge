import { UserButton } from "@clerk/nextjs";
import { getOrCreateUser } from "@/lib/auth";
import { getTrainingStatus } from "@/lib/training";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDuration, intervalToDuration } from "date-fns";
import { getTranslations, type Language, type Translations } from "@/lib/translations";

export default async function Home() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const status = await getTrainingStatus(user.id);
  const t = getTranslations(user.language as Language);

  // Redirect new users to onboarding
  if (status.type === "no_plan") {
    redirect("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <h1 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson">
          {t.appName}
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
        {status.type === "week_complete" && (
          <WeekCompleteView sessionsThisWeek={status.sessionsThisWeek ?? 3} t={t} />
        )}
        {status.type === "session_in_progress" && status.inProgressSession && (
          <SessionInProgressView session={status.inProgressSession} t={t} />
        )}
        {status.type === "trained_today" && status.todaysWorkout && (
          <TodaysWorkoutView workout={status.todaysWorkout} t={t} />
        )}
        {status.type === "recovery_day" && <RecoveryDayView t={t} />}
        {status.type === "ready" && status.trainingDay && (
          <ReadyToTrainView
            userName={user.name}
            trainingDay={status.trainingDay}
            t={t}
          />
        )}
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <span className="text-crimson">{t.nav.today}</span>
          <Link href="/history" className="hover:text-bone">
            {t.nav.history}
          </Link>
          <Link href="/progress" className="hover:text-bone">
            {t.nav.progress}
          </Link>
          <Link href="/settings" className="hover:text-bone">
            {t.nav.settings}
          </Link>
        </div>
      </nav>
    </div>
  );
}

function SessionInProgressView({
  session,
  t,
}: {
  session: {
    sessionId: string;
    dayName: string;
    weekNumber: number;
    dayNumber: number;
    startedAt: Date;
    totalSets: number;
  };
  t: Translations;
}) {
  const duration = intervalToDuration({
    start: session.startedAt,
    end: new Date(),
  });
  const formattedDuration = formatDuration(duration, {
    format: ["hours", "minutes"],
    zero: false,
  }) || "< 1 min";

  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-amber-500 uppercase tracking-widest text-sm animate-pulse">
          {t.history.inProgress}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          {session.dayName.toUpperCase()}
        </h2>
        <p className="text-bone/60 text-sm">
          {t.home.week} {session.weekNumber} • {t.home.session} {session.dayNumber}
        </p>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <div className="flex justify-around mb-4">
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {session.totalSets}
            </p>
            <p className="text-bone/60 text-xs uppercase">{t.trainedToday.sets}</p>
          </div>
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {formattedDuration}
            </p>
            <p className="text-bone/60 text-xs uppercase">{t.trainedToday.duration}</p>
          </div>
        </div>
      </div>

      <Link
        href={`/session/${session.sessionId}`}
        className="btn-brutal inline-block px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest"
      >
        {t.history.continue}
      </Link>
    </div>
  );
}

function WeekCompleteView({ sessionsThisWeek, t }: { sessionsThisWeek: number; t: Translations }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-crimson uppercase tracking-widest text-sm">
          {t.weekComplete.weekComplete}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          {t.weekComplete.restUp}
        </h2>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-2">
          {t.weekComplete.thisWeek}
        </p>
        <p className="text-4xl font-[family-name:var(--font-bebas)] text-crimson">
          {sessionsThisWeek}/3
        </p>
        <p className="text-bone/60 text-sm mt-2">{t.weekComplete.sessionsCompleted}</p>
      </div>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        {t.weekComplete.restMessage}
      </p>
    </div>
  );
}

function TodaysWorkoutView({
  workout,
  t,
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
  t: Translations;
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
          {t.trainedToday.crushedIt}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          {workout.dayName.toUpperCase()}
        </h2>
        <p className="text-bone/60 text-sm">
          {t.home.week} {workout.weekNumber} • {t.home.session} {workout.dayNumber}
        </p>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          {t.trainedToday.todaysSession}
        </p>
        <div className="flex justify-around mb-4">
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {workout.totalSets}
            </p>
            <p className="text-bone/60 text-xs uppercase">{t.trainedToday.sets}</p>
          </div>
          <div>
            <p className="text-3xl font-[family-name:var(--font-bebas)] text-crimson">
              {formattedDuration}
            </p>
            <p className="text-bone/60 text-xs uppercase">{t.trainedToday.duration}</p>
          </div>
        </div>
        <ul className="space-y-1 text-left text-bone/80 text-sm">
          {workout.exercises.map((ex) => (
            <li key={ex.name}>
              • {ex.name} — {ex.sets} {t.history.totalSets}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href={`/history/${workout.sessionId}`}
        className="text-crimson hover:underline text-sm"
      >
        {t.trainedToday.viewDetails}
      </Link>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        {t.trainedToday.restMessage}
      </p>
    </div>
  );
}

function RecoveryDayView({ t }: { t: Translations }) {
  return (
    <div className="text-center space-y-8">
      <div className="space-y-2">
        <p className="text-amber-500 uppercase tracking-widest text-sm">
          {t.recoveryDay.recoveryDay}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-5xl sm:text-6xl tracking-wide text-foreground">
          {t.recoveryDay.activeRest}
        </h2>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          {t.recoveryDay.interferenceEffect}
        </p>
        <p className="text-bone/80 text-sm leading-relaxed">
          {t.recoveryDay.interferenceDesc}
        </p>
      </div>

      <div className="card-brutal p-6 max-w-sm mx-auto bg-steel-dark/50">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          {t.recoveryDay.suggestedActivities}
        </p>
        <ul className="space-y-3 text-left">
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">🚶</span>
            <div>
              <p className="font-medium">{t.recoveryDay.walk}</p>
              <p className="text-xs text-bone/50">{t.recoveryDay.walkDesc}</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">🏃</span>
            <div>
              <p className="font-medium">{t.recoveryDay.jog}</p>
              <p className="text-xs text-bone/50">{t.recoveryDay.jogDesc}</p>
            </div>
          </li>
          <li className="flex items-center gap-3 text-bone/80">
            <span className="text-2xl">⚽</span>
            <div>
              <p className="font-medium">{t.recoveryDay.sports}</p>
              <p className="text-xs text-bone/50">{t.recoveryDay.sportsDesc}</p>
            </div>
          </li>
        </ul>
      </div>

      <p className="text-bone/40 text-sm max-w-xs mx-auto">
        {t.recoveryDay.cardioMessage}
      </p>
    </div>
  );
}

function ReadyToTrainView({
  userName,
  trainingDay,
  t,
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
  t: Translations;
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

  const muscleGroups = Object.entries(exercisesByMuscle);

  return (
    <div className="text-center space-y-8">
      {/* Greeting */}
      <p className="text-bone text-lg">
        {userName ? `${t.home.letsGo}, ${userName}` : t.home.letsGo}
      </p>

      {/* Session indicator */}
      <div className="space-y-2">
        <p className="text-bone/60 uppercase tracking-widest text-sm">
          {t.home.week} {trainingDay.weekNumber}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-6xl sm:text-7xl tracking-wide text-foreground">
          {t.home.session} {trainingDay.dayNumber}
        </h2>
      </div>

      {/* Start button */}
      <Link
        href={`/session/start?planDayId=${trainingDay.planDayId}&week=${trainingDay.weekNumber}&day=${trainingDay.dayNumber}`}
        className="btn-brutal inline-block px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest"
      >
        {t.home.startSession}
      </Link>

      {/* Exercise preview - two columns */}
      <div className="card-brutal p-6 max-w-lg mx-auto mt-8">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          {t.home.todaysLifts}
        </p>
        <div className="grid grid-cols-2 gap-4 text-left">
          {muscleGroups.map(([muscleGroup, exercises]) => (
            <div key={muscleGroup}>
              <p className="text-crimson text-xs uppercase tracking-wider mb-1">
                {muscleGroup}
              </p>
              <ul className="space-y-1 text-bone/80 text-sm">
                {exercises.map((ex) => (
                  <li key={ex.id}>
                    {ex.name}
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
