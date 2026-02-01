"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectPlan } from "../actions";
import type { Translations } from "@/lib/translations";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
}

interface Day {
  id: string;
  dayNumber: number;
  name: string;
  exercises: Exercise[];
}

interface PlanDetailViewProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    daysPerWeek: number;
  };
  days: Day[];
  isSelected: boolean;
  translations: Translations;
}

export function PlanDetailView({ plan, days, isSelected, translations: t }: PlanDetailViewProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = () => {
    startTransition(async () => {
      await selectPlan(plan.id);
      router.push("/");
    });
  };

  // Group exercises by muscle group for each day
  const daysWithGroupedExercises = days.map((day) => {
    const exercisesByMuscle = day.exercises.reduce((acc, ex) => {
      const group = ex.muscleGroup;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(ex);
      return acc;
    }, {} as Record<string, Exercise[]>);

    return {
      ...day,
      exercisesByMuscle,
    };
  });

  return (
    <main className="flex-1 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Plan header */}
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-2">
            {plan.name.toUpperCase()}
          </h1>
          {plan.description && (
            <p className="text-bone/60 mb-4">{plan.description}</p>
          )}
          <p className="text-bone/40 text-sm">
            {plan.daysPerWeek} {t.plans.sessionsPerWeek} •{" "}
            {days.reduce((sum, d) => sum + d.exercises.length, 0)} {t.plans.totalExercises}
          </p>
        </div>

        {/* Sessions grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {daysWithGroupedExercises.map((day) => (
            <div key={day.id} className="card-brutal p-6">
              <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-foreground mb-1">
                {t.home.session} {day.dayNumber}
              </h2>
              <p className="text-bone/40 text-xs uppercase tracking-wider mb-4">
                {day.exercises.length} {t.plans.exercises}
              </p>

              <div className="space-y-4">
                {Object.entries(day.exercisesByMuscle).map(([muscleGroup, exercises]) => (
                  <div key={muscleGroup}>
                    <p className="text-crimson text-xs uppercase tracking-wider mb-2">
                      {muscleGroup}
                    </p>
                    <ul className="space-y-1">
                      {exercises.map((ex) => (
                        <li
                          key={ex.id}
                          className="text-bone/80 text-sm flex justify-between"
                        >
                          <span>{ex.name}</span>
                          <span className="text-bone/40">
                            {ex.targetSets}×{ex.targetReps}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Select button */}
        {!isSelected && (
          <div className="text-center">
            <button
              onClick={handleSelect}
              disabled={isPending}
              className="btn-brutal px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest disabled:opacity-50"
            >
              {isPending ? t.plans.selecting : t.plans.selectThisPlan}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
