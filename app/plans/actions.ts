"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function selectPlan(planId: string) {
  const user = await getOrCreateUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  await db
    .update(users)
    .set({
      currentPlanId: planId,
      planStartDate: new Date().toISOString().split("T")[0],
    })
    .where(eq(users.id, user.id));

  revalidatePath("/");
  revalidatePath("/plans");
}
