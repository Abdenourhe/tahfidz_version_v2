"use client"
// src/components/layout/TopBarControls.tsx
// Barre de contrôles en haut des pages : changement de langue + mode sombre

import { useLanguage } from "@/contexts/LanguageContext"
import { useEffect, useState } from "react"
import { Sun, Moon } from "lucide-react"

const LANGS = [
  { code: "fr", flag: "🇫🇷", label: "FR" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "ar", flag: "🇸🇦", label: "AR" },
] as const

export function TopBarControls() {
  const { locale, setLocale } = useLanguage()
  const [dark, setDark] = useState(false)

  // Sync with current theme on mount
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  const toggleDark = () => {
    const isDark = document.documentElement.classList.toggle("dark")
    setDark(isDark)
    localStorage.setItem("theme", isDark ? "dark" : "light")
  }

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      {/* Language buttons */}
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
        {LANGS.map(({ code, flag, label }) => (
          <button
            key={code}
            onClick={() => setLocale(code)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              locale === code
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            <span>{flag}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Dark mode toggle */}
      <button
        onClick={toggleDark}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        title={dark ? "Mode clair" : "Mode sombre"}
      >
        {dark ? <Sun size={15} /> : <Moon size={15} />}
      </button>
    </div>
  )
}
