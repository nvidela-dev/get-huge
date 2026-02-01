import { db } from "@/lib/db";
import { plans, planDays, planDayExercises, exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser, isAdmin } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { PlanDetailView } from "./plan-detail-view";
import { getTranslations, type Language } from "@/lib/translations";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PlanDetailPage({ params }: Props) {
  const user = await getOrCreateUser();
  const { id } = await params;

  if (!user) {
    redirect("/sign-in");
  }

  const t = getTranslations(user.language as Language);

  // Get plan
  const planResults = await db
    .select()
    .from(plans)
    .where(eq(plans.id, id))
    .limit(1);

  const plan = planResults[0];

  if (!plan) {
    notFound();
  }

  // Get all days with their exercises
  const days = await db
    .select({
      id: planDays.id,
      dayNumber: planDays.dayNumber,
      name: planDays.name,
    })
    .from(planDays)
    .where(eq(planDays.planId, id))
    .orderBy(planDays.dayNumber);

  // Get exercises for each day
  const daysWithExercises = await Promise.all(
    days.map(async (day) => {
      const dayExercises = await db
        .select({
          id: exercises.id,
          name: exercises.name,
          muscleGroup: exercises.muscleGroup,
          targetSets: planDayExercises.targetSets,
          targetReps: planDayExercises.targetReps,
          order: planDayExercises.order,
        })
        .from(planDayExercises)
        .innerJoin(exercises, eq(planDayExercises.exerciseId, exercises.id))
        .where(eq(planDayExercises.planDayId, day.id))
        .orderBy(planDayExercises.order);

      return {
        ...day,
        exercises: dayExercises,
      };
    })
  );

  const isSelected = user.currentPlanId === plan.id;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/plans"
          className="text-bone/60 hover:text-bone transition-colors"
        >
          {t.nav.back}
        </Link>
        {isSelected && (
          <span className="text-crimson text-xs uppercase tracking-wider font-bold">
            {t.plans.activePlan}
          </span>
        )}
      </header>

      <PlanDetailView
        plan={{
          id: plan.id,
          name: plan.name,
          description: plan.description,
          daysPerWeek: plan.daysPerWeek,
        }}
        days={daysWithExercises}
        isSelected={isSelected}
        canSelect={isAdmin(user.email)}
        translations={t}
      />

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
          <span className="text-crimson">{t.nav.plans}</span>
        </div>
      </nav>
    </div>
  );
}
