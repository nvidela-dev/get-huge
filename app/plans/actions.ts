"use server";

import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function selectPlan(planId: string) {
  // Only admin can select plans
  const admin = await getAdminUser();

  if (!admin) {
    throw new Error("Unauthorized");
  }

  // Admin selects for themselves
  await db
    .update(users)
    .set({
      currentPlanId: planId,
      planStartDate: new Date().toISOString().split("T")[0],
    })
    .where(eq(users.id, admin.id));

  revalidatePath("/");
  revalidatePath("/plans");
}
