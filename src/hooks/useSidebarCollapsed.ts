"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "tahfidz_sidebar_collapsed"
const EVENT_NAME = "sidebar:collapsed"

export function useSidebarCollapsed() {
  const [collapsed, setCollapsedState] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setCollapsedState(stored === "true")
    } catch { /* ignore */ }
    const handler = (e: Event) => setCollapsedState((e as CustomEvent).detail)
    window.addEventListener(EVENT_NAME, handler)
    return () => window.removeEventListener(EVENT_NAME, handler)
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setCollapsedState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch { /* ignore */ }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: value }))
    }
  }, [])

  const toggle = useCallback(() => {
    setCollapsed(!collapsed)
  }, [collapsed, setCollapsed])

  return { collapsed, setCollapsed, toggle }
}

export function listenSidebarCollapsed(callback: (collapsed: boolean) => void) {
  const handler = (e: Event) => callback((e as CustomEvent).detail)
  window.addEventListener(EVENT_NAME, handler)
  return () => window.removeEventListener(EVENT_NAME, handler)
}
