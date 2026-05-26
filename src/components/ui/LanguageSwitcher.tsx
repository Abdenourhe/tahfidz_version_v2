"use client"
// src/components/ui/LanguageSwitcher.tsx
// Petit switcher réutilisable avec drapeaux SVG

import { useLanguage } from "@/contexts/LanguageContext"
import type { Locale } from "@/lib/i18n/translations"
import ReactCountryFlag from "react-country-flag"

interface LanguageSwitcherProps {
  className?: string
}

const LANGS: { code: Locale; countryCode: string; label: string }[] = [
  { code: "fr", countryCode: "FR", label: "FR" },
  { code: "en", countryCode: "GB", label: "EN" },
  { code: "ar", countryCode: "SA", label: "AR" },
]

export function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage()

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {LANGS.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLocale(lang.code)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
            locale === lang.code
              ? "bg-tahfidz-green text-white"
              : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          } ${lang.code === "ar" ? "font-arabic" : ""}`}
          aria-label={lang.label}
        >
          <ReactCountryFlag
            countryCode={lang.countryCode}
            svg
            style={{ width: "1.2em", height: "1.2em" }}
          />
          <span className="uppercase">{lang.label}</span>
        </button>
      ))}
    </div>
  )
}
