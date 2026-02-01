import { getOrCreateUser, isAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SettingsView } from "./settings-view";
import { getTranslations, type Language } from "@/lib/translations";

export default async function SettingsPage() {
  const user = await getOrCreateUser();

  if (!user) {
    redirect("/sign-in");
  }

  const t = getTranslations(user.language as Language);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-steel-light">
        <Link
          href="/"
          className="font-[family-name:var(--font-bebas)] text-2xl tracking-wider text-crimson"
        >
          {t.appName}
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground mb-8">
            {t.settings.title}
          </h1>

          <SettingsView
            currentLanguage={user.language as Language}
            translations={t}
          />

          {/* Admin link */}
          {isAdmin(user.email) && (
            <div className="mt-8 pt-8 border-t border-steel-light">
              <Link
                href="/admin"
                className="card-brutal p-4 block hover:border-crimson/50 transition-colors"
              >
                <p className="font-[family-name:var(--font-bebas)] text-xl tracking-wide text-crimson">
                  {t.admin.title}
                </p>
                <p className="text-bone/40 text-sm">
                  Manage users and assign plans
                </p>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer nav */}
      <nav className="border-t border-steel-light p-4">
        <div className="flex justify-around text-bone/60 text-sm">
          <Link href="/" className="hover:text-bone">
            {t.nav.today}
          </Link>
          <Link href="/history" className="hover:text-bone">
            {t.nav.history}
          </Link>
          <Link href="/progress" className="hover:text-bone">
            {t.nav.progress}
          </Link>
          <span className="text-crimson">{t.nav.settings}</span>
        </div>
      </nav>
    </div>
  );
}
