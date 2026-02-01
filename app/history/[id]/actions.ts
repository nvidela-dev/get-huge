"use server";

import { db } from "@/lib/db";
import { sessions, sessionSets } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function deleteSession(sessionId: string) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership before deleting
  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session[0]) {
    throw new Error("Session not found");
  }

  // Delete session (sets will cascade delete)
  await db.delete(sessions).where(eq(sessions.id, sessionId));

  revalidatePath("/history");
  revalidatePath("/");
  redirect("/history");
}

export async function deleteSet(setId: string, sessionId: string) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify session ownership before deleting set
  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session[0]) {
    throw new Error("Session not found");
  }

  await db.delete(sessionSets).where(eq(sessionSets.id, setId));

  revalidatePath(`/history/${sessionId}`);
  revalidatePath("/history");
}

export async function updateSet(
  setId: string,
  sessionId: string,
  weight: string,
  reps: number
) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify session ownership before updating set
  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session[0]) {
    throw new Error("Session not found");
  }

  await db
    .update(sessionSets)
    .set({ weight, reps })
    .where(eq(sessionSets.id, setId));

  revalidatePath(`/history/${sessionId}`);
  revalidatePath("/history");
}

export async function updateSessionNotes(sessionId: string, notes: string) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership before updating
  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session[0]) {
    throw new Error("Session not found");
  }

  await db
    .update(sessions)
    .set({ notes: notes || null })
    .where(eq(sessions.id, sessionId));

  revalidatePath(`/history/${sessionId}`);
}

export async function updateSessionTimes(
  sessionId: string,
  startedAt: string,
  endedAt: string
) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Verify ownership before updating
  const session = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), eq(sessions.userId, user.id)))
    .limit(1);

  if (!session[0]) {
    throw new Error("Session not found");
  }

  const startDate = new Date(startedAt);
  const endDate = new Date(endedAt);

  // Validate that end is after start
  if (endDate <= startDate) {
    throw new Error("End time must be after start time");
  }

  await db
    .update(sessions)
    .set({
      startedAt: startDate,
      endedAt: endDate,
    })
    .where(eq(sessions.id, sessionId));

  revalidatePath(`/history/${sessionId}`);
  revalidatePath("/history");
}
