export interface PlanExerciseJSON {
  name: string;
  muscleGroup: string;
  isCompound: boolean;
  isBodyweight?: boolean;
  nextProgression?: string; // Name of the next harder exercise
  difficultyMultiplier?: number; // For bodyweight XP calculation (default 1.0)
  targetSets: number;
  targetReps: string;
  defaultReps?: number; // Default reps for logging (parsed from targetReps if not provided)
  rpeTarget?: number;
}

export interface PlanDayJSON {
  dayNumber: number;
  name: string;
  exercises: PlanExerciseJSON[];
}

export interface PlanJSON {
  name: string;
  description: string;
  type?: "weightlifting" | "bodyweight" | "mobility";
  totalWeeks: number | null;
  daysPerWeek: number;
  days: PlanDayJSON[];
}
