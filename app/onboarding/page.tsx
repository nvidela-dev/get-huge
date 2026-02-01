import { getOrCreateUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LanguageSelector } from "./language-selector";

export default async function OnboardingPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  // If user already has a plan, they've completed onboarding
  if (user.currentPlanId) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex items-center justify-center p-4 border-b border-steel-light">
        <h1 className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson">
          LIFTTRACK
        </h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6">
        <LanguageSelector currentLanguage={user.language as "en" | "es"} />
      </main>
    </div>
  );
}
