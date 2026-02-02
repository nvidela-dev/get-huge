"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  updateLanguage,
  updateTrackLaterEnabled,
  updateDefaultRestSeconds,
} from "./actions";
import type { Language, Translations } from "@/lib/translations";

interface SettingsViewProps {
  currentLanguage: Language;
  trackLaterEnabled: boolean;
  defaultRestSeconds: number;
  translations: Translations;
}

const REST_PRESETS = [60, 90, 120, 180];

export function SettingsView({
  currentLanguage,
  trackLaterEnabled,
  defaultRestSeconds,
  translations: t,
}: SettingsViewProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Language>(currentLanguage);
  const [trackLater, setTrackLater] = useState(trackLaterEnabled);
  const [restSeconds, setRestSeconds] = useState(defaultRestSeconds);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const handleLanguageChange = (language: Language) => {
    setSelected(language);
    setSaved(false);
    startTransition(async () => {
      await updateLanguage(language);
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleTrackLaterChange = (enabled: boolean) => {
    setTrackLater(enabled);
    setSaved(false);
    startTransition(async () => {
      await updateTrackLaterEnabled(enabled);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleRestSecondsChange = (seconds: number) => {
    setRestSeconds(seconds);
    setSaved(false);
    startTransition(async () => {
      await updateDefaultRestSeconds(seconds);
      setSaved(true);
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

      {/* Track Later Mode Setting */}
      <div className="card-brutal p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
              {t.settings.trackLater}
            </h2>
            <p className="text-bone/60 text-sm">{t.settings.trackLaterDesc}</p>
          </div>
          {isPending && (
            <span className="text-bone/40 text-sm">{t.settings.saving}</span>
          )}
          {saved && !isPending && (
            <span className="text-green-500 text-sm">{t.settings.saved}</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleTrackLaterChange(false)}
            disabled={isPending}
            className={`flex-1 p-3 text-center transition-colors border ${
              !trackLater
                ? "border-crimson bg-crimson/10 text-foreground"
                : "border-steel-light text-bone/60 hover:border-crimson/50"
            } disabled:opacity-50`}
          >
            {t.settings.trackLaterDisabled}
          </button>
          <button
            onClick={() => handleTrackLaterChange(true)}
            disabled={isPending}
            className={`flex-1 p-3 text-center transition-colors border ${
              trackLater
                ? "border-crimson bg-crimson/10 text-foreground"
                : "border-steel-light text-bone/60 hover:border-crimson/50"
            } disabled:opacity-50`}
          >
            {t.settings.trackLaterEnabled}
          </button>
        </div>
      </div>

      {/* Rest Timer Duration Setting */}
      <div className="card-brutal p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
              {t.settings.restTimer}
            </h2>
            <p className="text-bone/60 text-sm">{t.settings.restTimerDesc}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {REST_PRESETS.map((seconds) => (
            <button
              key={seconds}
              onClick={() => handleRestSecondsChange(seconds)}
              disabled={isPending}
              className={`p-3 text-center transition-colors border ${
                restSeconds === seconds
                  ? "border-crimson bg-crimson/10 text-foreground"
                  : "border-steel-light text-bone/60 hover:border-crimson/50"
              } disabled:opacity-50`}
            >
              <span className="font-[family-name:var(--font-bebas)] text-lg">
                {seconds}
              </span>
              <span className="text-xs block text-bone/40">
                {t.settings.seconds}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Language Setting */}
      <div className="card-brutal p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
              {t.settings.language}
            </h2>
            <p className="text-bone/60 text-sm">{t.settings.languageDesc}</p>
          </div>
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
