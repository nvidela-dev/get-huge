"use client";

import { useState, useEffect } from "react";

interface ExerciseFormHelperProps {
  exerciseName: string;
  translations: {
    session: {
      formHelper?: string;
      instructions?: string;
      noFormHelp?: string;
    };
  };
}

interface ExerciseInfo {
  found: boolean;
  name?: string;
  images?: string[];
  instructions?: string[];
  level?: string;
  primaryMuscles?: string[];
}

export function ExerciseFormHelper({
  exerciseName,
  translations: t,
}: ExerciseFormHelperProps) {
  const [exerciseInfo, setExerciseInfo] = useState<ExerciseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    async function fetchExerciseInfo() {
      setIsLoading(true);
      setCurrentImageIndex(0);
      setImageError(false);
      try {
        const response = await fetch(
          `/api/exercise-info?name=${encodeURIComponent(exerciseName)}`
        );
        const data = await response.json();
        setExerciseInfo(data);
      } catch (error) {
        console.error("Error fetching exercise info:", error);
        setExerciseInfo({ found: false });
      } finally {
        setIsLoading(false);
      }
    }

    fetchExerciseInfo();
  }, [exerciseName]);

  // Auto-cycle through images
  useEffect(() => {
    if (!exerciseInfo?.images || exerciseInfo.images.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        prev >= (exerciseInfo.images?.length || 1) - 1 ? 0 : prev + 1
      );
    }, 2000);

    return () => clearInterval(interval);
  }, [exerciseInfo?.images]);

  if (isLoading) {
    return (
      <div className="bg-steel/50 border border-steel-light p-3 animate-pulse">
        <div className="h-4 bg-steel-light rounded w-24 mb-2"></div>
        <div className="h-32 bg-steel-light rounded"></div>
      </div>
    );
  }

  if (!exerciseInfo?.found) {
    return null; // Don't show anything if no match found
  }

  return (
    <div className="bg-steel/50 border border-steel-light overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-steel-light/30 transition-colors"
      >
        <span className="text-bone/60 text-xs uppercase tracking-wider">
          {t.session.formHelper || "Form Helper"}
        </span>
        <svg
          className={`w-4 h-4 text-bone/60 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable content */}
      {isExpanded && (
        <div className="p-3 pt-0 space-y-3">
          {/* Image */}
          {exerciseInfo.images && exerciseInfo.images.length > 0 && !imageError && (
            <div className="relative bg-black/20 rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={exerciseInfo.images[currentImageIndex]}
                alt={`${exerciseInfo.name} demonstration`}
                className="w-full h-auto max-h-64 object-contain mx-auto"
                onError={() => setImageError(true)}
              />
              {exerciseInfo.images.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {exerciseInfo.images.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full ${
                        idx === currentImageIndex ? "bg-crimson" : "bg-bone/40"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          {exerciseInfo.instructions && exerciseInfo.instructions.length > 0 && (
            <div className="space-y-2">
              <p className="text-bone/60 text-xs uppercase tracking-wider">
                {t.session.instructions || "Instructions"}
              </p>
              <ol className="text-bone/80 text-sm space-y-1 list-decimal list-inside">
                {exerciseInfo.instructions.slice(0, 4).map((instruction, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {instruction}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
