"use client";

import { useState, useTransition } from "react";
import { markExerciseComplete } from "./actions";
import type { Translations } from "@/lib/translations";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
}

interface LoggedSet {
  exerciseId: string;
  isWarmup: boolean;
}

interface TrackLaterViewProps {
  sessionId: string;
  exercises: Exercise[];
  loggedSets: LoggedSet[];
  translations: Translations;
}

export function TrackLaterView({
  sessionId,
  exercises,
  loggedSets,
  translations: t,
}: TrackLaterViewProps) {
  // Derive initial completed state from logged sets
  // An exercise is marked complete if it has any non-warmup sets
  // OR a placeholder set (which we use for track-later marking)
  const getInitialCompleted = () => {
    const completed = new Set<string>();
    for (const set of loggedSets) {
      completed.add(set.exerciseId);
    }
    return completed;
  };

  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    getInitialCompleted
  );
  const [isPending, startTransition] = useTransition();
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(
    null
  );

  const toggleExercise = (exerciseId: string) => {
    const isCurrentlyComplete = completedExercises.has(exerciseId);
    const newCompleted = new Set(completedExercises);

    if (isCurrentlyComplete) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }

    setCompletedExercises(newCompleted);
    setPendingExerciseId(exerciseId);

    startTransition(async () => {
      await markExerciseComplete(sessionId, exerciseId, !isCurrentlyComplete);
      setPendingExerciseId(null);
    });
  };

  const completedCount = completedExercises.size;
  const totalCount = exercises.length;

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
          {t.session.allExercises}
        </h2>
        <span className="text-bone/60 text-sm">
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-steel rounded-full overflow-hidden">
        <div
          className="h-full bg-crimson transition-all duration-300"
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      {/* Exercise list */}
      <div className="space-y-2">
        {exercises.map((exercise) => {
          const isComplete = completedExercises.has(exercise.id);
          const isLoading =
            isPending && pendingExerciseId === exercise.id;

          return (
            <button
              key={exercise.id}
              onClick={() => toggleExercise(exercise.id)}
              disabled={isPending}
              className={`w-full p-4 text-left transition-all border ${
                isComplete
                  ? "border-crimson/50 bg-crimson/10"
                  : "border-steel-light hover:border-crimson/30"
              } disabled:opacity-70`}
            >
              <div className="flex items-center gap-4">
                {/* Checkbox */}
                <div
                  className={`w-6 h-6 border-2 flex items-center justify-center transition-colors ${
                    isComplete
                      ? "border-crimson bg-crimson"
                      : "border-bone/40"
                  }`}
                >
                  {isComplete && (
                    <svg
                      className="w-4 h-4 text-background"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {isLoading && (
                    <div className="w-3 h-3 border-2 border-bone/40 border-t-crimson rounded-full animate-spin" />
                  )}
                </div>

                {/* Exercise info */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium truncate ${
                      isComplete ? "text-bone/60 line-through" : "text-foreground"
                    }`}
                  >
                    {exercise.name}
                  </p>
                  <p className="text-bone/40 text-xs">
                    {exercise.muscleGroup}
                  </p>
                </div>

                {/* Target */}
                <div className="text-right">
                  <p
                    className={`font-[family-name:var(--font-bebas)] text-lg ${
                      isComplete ? "text-bone/40" : "text-crimson"
                    }`}
                  >
                    {exercise.targetSets}×{exercise.targetReps}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Track Later Mode indicator */}
      <div className="text-center pt-4">
        <p className="text-bone/40 text-xs uppercase tracking-wider">
          {t.session.trackLaterMode}
        </p>
      </div>
    </div>
  );
}
