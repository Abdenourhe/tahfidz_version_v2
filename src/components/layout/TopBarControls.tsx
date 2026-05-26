"use client"
// src/components/layout/TopBarControls.tsx
// Barre de contrôles en haut : changement de langue + mode sombre (animé)

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/contexts/LanguageContext"
import { Sun, Moon } from "lucide-react"
import ReactCountryFlag from "react-country-flag"
import { motion, AnimatePresence } from "framer-motion"

interface TopBarControlsProps {
  dropdownAlign?: "left" | "right"
}

export function TopBarControls({ dropdownAlign = "right" }: TopBarControlsProps) {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {/* Language Switcher avec dropdown animé */}
      <div className="relative">
        <button
          onClick={() => setLangMenuOpen(!langMenuOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition text-xs font-medium"
          aria-label="Change language"
        >
          <ReactCountryFlag
            countryCode={locale === "fr" ? "FR" : locale === "en" ? "GB" : "SA"}
            svg
            style={{ width: "1.2em", height: "1.2em" }}
          />
        </button>

        <AnimatePresence>
          {langMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40"
                onClick={() => setLangMenuOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`absolute ${dropdownAlign === "right" ? "right-0" : "left-0"} top-full mt-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xl p-1 z-50 min-w-[140px]`}
              >
                {(["fr", "en", "ar"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setLocale(lang)
                      setLangMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition ${
                      locale === lang
                        ? "bg-tahfidz-green/10 text-tahfidz-green font-medium"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <ReactCountryFlag
                      countryCode={lang === "fr" ? "FR" : lang === "en" ? "GB" : "SA"}
                      svg
                      style={{ width: "1.2em", height: "1.2em" }}
                    />
                    <span className="uppercase">{lang}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Dark Mode Toggle avec animation */}
      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition overflow-hidden"
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {mounted && theme === "dark" ? (
            <motion.div
              key="sun"
              initial={{ y: 20, rotate: -90 }}
              animate={{ y: 0, rotate: 0 }}
              exit={{ y: -20, rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={16} className="text-yellow-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ y: 20, rotate: 90 }}
              animate={{ y: 0, rotate: 0 }}
              exit={{ y: -20, rotate: -90 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={16} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  )
}
