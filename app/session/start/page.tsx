import { getOrCreateUser } from "@/lib/auth";
import { startSession } from "@/lib/training";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{
    planDayId?: string;
    week?: string;
    day?: string;
  }>;
}

export default async function StartSessionPage({ searchParams }: Props) {
  const user = await getOrCreateUser();
  const params = await searchParams;

  if (!user) {
    redirect("/sign-in");
  }

  const { planDayId, week, day } = params;

  if (!planDayId || !week || !day) {
    redirect("/");
  }

  // Create the session
  const session = await startSession(
    user.id,
    planDayId,
    parseInt(week),
    parseInt(day)
  );

  // Redirect to the active session page
  redirect(`/session/${session.id}`);
}
