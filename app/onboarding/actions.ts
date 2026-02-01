"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Language } from "@/lib/translations";

export async function setLanguage(language: Language) {
  const user = await getOrCreateUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({ language })
    .where(eq(users.id, user.id));

  revalidatePath("/");
  revalidatePath("/onboarding");
  redirect("/plans");
}
