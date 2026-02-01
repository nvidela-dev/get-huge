import { db } from "@/lib/db";
import { plans, planDays, planDayExercises, exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, type Language } from "@/lib/translations";
import { PlanEditor } from "./plan-editor";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminPlanEditPage({ params }: Props) {
  const admin = await getAdminUser();
  const { id } = await params;

  if (!admin) {
    redirect("/");
  }

  const t = getTranslations(admin.language as Language);

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
          id: planDayExercises.id,
          exerciseId: exercises.id,
          name: exercises.name,
          muscleGroup: exercises.muscleGroup,
          targetSets: planDayExercises.targetSets,
          targetReps: planDayExercises.targetReps,
          defaultReps: planDayExercises.defaultReps,
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

  // Get all available exercises for adding
  const allExercises = await db
    .select({
      id: exercises.id,
      name: exercises.name,
      muscleGroup: exercises.muscleGroup,
    })
    .from(exercises)
    .orderBy(exercises.muscleGroup, exercises.name);

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
          {t.admin.editPlan}
        </h1>
        <div className="w-16" />
      </header>

      <PlanEditor
        plan={{
          id: plan.id,
          name: plan.name,
          description: plan.description,
          daysPerWeek: plan.daysPerWeek,
        }}
        days={daysWithExercises}
        allExercises={allExercises}
        translations={t}
      />
    </div>
  );
}
