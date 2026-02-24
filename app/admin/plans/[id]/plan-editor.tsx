"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  updatePlanDayExercise,
  removePlanDayExercise,
  addExerciseToDay,
  updateDayName,
  deletePlan,
  updateExerciseVideoUrl,
} from "./actions";
import type { Translations } from "@/lib/translations";

interface Exercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  targetSets: number;
  targetReps: string;
  defaultReps: number;
  order: number;
  videoUrl: string | null;
}

interface Day {
  id: string;
  dayNumber: number;
  name: string;
  exercises: Exercise[];
}

interface PlanEditorProps {
  plan: {
    id: string;
    name: string;
    description: string | null;
    daysPerWeek: number;
  };
  days: Day[];
  allExercises: {
    id: string;
    name: string;
    muscleGroup: string;
  }[];
  translations: Translations;
}

export function PlanEditor({ plan, days, allExercises, translations: t }: PlanEditorProps) {
  const router = useRouter();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      await deletePlan(plan.id);
      router.push("/admin");
    });
  };

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Plan header */}
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-2">
            {plan.name.toUpperCase()}
          </h2>
          {plan.description && (
            <p className="text-bone/60">{plan.description}</p>
          )}
        </div>

        {/* Days */}
        <div className="space-y-8">
          {days.map((day) => (
            <DayEditor
              key={day.id}
              day={day}
              allExercises={allExercises}
              translations={t}
            />
          ))}
        </div>

        {/* Delete Plan */}
        <div className="mt-12 pt-8 border-t border-steel-light">
          {showDeleteConfirm ? (
            <div className="card-brutal p-4 bg-crimson/10 border-crimson/30">
              <p className="text-bone mb-4">{t.admin.confirmDeletePlan}</p>
              <div className="flex gap-4">
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="bg-crimson text-bone px-4 py-2 font-[family-name:var(--font-bebas)] tracking-wider hover:bg-crimson/80 disabled:opacity-50"
                >
                  {t.admin.deletePlan}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-bone/60 hover:text-bone px-4 py-2"
                >
                  {t.history.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-crimson/60 hover:text-crimson text-sm"
            >
              {t.admin.deletePlan}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

interface DayEditorProps {
  day: Day;
  allExercises: {
    id: string;
    name: string;
    muscleGroup: string;
  }[];
  translations: Translations;
}

function DayEditor({ day, allExercises, translations: t }: DayEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [dayName, setDayName] = useState(day.name);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const handleUpdateDayName = () => {
    if (dayName === day.name) return;
    startTransition(async () => {
      await updateDayName(day.id, dayName);
      router.refresh();
    });
  };

  const handleAddExercise = () => {
    if (!selectedExerciseId) return;
    startTransition(async () => {
      await addExerciseToDay(day.id, selectedExerciseId, day.exercises.length + 1);
      setShowAddExercise(false);
      setSelectedExerciseId("");
      router.refresh();
    });
  };

  // Filter out exercises already in this day
  const availableExercises = allExercises.filter(
    (ex) => !day.exercises.some((e) => e.exerciseId === ex.id)
  );

  // Group available exercises by muscle group
  const exercisesByMuscle = availableExercises.reduce((acc, ex) => {
    if (!acc[ex.muscleGroup]) {
      acc[ex.muscleGroup] = [];
    }
    acc[ex.muscleGroup].push(ex);
    return acc;
  }, {} as Record<string, typeof availableExercises>);

  return (
    <div className="card-brutal p-6">
      {/* Day header */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-crimson font-[family-name:var(--font-bebas)] text-xl">
          {t.home.session} {day.dayNumber}
        </span>
        <input
          type="text"
          value={dayName}
          onChange={(e) => setDayName(e.target.value)}
          onBlur={handleUpdateDayName}
          className="flex-1 bg-steel border border-steel-light px-3 py-2 text-bone font-[family-name:var(--font-bebas)] text-xl tracking-wide focus:outline-none focus:border-crimson"
        />
      </div>

      {/* Exercises */}
      <div className="space-y-3">
        {day.exercises.map((exercise) => (
          <ExerciseRow
            key={exercise.id}
            exercise={exercise}
            translations={t}
          />
        ))}
      </div>

      {/* Add exercise */}
      <div className="mt-4 pt-4 border-t border-steel-light">
        {showAddExercise ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value)}
              className="flex-1 bg-steel border border-steel-light px-3 py-2 text-bone text-sm focus:outline-none focus:border-crimson"
            >
              <option value="">Select exercise...</option>
              {Object.entries(exercisesByMuscle).map(([muscleGroup, exercises]) => (
                <optgroup key={muscleGroup} label={muscleGroup}>
                  {exercises.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              onClick={handleAddExercise}
              disabled={!selectedExerciseId || isPending}
              className="bg-crimson text-bone px-4 py-2 text-sm font-[family-name:var(--font-bebas)] tracking-wider hover:bg-crimson/80 disabled:opacity-50"
            >
              {t.admin.assign}
            </button>
            <button
              onClick={() => {
                setShowAddExercise(false);
                setSelectedExerciseId("");
              }}
              className="text-bone/40 hover:text-bone px-2 py-2 text-sm"
            >
              {t.history.cancel}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAddExercise(true)}
            className="text-crimson hover:text-crimson/80 text-sm"
          >
            + {t.admin.addExercise}
          </button>
        )}
      </div>
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  translations: Translations;
}

function ExerciseRow({ exercise, translations: t }: ExerciseRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [sets, setSets] = useState(exercise.targetSets.toString());
  const [reps, setReps] = useState(exercise.targetReps);
  const [defaultReps, setDefaultReps] = useState(exercise.defaultReps.toString());
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl ?? "");
  const [showVideoInput, setShowVideoInput] = useState(false);

  const handleUpdate = () => {
    const newSets = parseInt(sets);
    const newDefaultReps = parseInt(defaultReps);

    if (
      isNaN(newSets) ||
      isNaN(newDefaultReps) ||
      (newSets === exercise.targetSets &&
        reps === exercise.targetReps &&
        newDefaultReps === exercise.defaultReps)
    ) {
      return;
    }

    startTransition(async () => {
      await updatePlanDayExercise(exercise.id, newSets, reps, newDefaultReps);
      router.refresh();
    });
  };

  const handleVideoUpdate = () => {
    const newUrl = videoUrl.trim() || null;
    if (newUrl === exercise.videoUrl) {
      setShowVideoInput(false);
      return;
    }

    startTransition(async () => {
      await updateExerciseVideoUrl(exercise.exerciseId, newUrl);
      setShowVideoInput(false);
      router.refresh();
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      await removePlanDayExercise(exercise.id);
      router.refresh();
    });
  };

  return (
    <div className="bg-steel p-3 border border-steel-light space-y-2">
      <div className="flex items-center gap-3">
        {/* Exercise name */}
        <div className="flex-1 min-w-0">
          <p className="text-bone font-medium truncate">{exercise.name}</p>
          <p className="text-bone/40 text-xs uppercase">{exercise.muscleGroup}</p>
        </div>

        {/* Sets */}
        <div className="w-16">
          <label className="block text-bone/40 text-xs mb-1">{t.admin.sets}</label>
          <input
            type="number"
            value={sets}
            onChange={(e) => setSets(e.target.value)}
            onBlur={handleUpdate}
            className="w-full bg-steel-dark border border-steel-light px-2 py-1 text-bone text-center text-sm focus:outline-none focus:border-crimson"
          />
        </div>

        {/* Target Reps */}
        <div className="w-20">
          <label className="block text-bone/40 text-xs mb-1">{t.admin.reps}</label>
          <input
            type="text"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            onBlur={handleUpdate}
            placeholder="8-12"
            className="w-full bg-steel-dark border border-steel-light px-2 py-1 text-bone text-center text-sm focus:outline-none focus:border-crimson"
          />
        </div>

        {/* Default Reps */}
        <div className="w-16">
          <label className="block text-bone/40 text-xs mb-1 truncate" title={t.admin.defaultReps}>
            Def
          </label>
          <input
            type="number"
            value={defaultReps}
            onChange={(e) => setDefaultReps(e.target.value)}
            onBlur={handleUpdate}
            className="w-full bg-steel-dark border border-steel-light px-2 py-1 text-bone text-center text-sm focus:outline-none focus:border-crimson"
          />
        </div>

        {/* Remove button */}
        <button
          onClick={handleRemove}
          disabled={isPending}
          className="text-crimson/60 hover:text-crimson text-xs px-2 disabled:opacity-50"
        >
          {t.admin.removeExercise}
        </button>
      </div>

      {/* Video URL row */}
      <div className="flex items-center gap-2 pt-1 border-t border-steel-light/50">
        {showVideoInput ? (
          <>
            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="flex-1 bg-steel-dark border border-steel-light px-2 py-1 text-bone text-sm focus:outline-none focus:border-crimson"
            />
            <button
              onClick={handleVideoUpdate}
              disabled={isPending}
              className="text-crimson text-xs px-2 disabled:opacity-50"
            >
              {t.history.save}
            </button>
            <button
              onClick={() => {
                setVideoUrl(exercise.videoUrl ?? "");
                setShowVideoInput(false);
              }}
              className="text-bone/40 hover:text-bone text-xs px-2"
            >
              {t.history.cancel}
            </button>
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4 text-bone/40"
            >
              <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h8.25a3 3 0 003-3v-9a3 3 0 00-3-3H4.5zM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06z" />
            </svg>
            {exercise.videoUrl ? (
              <a
                href={exercise.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-crimson text-xs hover:underline truncate flex-1"
              >
                {exercise.videoUrl}
              </a>
            ) : (
              <span className="text-bone/40 text-xs flex-1">{t.admin.noVideo}</span>
            )}
            <button
              onClick={() => setShowVideoInput(true)}
              className="text-crimson/60 hover:text-crimson text-xs px-2"
            >
              {t.history.edit}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
