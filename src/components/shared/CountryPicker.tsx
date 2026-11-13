"use client"

// src/components/shared/CountryPicker.tsx
// Sélecteur de pays / d'indicatif téléphonique avec recherche.
// - Liste complète ISO 3166 (src/data/countries.ts)
// - Noms localisés via Intl.DisplayNames (fr/en/ar)
// - Drapeaux SVG via react-country-flag
// - Dropdown rendu en portal : jamais tronqué par un parent en overflow-hidden,
//   s'ouvre vers le haut si l'espace manque en dessous.

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import ReactCountryFlag from "react-country-flag"
import { ChevronDown, Search, Check } from "lucide-react"
import { COUNTRIES, getCountryName, getDialCode } from "@/data/countries"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface CountryPickerProps {
  /** Code ISO 3166-1 alpha-2 sélectionné (ex: "CA") */
  value: string
  onChange: (iso: string) => void
  /** "country" = drapeau + nom | "dial" = drapeau + indicatif */
  mode?: "country" | "dial"
  className?: string
}

interface DropdownPos {
  left: number
  width: number
  /** Ouverture vers le bas (top) ou vers le haut (bottom) */
  top?: number
  bottom?: number
}

const DROPDOWN_HEIGHT = 290 // hauteur estimée (recherche + liste max-h-60)

export default function CountryPicker({ value, onChange, mode = "country", className }: CountryPickerProps) {
  const { locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [pos, setPos] = useState<DropdownPos | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const searchLabels: Record<string, string> = {
    fr: "Rechercher un pays…",
    en: "Search a country…",
    ar: "ابحث عن دولة…",
  }

  // Noms localisés mémoïsés par locale
  const names = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of COUNTRIES) map.set(c.iso, getCountryName(c.iso, locale))
    return map
  }, [locale])

  // Tri : par nom (mode country) ou par indicatif puis nom (mode dial)
  const sorted = useMemo(() => {
    const list = [...COUNTRIES]
    if (mode === "dial") {
      list.sort((a, b) =>
        Number(a.dial.slice(1)) - Number(b.dial.slice(1)) ||
        (names.get(a.iso) ?? "").localeCompare(names.get(b.iso) ?? "", locale)
      )
    } else {
      list.sort((a, b) => (names.get(a.iso) ?? "").localeCompare(names.get(b.iso) ?? "", locale))
    }
    return list
  }, [names, mode, locale])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sorted
    return sorted.filter((c) => {
      const name = (names.get(c.iso) ?? "").toLowerCase()
      return name.includes(q) || c.iso.toLowerCase().includes(q) || c.dial.includes(q)
    })
  }, [sorted, search, names])

  const close = () => {
    setOpen(false)
    setSearch("")
  }

  const toggle = () => {
    if (open) {
      close()
      return
    }
    const rect = buttonRef.current?.getBoundingClientRect()
    if (!rect) return
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < DROPDOWN_HEIGHT && rect.top > spaceBelow
    const width = Math.min(Math.max(rect.width, 250), window.innerWidth - 16)
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    setPos(
      openUp
        ? { left, width, bottom: window.innerHeight - rect.top + 6 }
        : { left, width, top: rect.bottom + 6 }
    )
    setOpen(true)
  }

  // Fermeture au clic extérieur
  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (buttonRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      close()
    }
    // Fermeture au scroll / resize (hors scroll interne de la liste)
    const onScroll = (e: Event) => {
      if (dropdownRef.current?.contains(e.target as Node)) return
      close()
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
    }
    document.addEventListener("mousedown", onPointerDown)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", onScroll)
    document.addEventListener("keydown", onEscape)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", onScroll)
      document.removeEventListener("keydown", onEscape)
    }
  }, [open])

  // Focus recherche + scroll sur le pays sélectionné à l'ouverture
  useEffect(() => {
    if (!open) return
    setTimeout(() => {
      searchRef.current?.focus()
      selectedRef.current?.scrollIntoView({ block: "center" })
    }, 50)
  }, [open])

  const flag = (iso: string, size = "1.1em") => (
    <ReactCountryFlag
      countryCode={iso}
      svg
      style={{ width: size, height: size, borderRadius: "2px", flexShrink: 0 }}
      title={names.get(iso) ?? iso}
    />
  )

  const dropdown = open && pos && typeof document !== "undefined" && createPortal(
    <div
      ref={dropdownRef}
      style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
      className="z-[9999] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
    >
      <div className="p-2 border-b border-gray-100 dark:border-gray-700">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={searchLabels[locale] ?? searchLabels.fr}
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50"
          />
        </div>
      </div>
      <div className="max-h-60 overflow-y-auto overscroll-contain">
        {filtered.length === 0 && (
          <p className="px-4 py-3 text-sm text-gray-400">—</p>
        )}
        {filtered.map((c) => (
          <button
            key={c.iso}
            ref={c.iso === value ? selectedRef : undefined}
            type="button"
            onClick={() => {
              onChange(c.iso)
              close()
            }}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rtl:text-right hover:bg-gray-50 dark:hover:bg-gray-700 transition dark:text-gray-200",
              c.iso === value && "bg-emerald-50 dark:bg-emerald-900/20"
            )}
          >
            {flag(c.iso)}
            <span className="flex-1 truncate">{names.get(c.iso)}</span>
            <span className="text-xs text-gray-400 tabular-nums">{c.dial}</span>
            {c.iso === value && <Check size={14} className="text-tahfidz-green" />}
          </button>
        ))}
      </div>
    </div>,
    document.body
  )

  return (
    <div className={cn("relative", className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green transition text-sm dark:text-white"
      >
        {flag(value)}
        <span className="flex-1 text-left rtl:text-right truncate">
          {mode === "dial" ? getDialCode(value) : (names.get(value) ?? value)}
        </span>
        <ChevronDown size={16} className={cn("text-gray-400 transition-transform", open && "rotate-180")} />
      </button>
      {dropdown}
    </div>
  )
}
