// XP thresholds for each level (exponential curve)
// Level 1 starts at 0 XP, Level 2 requires 100 XP total, etc.
export const XP_THRESHOLDS = [
  0, // Level 1
  100, // Level 2
  250, // Level 3
  500, // Level 4
  850, // Level 5
  1300, // Level 6
  1900, // Level 7
  2650, // Level 8
  3550, // Level 9
  4600, // Level 10
  5800, // Level 11
  7200, // Level 12
  8800, // Level 13
  10600, // Level 14
  12600, // Level 15
  14800, // Level 16
  17200, // Level 17
  19800, // Level 18
  22600, // Level 19
  25600, // Level 20
];

// Progression bonus multiplier (20% bonus for increasing weight or reps)
export const PROGRESSION_BONUS_MULTIPLIER = 0.2;

// Base multiplier for bodyweight exercises (since they have no weight)
export const BODYWEIGHT_BASE_FACTOR = 10;

/**
 * Get the XP threshold for a specific level
 * For levels beyond the predefined thresholds, use exponential formula
 */
export function getXpThresholdForLevel(level: number): number {
  if (level <= 0) return 0;
  if (level <= XP_THRESHOLDS.length) {
    return XP_THRESHOLDS[level - 1];
  }
  // Exponential formula for levels beyond 20
  // Each level requires ~1.15x the previous level's threshold
  return Math.floor(25600 * Math.pow(1.15, level - 20));
}

/**
 * Calculate level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  if (totalXp < 0) return 1;

  // Check predefined thresholds first
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= XP_THRESHOLDS[i]) {
      return i + 1;
    }
  }

  // For XP beyond predefined thresholds
  let level = XP_THRESHOLDS.length;
  while (getXpThresholdForLevel(level + 1) <= totalXp) {
    level++;
  }
  return level;
}

/**
 * Get detailed XP progress for display
 */
export function getXpProgress(totalXp: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpToNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = getLevelFromXp(totalXp);
  const currentLevelThreshold = getXpThresholdForLevel(currentLevel);
  const nextLevelThreshold = getXpThresholdForLevel(currentLevel + 1);

  const xpInCurrentLevel = totalXp - currentLevelThreshold;
  const xpToNextLevel = nextLevelThreshold - currentLevelThreshold;

  return {
    currentLevel,
    xpInCurrentLevel,
    xpToNextLevel,
    progressPercent:
      xpToNextLevel > 0
        ? Math.min(100, Math.floor((xpInCurrentLevel / xpToNextLevel) * 100))
        : 100,
  };
}

interface SetData {
  weight: number;
  reps: number;
  isBodyweight: boolean;
  difficultyMultiplier: number;
}

/**
 * Calculate volume/base XP for a single set
 * Weighted exercises: weight * reps
 * Bodyweight exercises: reps * difficultyMultiplier * BODYWEIGHT_BASE_FACTOR
 */
export function calculateVolume(set: SetData): number {
  if (set.isBodyweight || set.weight === 0) {
    return Math.floor(
      set.reps * set.difficultyMultiplier * BODYWEIGHT_BASE_FACTOR
    );
  }
  return Math.floor(set.weight * set.reps);
}

interface ProgressionContext {
  currentWeight: number;
  currentReps: number;
  previousWeight: number | null;
  previousReps: number | null;
}

/**
 * Calculate progression bonus
 * Returns bonus XP if user increased weight or reps from previous session
 */
export function calculateProgressionBonus(
  baseXp: number,
  context: ProgressionContext
): number {
  const { currentWeight, currentReps, previousWeight, previousReps } = context;

  // No previous data = no bonus (first time doing this exercise)
  if (previousWeight === null || previousReps === null) return 0;

  let hasProgressed = false;

  // Weight increased = progression
  if (currentWeight > previousWeight) {
    hasProgressed = true;
  }

  // Same weight but more reps = progression
  if (currentWeight === previousWeight && currentReps > previousReps) {
    hasProgressed = true;
  }

  // 20% bonus for progression
  return hasProgressed ? Math.floor(baseXp * PROGRESSION_BONUS_MULTIPLIER) : 0;
}

/**
 * Calculate total XP for a set including progression bonus
 */
export function calculateSetXp(
  set: SetData,
  progressionContext: ProgressionContext
): { baseXp: number; progressionBonus: number; totalXp: number } {
  const baseXp = calculateVolume(set);
  const progressionBonus = calculateProgressionBonus(baseXp, progressionContext);
  const totalXp = baseXp + progressionBonus;

  return { baseXp, progressionBonus, totalXp };
}

// Canonical ordering for muscle groups
export const MUSCLE_GROUP_ORDER = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Full Body",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUP_ORDER)[number];

/**
 * Sort muscle groups by canonical order
 */
export function sortMuscleGroups<T extends { muscleGroup: string }>(
  data: T[]
): T[] {
  return [...data].sort((a, b) => {
    const aIndex = MUSCLE_GROUP_ORDER.indexOf(a.muscleGroup as MuscleGroup);
    const bIndex = MUSCLE_GROUP_ORDER.indexOf(b.muscleGroup as MuscleGroup);

    // Unknown muscle groups go to the end, sorted alphabetically
    if (aIndex === -1 && bIndex === -1) {
      return a.muscleGroup.localeCompare(b.muscleGroup);
    }
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}
