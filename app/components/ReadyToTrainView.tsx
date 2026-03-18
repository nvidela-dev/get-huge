"use client";

import { useState } from "react";
import Link from "next/link";
import type { Translations } from "@/lib/translations";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  rpeTarget: string | null;
}

interface TrainingDay {
  weekNumber: number;
  dayNumber: number;
  dayName: string;
  planDayId: string;
  exercises: Exercise[];
}

interface PlanDay {
  id: string;
  name: string;
  dayNumber: number;
  weekVariant: number;
  exercises: Exercise[];
}

interface Props {
  userName: string | null;
  trainingDay: TrainingDay;
  availablePlanDays: PlanDay[];
  currentWeek: number;
  t: Translations;
}

export default function ReadyToTrainView({
  userName,
  trainingDay,
  availablePlanDays,
  currentWeek,
  t,
}: Props) {
  // Initialize selected session with the recommended one
  const [selectedSession, setSelectedSession] = useState<PlanDay>(() => {
    const recommended = availablePlanDays.find(
      (pd) => pd.id === trainingDay.planDayId
    );
    return recommended || availablePlanDays[0];
  });

  // Group exercises by muscle group
  const exercisesByMuscle = selectedSession.exercises.reduce((acc, ex) => {
    const group = ex.muscleGroup;
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(ex);
    return acc;
  }, {} as Record<string, Exercise[]>);

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
          {t.home.week} {currentWeek}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-6xl sm:text-7xl tracking-wide text-foreground">
          {t.home.session} {trainingDay.dayNumber}
        </h2>
      </div>

      {/* Session Selector */}
      {availablePlanDays.length > 1 && (
        <div className="card-brutal p-6 max-w-lg mx-auto">
          <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
            {t.home.selectSession}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {availablePlanDays.map((planDay) => {
              const isRecommended = planDay.id === trainingDay.planDayId;
              const isSelected = planDay.id === selectedSession.id;

              return (
                <button
                  key={planDay.id}
                  onClick={() => setSelectedSession(planDay)}
                  className={`
                    relative p-4 border-2 transition-all
                    ${
                      isSelected
                        ? "border-crimson bg-crimson/10"
                        : "border-steel-light hover:border-bone/40"
                    }
                  `}
                >
                  {isRecommended && (
                    <span className="absolute top-1 right-1 text-[10px] uppercase tracking-wider text-amber-500 font-bold">
                      {t.home.recommended}
                    </span>
                  )}
                  <p className="text-bone/60 text-xs uppercase tracking-wider mb-1">
                    {t.home.session} {planDay.dayNumber}
                  </p>
                  <p className="text-bone font-[family-name:var(--font-bebas)] text-xl tracking-wide">
                    {planDay.name}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Start button */}
      <Link
        href={`/session/start?planDayId=${selectedSession.id}&week=${currentWeek}&day=${trainingDay.dayNumber}`}
        className="btn-brutal inline-block px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest"
      >
        {t.home.startSession}
      </Link>

      {/* Exercise preview - two columns */}
      <div className="card-brutal p-6 max-w-lg mx-auto mt-8">
        <p className="text-bone/60 uppercase tracking-widest text-xs mb-4">
          {selectedSession.name.toUpperCase()}
        </p>
        <div className="grid grid-cols-2 gap-4 text-left">
          {muscleGroups.map(([muscleGroup, exercises]) => (
            <div key={muscleGroup}>
              <p className="text-crimson text-xs uppercase tracking-wider mb-1">
                {muscleGroup}
              </p>
              <ul className="space-y-1 text-bone/80 text-sm">
                {exercises.map((ex) => (
                  <li key={ex.id}>{ex.name}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
