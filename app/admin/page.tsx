import { db } from "@/lib/db";
import { users, plans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAdminUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations, type Language } from "@/lib/translations";
import { AdminUserList } from "./admin-user-list";

export default async function AdminPage() {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/");
  }

  const t = getTranslations(admin.language as Language);

  // Resolve assigned plans independently of the template catalog.
  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      currentPlanId: users.currentPlanId,
      planName: plans.name,
    })
    .from(users)
    .leftJoin(plans, eq(users.currentPlanId, plans.id))
    .orderBy(users.createdAt);

  // Only templates are available in the shared catalog and assignment options.
  const allPlans = await db
    .select({
      id: plans.id,
      name: plans.name,
    })
    .from(plans)
    .where(eq(plans.isTemplate, true));

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/settings"
          className="text-bone/60 hover:text-bone transition-colors"
        >
          {t.nav.back}
        </Link>
        <h1 className="font-[family-name:var(--font-bebas)] text-xl tracking-wider text-crimson">
          {t.admin.title}
        </h1>
        <div className="w-16" />
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto space-y-12">
          {/* Exercises Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-foreground">
                {t.admin.exercises}
              </h2>
            </div>

            <Link
              href="/admin/exercises"
              className="card-brutal p-4 block hover:border-crimson/50 transition-colors"
            >
              <div className="flex justify-between items-center">
                <p className="text-bone">
                  {t.admin.manageVideoUrls}
                </p>
                <span className="text-bone/40 text-sm">→</span>
              </div>
            </Link>
          </section>

          {/* Plans Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-foreground">
                {t.admin.plans}
              </h2>
              <span className="text-bone/40 text-sm">
                {allPlans.length} {t.admin.planCount}
              </span>
            </div>

            <div className="space-y-3">
              {allPlans.map((plan) => (
                <Link
                  key={plan.id}
                  href={`/admin/plans/${plan.id}`}
                  className="card-brutal p-4 block hover:border-crimson/50 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-foreground">
                      {plan.name.toUpperCase()}
                    </p>
                    <span className="text-bone/40 text-sm">
                      {t.admin.editPlan} →
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Users Section */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-[family-name:var(--font-bebas)] text-3xl tracking-wide text-foreground">
                {t.admin.users}
              </h2>
              <span className="text-bone/40 text-sm">
                {allUsers.length} {t.admin.userCount}
              </span>
            </div>

            <AdminUserList
              users={allUsers}
              plans={allPlans}
              translations={t}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
