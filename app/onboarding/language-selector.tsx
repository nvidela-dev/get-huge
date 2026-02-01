"use client";

import { useState, useTransition } from "react";
import { setLanguage } from "./actions";
import type { Language } from "@/lib/translations";

interface LanguageSelectorProps {
  currentLanguage: Language;
}

export function LanguageSelector({ currentLanguage }: LanguageSelectorProps) {
  const [selected, setSelected] = useState<Language>(currentLanguage);
  const [isPending, startTransition] = useTransition();

  const handleContinue = () => {
    startTransition(async () => {
      await setLanguage(selected);
    });
  };

  return (
    <div className="text-center space-y-8 max-w-sm mx-auto">
      <div className="space-y-2">
        <h2 className="font-[family-name:var(--font-bebas)] text-4xl tracking-wide text-foreground">
          {selected === "en" ? "Select Your Language" : "Selecciona Tu Idioma"}
        </h2>
        <p className="text-bone/60">
          {selected === "en"
            ? "Choose your preferred language for the app"
            : "Elige tu idioma preferido para la aplicación"}
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setSelected("en")}
          className={`w-full card-brutal p-6 text-left transition-colors ${
            selected === "en"
              ? "border-crimson border-2"
              : "hover:border-crimson/50"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🇺🇸</span>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                English
              </p>
              <p className="text-bone/60 text-sm">English (US)</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setSelected("es")}
          className={`w-full card-brutal p-6 text-left transition-colors ${
            selected === "es"
              ? "border-crimson border-2"
              : "hover:border-crimson/50"
          }`}
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">🇪🇸</span>
            <div>
              <p className="font-[family-name:var(--font-bebas)] text-xl text-foreground">
                Español
              </p>
              <p className="text-bone/60 text-sm">Spanish</p>
            </div>
          </div>
        </button>
      </div>

      <button
        onClick={handleContinue}
        disabled={isPending}
        className="btn-brutal w-full px-12 py-4 text-xl font-[family-name:var(--font-bebas)] tracking-widest disabled:opacity-50"
      >
        {isPending
          ? "..."
          : selected === "en"
          ? "CONTINUE"
          : "CONTINUAR"}
      </button>
    </div>
  );
}
