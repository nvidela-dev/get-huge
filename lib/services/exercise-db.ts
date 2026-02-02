// Free Exercise Database service
// Source: https://github.com/yuhonas/free-exercise-db

const EXERCISE_DB_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGE_BASE_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

export interface ExerciseDBEntry {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

// In-memory cache
let exerciseCache: ExerciseDBEntry[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExerciseDatabase(): Promise<ExerciseDBEntry[]> {
  // Return cached data if still valid
  if (exerciseCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return exerciseCache;
  }

  try {
    const response = await fetch(EXERCISE_DB_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exercise database: ${response.status}`);
    }

    exerciseCache = await response.json();
    cacheTimestamp = Date.now();
    return exerciseCache!;
  } catch (error) {
    console.error("Error fetching exercise database:", error);
    // Return cached data even if expired, or empty array
    return exerciseCache || [];
  }
}

// Normalize exercise name for matching
function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .replace(/\s+/g, " ") // Normalize spaces
    .trim();
}

// Calculate similarity score between two strings (Jaccard similarity on words)
function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeExerciseName(a).split(" "));
  const wordsB = new Set(normalizeExerciseName(b).split(" "));

  const intersection = new Set([...wordsA].filter((x) => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

// Check if string contains all words from another string
function containsAllWords(haystack: string, needle: string): boolean {
  const haystackNorm = normalizeExerciseName(haystack);
  const needleWords = normalizeExerciseName(needle).split(" ");
  return needleWords.every((word) => haystackNorm.includes(word));
}

// Find best matching exercise from database
export async function findExerciseMatch(
  exerciseName: string
): Promise<ExerciseDBEntry | null> {
  const database = await getExerciseDatabase();
  const normalizedSearch = normalizeExerciseName(exerciseName);

  // Try exact match first
  const exactMatch = database.find(
    (ex) => normalizeExerciseName(ex.name) === normalizedSearch
  );
  if (exactMatch) return exactMatch;

  // Try contains all words match
  const containsMatch = database.find((ex) =>
    containsAllWords(ex.name, exerciseName)
  );
  if (containsMatch) return containsMatch;

  // Fallback to similarity scoring
  let bestMatch: ExerciseDBEntry | null = null;
  let bestScore = 0;

  for (const exercise of database) {
    const score = calculateSimilarity(exercise.name, exerciseName);
    if (score > bestScore && score > 0.3) {
      // Minimum 30% similarity threshold
      bestScore = score;
      bestMatch = exercise;
    }
  }

  return bestMatch;
}

// Get full image URLs for an exercise
export function getExerciseImageUrls(exercise: ExerciseDBEntry): string[] {
  return exercise.images.map((img) => `${IMAGE_BASE_URL}${img}`);
}

// Combined function to get exercise info with images
export async function getExerciseInfo(exerciseName: string): Promise<{
  found: boolean;
  name?: string;
  images?: string[];
  instructions?: string[];
  level?: string;
  primaryMuscles?: string[];
} | null> {
  const match = await findExerciseMatch(exerciseName);

  if (!match) {
    return { found: false };
  }

  return {
    found: true,
    name: match.name,
    images: getExerciseImageUrls(match),
    instructions: match.instructions,
    level: match.level,
    primaryMuscles: match.primaryMuscles,
  };
}

// Manual overrides for exercises that don't match well
const EXERCISE_OVERRIDES: Record<string, string> = {
  // Our exercise name -> free-exercise-db name
  "push-ups": "Pushups",
  pushups: "Pushups",
  "chin-ups": "Chin-Up",
  chinups: "Chin-Up",
  "pull-ups": "Pullups",
  pullups: "Pullups",
  "air squats": "Bodyweight Squat",
  "bodyweight squat": "Bodyweight Squat",
  "glute bridge": "Barbell Glute Bridge",
  "wall push-up": "Pushups", // Basic form is similar
  "wall pushup": "Pushups",
  plank: "Plank",
  "plank knees": "Plank",
  "dead bug": "Dead Bug",
  lunges: "Bodyweight Walking Lunge",
  "calf raises": "Standing Calf Raises",
  "standing calf raises": "Standing Calf Raises",
  "superman hold": "Superman",
  superman: "Superman",
  "incline push-up": "Incline Push-Up",
  "incline pushup": "Incline Push-Up",
  "decline push-ups": "Decline Push-Up",
  "decline pushups": "Decline Push-Up",
  "diamond push-ups": "Close-Grip Push-Up off of a Dumbbell",
  "diamond pushups": "Close-Grip Push-Up off of a Dumbbell",
  "pike push-ups": "Handstand Push-Ups",
  "pike pushups": "Handstand Push-Ups",
  "australian rows": "Inverted Row",
  "doorframe rows": "Inverted Row",
  "wide grip pull-ups": "Wide-Grip Lat Pulldown",
  "sumo squat": "Sumo Deadlift",
  squat: "Bodyweight Squat",
  "hip circles": "Hip Circles (prone)",
  "arm circles": "Arm Circles",
  "cat-cow": "Cat Stretch",
  "childs pose": "Child's Pose",
  "figure four stretch": "Piriformis-SMR",
  "quad stretch": "Quad Stretch",
};

export async function getExerciseInfoWithOverrides(
  exerciseName: string
): Promise<{
  found: boolean;
  name?: string;
  images?: string[];
  instructions?: string[];
  level?: string;
  primaryMuscles?: string[];
}> {
  // Check for manual override first
  const normalizedName = normalizeExerciseName(exerciseName);
  const overrideName = EXERCISE_OVERRIDES[normalizedName];

  if (overrideName) {
    const result = await getExerciseInfo(overrideName);
    if (result?.found) return result;
  }

  // Try regular matching
  const result = await getExerciseInfo(exerciseName);
  return result || { found: false };
}
