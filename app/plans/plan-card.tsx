"use client";

import { useTransition } from "react";
import { selectPlan } from "./actions";
import { useRouter } from "next/navigation";

interface PlanCardProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    daysPerWeek: number;
    days: { id: string; name: string; dayNumber: number }[];
    totalExercises: number;
    isSelected: boolean;
  };
}

export function PlanCard({ plan }: PlanCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = () => {
    startTransition(async () => {
      await selectPlan(plan.id);
      router.push("/");
    });
  };

  return (
    <div
      className={`card-brutal p-6 ${plan.isSelected ? "border-crimson border-2" : ""}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wide text-foreground">
            {plan.name.toUpperCase()}
          </h2>
          {plan.description && (
            <p className="text-bone/60 text-sm mt-1">{plan.description}</p>
          )}
        </div>
        {plan.isSelected && (
          <span className="text-crimson text-xs uppercase tracking-wider font-bold">
            Active
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {plan.days.map((day) => (
          <span
            key={day.id}
            className="bg-steel-light px-3 py-1 text-xs text-bone/80 uppercase tracking-wider"
          >
            {day.name}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-bone/40 text-sm">
          {plan.daysPerWeek} days/week • {plan.totalExercises} exercises
        </div>

        {!plan.isSelected && (
          <button
            onClick={handleSelect}
            disabled={isPending}
            className="btn-brutal px-6 py-2 text-sm font-[family-name:var(--font-bebas)] tracking-wider disabled:opacity-50"
          >
            {isPending ? "..." : "SELECT"}
          </button>
        )}
      </div>
    </div>
  );
}
