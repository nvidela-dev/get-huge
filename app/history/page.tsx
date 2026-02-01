import { db } from "@/lib/db";
import { sessions, planDays, sessionSets } from "@/lib/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { getTranslations, type Language } from "@/lib/translations";

export default async function HistoryPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const t = getTranslations(user.language as Language);

  // Get all completed sessions with plan day info
  const userSessions = await db
    .select({
      session: sessions,
      planDay: planDays,
    })
    .from(sessions)
    .innerJoin(planDays, eq(sessions.planDayId, planDays.id))
    .where(eq(sessions.userId, user.id))
    .orderBy(desc(sessions.startedAt));

  // Get set counts for each session
  const sessionsWithStats = await Promise.all(
    userSessions.map(async ({ session, planDay }) => {
      const setCountResult = await db
        .select({ count: count() })
        .from(sessionSets)
        .where(eq(sessionSets.sessionId, session.id));

      const duration =
        session.endedAt && session.startedAt
          ? Math.floor(
              (new Date(session.endedAt).getTime() -
                new Date(session.startedAt).getTime()) /
                1000
            )
          : null;

      return {
        ...session,
        dayName: planDay.name,
        totalSets: setCountResult[0]?.count ?? 0,
        duration,
        isComplete: !!session.endedAt,
      };
    })
  );

  const completedSessions = sessionsWithStats.filter((s) => s.isComplete);
  const inProgressSession = sessionsWithStats.find((s) => !s.isComplete);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson"
        >
          {t.appName}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-2">
            {t.history.title}
          </h1>
          <p className="text-bone/60 mb-8">
            {completedSessions.length} {t.history.totalSets === "series" ? "sesiones completadas" : `session${completedSessions.length !== 1 ? "s" : ""} completed`}
          </p>

          {/* In progress session */}
          {inProgressSession && (
            <div className="mb-8">
              <p className="text-crimson text-xs uppercase tracking-wider mb-2">
                {t.history.inProgress}
              </p>
              <Link
                href={`/session/${inProgressSession.id}`}
                className="block card-brutal p-4 border-crimson border-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                      {inProgressSession.dayName.toUpperCase()}
                    </p>
                    <p className="text-bone/60 text-sm">
                      {t.home.week} {inProgressSession.weekNumber} • {t.home.session}{" "}
                      {inProgressSession.dayInWeek}
                    </p>
                  </div>
                  <span className="text-crimson text-sm font-bold">
                    {t.history.continue}
                  </span>
                </div>
              </Link>
            </div>
          )}

          {/* Completed sessions */}
          <div className="space-y-3">
            {completedSessions.map((session) => (
              <Link
                key={session.id}
                href={`/history/${session.id}`}
                className="block card-brutal p-4 hover:border-crimson/50 transition-colors"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                      {session.dayName.toUpperCase()}
                    </p>
                    <p className="text-bone/60 text-sm">
                      {t.home.week} {session.weekNumber} • {t.home.session} {session.dayInWeek}
                    </p>
                  </div>
                  <p className="text-bone/40 text-sm">
                    {format(new Date(session.startedAt), "MMM d")}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-bone/60">
                  <span>{session.totalSets} {t.history.totalSets}</span>
                  {session.duration && (
                    <span>{formatDuration(session.duration)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {completedSessions.length === 0 && !inProgressSession && (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">{t.history.noSessions}</p>
              <p className="text-bone/40 text-sm mt-2">
                {t.history.startFirst}
              </p>
              <Link
                href="/"
                className="btn-brutal inline-block px-6 py-2 mt-4 text-sm font-[family-name:var(--font-bebas)] tracking-wider"
              >
                {t.home.startSession}
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <Link href="/" className="hover:text-bone">
            {t.nav.today}
          </Link>
          <span className="text-crimson">{t.nav.history}</span>
          <Link href="/progress" className="hover:text-bone">
            {t.nav.progress}
          </Link>
          <Link href="/plans" className="hover:text-bone">
            {t.nav.plans}
          </Link>
        </div>
      </nav>
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
