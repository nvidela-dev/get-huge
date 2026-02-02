"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logSet, endSession } from "./actions";
import { RestTimer } from "./rest-timer";
import { TrackLaterView } from "./track-later-view";
import type { Translations } from "@/lib/translations";

interface SessionViewProps {
  session: {
    id: string;
    startedAt: Date;
    weekNumber: number;
    dayInWeek: number;
  };
  planDay: {
    id: string;
    name: string;
  };
  exercises: {
    id: string;
    name: string;
    muscleGroup: string;
    targetSets: number;
    targetReps: string;
    defaultReps: number;
    rpeTarget: string | null;
    order: number;
  }[];
  loggedSets: {
    id: string;
    exerciseId: string;
    setNumber: number;
    weight: string;
    reps: number;
    isWarmup: boolean;
  }[];
  exerciseHistory: Record<string, { weight: string; reps: number }>;
  weightUnit: string;
  isBodyweight: boolean;
  progressionNames: Record<string, string>;
  trackLaterEnabled: boolean;
  defaultRestSeconds: number;
  translations: Translations;
}

export function SessionView({
  session,
  planDay,
  exercises,
  loggedSets,
  exerciseHistory,
  weightUnit,
  isBodyweight,
  progressionNames,
  trackLaterEnabled,
  defaultRestSeconds,
  translations: t,
}: SessionViewProps) {
  const router = useRouter();
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isEnding, setIsEnding] = useState(false);

  // Timer
  useEffect(() => {
    const startTime = new Date(session.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const currentExercise = exercises[currentExerciseIndex];
  const exerciseSets = loggedSets.filter(
    (s) => s.exerciseId === currentExercise?.id && !s.isWarmup
  );

  const handleEndSession = async () => {
    if (confirm("End this session?")) {
      setIsEnding(true);
      await endSession(session.id);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header with timer */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <div>
          <p className="text-bone/60 text-xs uppercase tracking-wider">
            {t.home.week} {session.weekNumber} • {t.home.session} {session.dayInWeek}
          </p>
          <h1 className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-crimson">
            {planDay.name.toUpperCase()}
          </h1>
        </div>
        <div className="text-right">
          <p className="font-[family-name:var(--font-bebas)] text-2xl text-foreground tabular-nums">
            {formatTime(elapsedTime)}
          </p>
        </div>
      </header>

      {trackLaterEnabled ? (
        /* Track Later Mode - Show all exercises as checklist */
        <main className="flex-1 p-4 space-y-4">
          <TrackLaterView
            sessionId={session.id}
            exercises={exercises}
            loggedSets={loggedSets}
            translations={t}
          />

          {/* Rest Timer - also available in Track Later mode */}
          <RestTimer
            defaultSeconds={defaultRestSeconds}
            translations={t}
          />
        </main>
      ) : (
        /* Normal Mode - Exercise tabs and detailed logging */
        <>
          {/* Exercise navigation */}
          <div className="flex gap-2 p-4 overflow-x-auto">
            {exercises.map((ex, idx) => {
              const sets = loggedSets.filter(
                (s) => s.exerciseId === ex.id && !s.isWarmup
              );
              const isComplete = sets.length >= ex.targetSets;
              return (
                <button
                  key={ex.id}
                  onClick={() => setCurrentExerciseIndex(idx)}
                  className={`px-3 py-1 text-xs uppercase tracking-wider whitespace-nowrap transition-colors ${
                    idx === currentExerciseIndex
                      ? "bg-crimson text-white"
                      : isComplete
                        ? "bg-steel-light text-bone/60"
                        : "bg-steel text-bone/80"
                  }`}
                >
                  {ex.name}
                </button>
              );
            })}
          </div>

          {/* Current exercise */}
          {currentExercise && (
            <main className="flex-1 p-4 space-y-4">
              <ExerciseCard
                sessionId={session.id}
                exercise={currentExercise}
                sets={exerciseSets}
                history={exerciseHistory[currentExercise.id]}
                weightUnit={weightUnit}
                isBodyweight={isBodyweight}
                nextProgressionName={progressionNames[currentExercise.id]}
                onSetLogged={() => router.refresh()}
                translations={t}
              />

              {/* Rest Timer */}
              <RestTimer
                defaultSeconds={defaultRestSeconds}
                translations={t}
              />
            </main>
          )}
        </>
      )}

      {/* Footer */}
      <footer className="p-4 border-t border-steel-light">
        <button
          onClick={handleEndSession}
          disabled={isEnding}
          className="w-full py-3 bg-steel border border-steel-light text-bone/80 font-[family-name:var(--font-bebas)] tracking-wider uppercase hover:bg-steel-light transition-colors disabled:opacity-50"
        >
          {isEnding ? t.session.ending : t.session.endSession}
        </button>
      </footer>
    </div>
  );
}

interface ExerciseCardProps {
  sessionId: string;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string;
    targetSets: number;
    targetReps: string;
    defaultReps: number;
    rpeTarget: string | null;
  };
  sets: {
    id: string;
    setNumber: number;
    weight: string;
    reps: number;
  }[];
  history?: { weight: string; reps: number };
  weightUnit: string;
  isBodyweight: boolean;
  nextProgressionName?: string;
  onSetLogged: () => void;
  translations: Translations;
}

function ExerciseCard({
  sessionId,
  exercise,
  sets,
  history,
  weightUnit,
  isBodyweight,
  nextProgressionName,
  onSetLogged,
  translations: t,
}: ExerciseCardProps) {
  // Weightlifting: 8-12 reps, then increase weight
  // Bodyweight: 8-15 reps, then progress to harder exercise
  const MAX_REPS = isBodyweight ? 15 : 12;
  const MIN_REPS = 8;

  // Calculate suggested weight and reps based on progression
  const getDefaults = () => {
    // Priority 1: Use last set from current session
    if (sets.length > 0) {
      const lastSet = sets[sets.length - 1];
      return {
        weight: lastSet.weight,
        reps: lastSet.reps,
        suggestProgression: false,
      };
    }

    // Priority 2: Use history with progression logic
    if (history) {
      const lastReps = history.reps;

      // If at or above max reps, suggest progression
      if (lastReps >= MAX_REPS) {
        return {
          weight: isBodyweight ? "0" : history.weight,
          reps: MIN_REPS,
          suggestProgression: true,
        };
      }

      // Otherwise, suggest +1 rep at same weight
      return {
        weight: isBodyweight ? "0" : history.weight,
        reps: Math.min(lastReps + 1, MAX_REPS),
        suggestProgression: false,
      };
    }

    // Priority 3: No history, use defaults
    return {
      weight: isBodyweight ? "0" : "",
      reps: exercise.defaultReps,
      suggestProgression: false,
    };
  };

  const defaults = getDefaults();
  const [weight, setWeight] = useState(defaults.weight);
  const [reps, setReps] = useState(defaults.reps.toString());
  const [isLogging, setIsLogging] = useState(false);
  const [showProgressionHint, setShowProgressionHint] = useState(defaults.suggestProgression);

  // Update defaults when switching exercises or after logging a set
  useEffect(() => {
    const newDefaults = getDefaults();
    setWeight(newDefaults.weight);
    setReps(newDefaults.reps.toString());
    setShowProgressionHint(newDefaults.suggestProgression);
  }, [exercise.id, sets.length]);

  const nextSetNumber = sets.length + 1;
  const isComplete = sets.length >= exercise.targetSets;

  const handleLogSet = async () => {
    // For bodyweight, we still need a weight value (use 0)
    const weightValue = isBodyweight ? "0" : weight;
    if (!weightValue || !reps) return;

    setIsLogging(true);
    await logSet(sessionId, exercise.id, nextSetNumber, weightValue, parseInt(reps));
    setIsLogging(false);
    onSetLogged();
  };

  return (
    <div className="space-y-6">
      {/* Exercise header */}
      <div className="text-center">
        <p className="text-bone/60 text-xs uppercase tracking-wider">
          {exercise.muscleGroup}
        </p>
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground">
          {exercise.name.toUpperCase()}
        </h2>
        <p className="text-bone/60 mt-1">
          {t.session.target}: {exercise.targetSets} × {exercise.targetReps}
          {exercise.rpeTarget && ` @ RPE ${exercise.rpeTarget}`}
        </p>
      </div>

      {/* Logged sets */}
      <div className="space-y-2">
        {sets.map((set) => (
          <div
            key={set.id}
            className="flex items-center justify-between bg-steel p-3 border border-steel-light"
          >
            <span className="text-bone/60 text-sm">{t.common.set} {set.setNumber}</span>
            <span className="text-foreground font-medium">
              {isBodyweight ? (
                `${set.reps} ${t.session.reps.toLowerCase()}`
              ) : (
                `${set.weight} ${weightUnit} × ${set.reps}`
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Log next set */}
      {!isComplete && (
        <div className="card-brutal p-4 space-y-4">
          <p className="text-bone/60 text-xs uppercase tracking-wider text-center">
            {t.common.set} {nextSetNumber} {t.session.setOf} {exercise.targetSets}
          </p>

          {/* Progression suggestion */}
          {showProgressionHint && (
            <div className="bg-amber-500/10 border border-amber-500/30 p-3 text-center">
              <p className="text-amber-500 text-sm">
                {isBodyweight && nextProgressionName ? (
                  <>↑ {t.session.progressTo} <strong>{nextProgressionName}</strong></>
                ) : (
                  <>↑ {t.session.increaseWeight}</>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            {/* Weight input - only for weightlifting */}
            {!isBodyweight && (
              <div className="flex-1">
                <label className="block text-bone/60 text-xs uppercase tracking-wider mb-1">
                  {t.session.weight} ({weightUnit})
                </label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-steel border border-steel-light p-3 text-foreground text-lg text-center focus:outline-none focus:border-crimson"
                  placeholder="0"
                />
              </div>
            )}
            <div className={isBodyweight ? "w-full" : "flex-1"}>
              <label className="block text-bone/60 text-xs uppercase tracking-wider mb-1">
                {t.session.reps}
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-steel border border-steel-light p-3 text-foreground text-lg text-center focus:outline-none focus:border-crimson"
                placeholder="0"
              />
            </div>
          </div>

          <button
            onClick={handleLogSet}
            disabled={(!isBodyweight && !weight) || !reps || isLogging}
            className="btn-brutal w-full py-3 text-lg font-[family-name:var(--font-bebas)] tracking-wider disabled:opacity-50"
          >
            {isLogging ? t.session.logging : t.session.logSet}
          </button>
        </div>
      )}

      {isComplete && (
        <div className="text-center py-8">
          <p className="text-crimson font-[family-name:var(--font-bebas)] text-2xl tracking-wider">
            {t.session.complete}
          </p>
          <p className="text-bone/60 text-sm mt-2">
            {t.session.moveToNext}
          </p>
        </div>
      )}
    </div>
  );
}
