import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, type Language } from "@/lib/translations";
import { ExerciseList } from "./exercise-list";

export default async function AdminExercisesPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/");
  }

  const t = getTranslations(admin.language as Language);

  // Get all exercises
  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
      videoUrl: exercises.videoUrl,
    })
    .from(exercises)
    .orderBy(exercises.muscleGroup, exercises.name);

  // Group exercises by muscle group
  const exercisesByMuscle = allExercises.reduce(
    (acc, ex) => {
      if (!acc[ex.muscleGroup]) {
        acc[ex.muscleGroup] = [];
      }
      acc[ex.muscleGroup].push(ex);
      return acc;
    },
    {} as Record<string, typeof allExercises>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/admin"
          className="text-bone/60 hover:text-bone transition-colors"
        >
          {t.nav.back}
        </Link>
        <h1 className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-crimson">
          {t.admin.exercises}
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]) => (
            <section key={muscleGroup}>
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-foreground mb-4 uppercase">
                {muscleGroup}
              </h2>
              <ExerciseList exercises={exercises} translations={t} />
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
