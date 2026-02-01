"use server";

import { db } from "@/lib/db";
import { sessions, sessionSets } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: string,
  reps: number,
  isWarmup: boolean = false
) {
  await db.insert(sessionSets).values({
    sessionId,
    exerciseId,
    setNumber,
    weight,
    reps,
    isWarmup,
  });

  revalidatePath(`/session/${sessionId}`);
}

export async function endSession(sessionId: string, notes?: string) {
  await db
    .update(sessions)
    .set({
      endedAt: new Date(),
      notes,
    })
    .where(eq(sessions.id, sessionId));

  revalidatePath("/");
  revalidatePath(`/session/${sessionId}`);
}
