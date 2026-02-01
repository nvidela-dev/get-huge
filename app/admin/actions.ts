"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function assignPlanToUser(userId: string, planId: string) {
  const admin = await getAdminUser();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      currentPlanId: planId,
      planStartDate: new Date().toISOString().split("T")[0],
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
}

export async function removePlanFromUser(userId: string) {
  const admin = await getAdminUser();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  await db
    .update(users)
    .set({
      currentPlanId: null,
      planStartDate: null,
    })
    .where(eq(users.id, userId));

  revalidatePath("/admin");
}
