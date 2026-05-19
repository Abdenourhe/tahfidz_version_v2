"use client"
// src/components/ui/LanguageSwitcher.tsx
// Petit switcher réutilisable — utilise le LanguageContext global

import { useLanguage } from "@/contexts/LanguageContext"
import type { Locale } from "@/lib/i18n/translations"

interface LanguageSwitcherProps {
  className?: string
}

const LANGS: { code: Locale; label: string }[] = [
  { code: "fr", label: "FR" },
  { code: "en", label: "EN" },
  { code: "ar", label: "AR" },
]

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {LANGS.map(lang => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            locale === lang.code
              ? "bg-tahfidz-green text-white"
              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          } ${lang.code === "ar" ? "font-arabic" : ""}`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  )
}
