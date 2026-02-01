"use server";

import { db } from "@/lib/db";
import { plans, planDays, planDayExercises } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updatePlanDayExercise(
  planDayExerciseId: string,
  targetSets: number,
  targetReps: string,
  defaultReps: number
) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  await db
    .update(planDayExercises)
    .set({ targetSets, targetReps, defaultReps })
    .where(eq(planDayExercises.id, planDayExerciseId));

  revalidatePath("/admin");
}

export async function removePlanDayExercise(planDayExerciseId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  await db
    .delete(planDayExercises)
    .where(eq(planDayExercises.id, planDayExerciseId));

  revalidatePath("/admin");
}

export async function addExerciseToDay(
  planDayId: string,
  exerciseId: string,
  order: number
) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  await db.insert(planDayExercises).values({
    planDayId,
    exerciseId,
    order,
    targetSets: 3,
    targetReps: "8-12",
    defaultReps: 8,
  });

  revalidatePath("/admin");
}

export async function updateDayName(planDayId: string, name: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  await db
    .update(planDays)
    .set({ name })
    .where(eq(planDays.id, planDayId));

  revalidatePath("/admin");
}

export async function deletePlan(planId: string) {
  const admin = await getAdminUser();
  if (!admin) throw new Error("Unauthorized");

  // Delete plan (days and exercises will cascade)
  await db.delete(plans).where(eq(plans.id, planId));

  revalidatePath("/admin");
}
