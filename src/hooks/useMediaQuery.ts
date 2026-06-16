"use client"
// Hook générique pour écouter une media query
// NOTE : initialisé à false pour éviter les erreurs d'hydratation SSR.

import { useState, useEffect } from "react"

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setMatches(e.matches)
    handler(mql)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [query])

  return matches
}
