import { db } from "@/lib/db";
import { plans, planDays, planDayExercises } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlanCard } from "./plan-card";

export default async function PlansPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get all template plans with exercise counts
  const allPlans = await db
    .select({
      id: plans.id,
      name: plans.name,
      description: plans.description,
      daysPerWeek: plans.daysPerWeek,
    })
    .from(plans)
    .where(eq(plans.isTemplate, true));

  // Get exercise counts for each plan
  const plansWithCounts = await Promise.all(
    allPlans.map(async (plan) => {
      const days = await db
        .select({
          id: planDays.id,
          name: planDays.name,
          dayNumber: planDays.dayNumber,
        })
        .from(planDays)
        .where(eq(planDays.planId, plan.id))
        .orderBy(planDays.dayNumber);

      const exerciseCountResult = await db
        .select({ count: count() })
        .from(planDayExercises)
        .innerJoin(planDays, eq(planDayExercises.planDayId, planDays.id))
        .where(eq(planDays.planId, plan.id));

      return {
        ...plan,
        days,
        totalExercises: exerciseCountResult[0]?.count ?? 0,
        isSelected: user.currentPlanId === plan.id,
      };
    })
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson"
        >
          LIFTTRACK
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-2">
            TRAINING PLANS
          </h1>
          <p className="text-bone/60 mb-8">
            Select a plan to start your journey
          </p>

          <div className="space-y-4">
            {plansWithCounts.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          {plansWithCounts.length === 0 && (
            <div className="card-brutal p-8 text-center">
              <p className="text-bone/60">No plans available yet.</p>
              <p className="text-bone/40 text-sm mt-2">
                Run the seed script to add training plans.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <Link href="/" className="hover:text-bone">
            Today
          </Link>
          <Link href="/history" className="hover:text-bone">
            History
          </Link>
          <span>Progress</span>
          <span className="text-crimson">Plans</span>
        </div>
      </nav>
    </div>
  );
}
