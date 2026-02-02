import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsView } from "./stats-view";
import { getTranslations, type Language } from "@/lib/translations";
import {
  getConsistencyMetrics,
  getMuscleGroupXp,
  getProgressData,
  getCharacterLevel,
} from "@/lib/stats";

export default async function StatsPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const t = getTranslations(user.language as Language);

  // Fetch all stats data in parallel
  const [consistency, muscleXp, progressData, characterLevel] =
    await Promise.all([
      getConsistencyMetrics(user.id),
      getMuscleGroupXp(user.id),
      getProgressData(user.id),
      getCharacterLevel(user.id),
    ]);

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
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-6">
            {t.stats?.title ?? "STATS"}
          </h1>

          <StatsView
            consistency={consistency}
            muscleXp={muscleXp}
            progressData={progressData}
            characterLevel={characterLevel}
            translations={t}
          />
        </div>
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <Link href="/" className="hover:text-bone">
            {t.nav.today}
          </Link>
          <Link href="/history" className="hover:text-bone">
            {t.nav.history}
          </Link>
          <Link href="/progress" className="hover:text-bone">
            {t.nav.progress}
          </Link>
          <span className="text-crimson">{t.stats?.title ?? "Stats"}</span>
          <Link href="/settings" className="hover:text-bone">
            {t.nav.settings}
          </Link>
        </div>
      </nav>
    </div>
  );
}
