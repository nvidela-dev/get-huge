"use server";

import { db } from "@/lib/db";
import { exercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateExerciseVideoUrl(
  exerciseId: string,
  videoUrl: string | null
) {
  await db
    .update(exercises)
    .set({ videoUrl: videoUrl || null })
    .where(eq(exercises.id, exerciseId));

  revalidatePath("/admin/exercises");
}
