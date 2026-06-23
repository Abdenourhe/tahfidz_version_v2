"use client"
// src/contexts/LanguageContext.tsx

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { Locale, SectionKey, translations } from "@/lib/i18n/translations"

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/([$?*|{}\[\]\\/+,^])/g, "\\$1") + "=([^;]*)"))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  /** Traduit une clé : useT("nav", "dashboard") */
  useT: (section: SectionKey, key: string) => string
  /** Direction CSS de la locale active */
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "fr",
  setLocale: () => {},
  useT: (_, key) => key,
  dir: "ltr",
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr")

  // Lire la locale depuis localStorage ou le cookie au montage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("locale") as Locale | null
      if (saved && ["fr", "en", "ar"].includes(saved)) {
        setLocaleState(saved)
        setCookie("locale", saved)
        return
      }
      const cookieLocale = getCookie("locale") as Locale | null
      if (cookieLocale && ["fr", "en", "ar"].includes(cookieLocale)) {
        setLocaleState(cookieLocale)
      }
    } catch {}
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem("locale", newLocale)
    } catch {}
    setCookie("locale", newLocale)
    // Appliquer direction et lang sur <html>
    document.documentElement.lang = newLocale
    document.documentElement.dir  = newLocale === "ar" ? "rtl" : "ltr"
  }, [])

  // Fonction de traduction
  const useT = useCallback((section: SectionKey, key: string): string => {
    const sectionData = translations[section] as Record<string, Record<Locale, string>>
    const entry = sectionData?.[key]
    if (!entry) return key
    return entry[locale] ?? entry.fr ?? key
  }, [locale])

  // Synchroniser dir/lang sur <html> à chaque changement de locale
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale])

  const dir: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr"

  return (
    <LanguageContext.Provider value={{ locale, setLocale, useT, dir }}>
      {children}
    </LanguageContext.Provider>
  )
}

/** Hook principal à utiliser dans tous les composants */
export function useLanguage() {
  return useContext(LanguageContext)
}

/** Hook raccourci : const t = useT("nav") — puis t("dashboard") */
export function useT(section: SectionKey) {
  const { useT: translate } = useContext(LanguageContext)
  return useCallback((key: string) => translate(section, key), [translate, section])
}
