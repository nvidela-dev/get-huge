export interface PlanExerciseJSON {
  name: string;
  muscleGroup: string;
  isCompound: boolean;
  isBodyweight?: boolean;
  nextProgression?: string; // Name of the next harder exercise
  targetSets: number;
  targetReps: string;
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
