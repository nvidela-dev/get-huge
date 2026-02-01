"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { updateLanguage } from "./actions";
import type { Language, Translations } from "@/lib/translations";

interface SettingsViewProps {
  currentLanguage: Language;
  translations: Translations;
}

export function SettingsView({ currentLanguage, translations: t }: SettingsViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Language>(currentLanguage);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setSelected(language);
    setSaved(false);
    startTransition(async () => {
      await updateLanguage(language);
      setSaved(true);
      router.refresh();
      // Hide saved message after 2 seconds
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="space-y-6">
      {/* Training Plan Link */}
      <Link
        href="/plans"
        className="card-brutal p-6 flex justify-between items-center hover:border-crimson/50 transition-colors"
      >
        <div>
          <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
            {t.nav.plans}
          </h2>
          <p className="text-bone/60 text-sm">{t.plans.selectPlanDesc}</p>
        </div>
        <span className="text-bone/40">→</span>
      </Link>

      {/* Language Setting */}
      <div className="card-brutal p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
              {t.settings.language}
            </h2>
            <p className="text-bone/60 text-sm">{t.settings.languageDesc}</p>
          </div>
          {isPending && (
            <span className="text-bone/40 text-sm">{t.settings.saving}</span>
          )}
          {saved && !isPending && (
            <span className="text-green-500 text-sm">{t.settings.saved}</span>
          )}
        </div>

        <div className="space-y-2">
          <button
            onClick={() => handleLanguageChange("en")}
            disabled={isPending}
            className={`w-full p-4 text-left transition-colors border ${
              selected === "en"
                ? "border-crimson bg-crimson/10"
                : "border-steel-light hover:border-crimson/50"
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇺🇸</span>
              <div>
                <p className="text-foreground font-medium">English</p>
                <p className="text-bone/40 text-xs">English (US)</p>
              </div>
              {selected === "en" && (
                <span className="ml-auto text-crimson">✓</span>
              )}
            </div>
          </button>

          <button
            onClick={() => handleLanguageChange("es")}
            disabled={isPending}
            className={`w-full p-4 text-left transition-colors border ${
              selected === "es"
                ? "border-crimson bg-crimson/10"
                : "border-steel-light hover:border-crimson/50"
            } disabled:opacity-50`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇪🇸</span>
              <div>
                <p className="text-foreground font-medium">Español</p>
                <p className="text-bone/40 text-xs">Spanish</p>
              </div>
              {selected === "es" && (
                <span className="ml-auto text-crimson">✓</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
