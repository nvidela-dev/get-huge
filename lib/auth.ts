import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getOrCreateUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  // Check if user exists in our DB
  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  if (existingUsers.length > 0) {
    return existingUsers[0];
  }

  // Create user if doesn't exist (fallback for when webhook hasn't fired)
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  const [newUser] = await db
    .insert(users)
    .values({
      clerkId: clerkUser.id,
      email,
      name,
    })
    .returning();

  return newUser;
}

export async function getCurrentUser() {
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const existingUsers = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkUser.id))
    .limit(1);

  return existingUsers[0] ?? null;
}

const ADMIN_EMAIL = "videla.jn@gmail.com";

export function isAdmin(email: string): boolean {
  return email === ADMIN_EMAIL;
}

export async function getAdminUser() {
  const user = await getOrCreateUser();
  if (!user || !isAdmin(user.email)) {
    return null;
  }
  return user;
}
