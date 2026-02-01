"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { Language } from "@/lib/translations";

export async function updateLanguage(language: Language) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ language })
    .where(eq(users.id, user.id));

  // Revalidate all pages since language affects everything
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/history");
  revalidatePath("/progress");
  revalidatePath("/plans");
}
