export interface PlanExerciseJSON {
  name: string;
  muscleGroup: string;
  isCompound: boolean;
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
  totalWeeks: number | null;
  daysPerWeek: number;
  days: PlanDayJSON[];
}
