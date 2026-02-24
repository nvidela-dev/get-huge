"use client";

import { useState, useTransition } from "react";
import { updateExerciseVideoUrl } from "./actions";
import type { Translations } from "@/lib/translations";

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  videoUrl: string | null;
}

interface ExerciseListProps {
  exercises: Exercise[];
  translations: Translations;
}

export function ExerciseList({ exercises, translations: t }: ExerciseListProps) {
  return (
    <div className="space-y-3">
      {exercises.map((exercise) => (
        <ExerciseRow key={exercise.id} exercise={exercise} translations={t} />
      ))}
    </div>
  );
}

interface ExerciseRowProps {
  exercise: Exercise;
  translations: Translations;
}

function ExerciseRow({ exercise, translations: t }: ExerciseRowProps) {
  const [isPending, startTransition] = useTransition();
  const [videoUrl, setVideoUrl] = useState(exercise.videoUrl ?? "");
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    startTransition(async () => {
      await updateExerciseVideoUrl(exercise.id, videoUrl || null);
      setIsEditing(false);
    });
  };

  const handleCancel = () => {
    setVideoUrl(exercise.videoUrl ?? "");
    setIsEditing(false);
  };

  return (
    <div className="card-brutal p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-bone font-medium">{exercise.name}</p>
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-steel border border-steel-light px-3 py-2 text-bone text-sm focus:outline-none focus:border-crimson"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className="bg-crimson text-bone px-3 py-1 text-sm font-[family-name:var(--font-bebas)] tracking-wider hover:bg-crimson/80 disabled:opacity-50"
                >
                  {isPending ? t.settings.saving : t.history.save}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="text-bone/60 hover:text-bone px-3 py-1 text-sm"
                >
                  {t.history.cancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              {exercise.videoUrl ? (
                <a
                  href={exercise.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-crimson text-sm hover:underline truncate max-w-[200px]"
                >
                  {exercise.videoUrl}
                </a>
              ) : (
                <span className="text-bone/40 text-sm">{t.admin.noVideo}</span>
              )}
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-crimson/60 hover:text-crimson text-sm shrink-0"
          >
            {t.history.edit}
          </button>
        )}
      </div>
    </div>
  );
}
