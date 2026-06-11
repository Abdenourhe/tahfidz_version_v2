"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { useSession } from "next-auth/react"

interface NotificationContextType {
  unreadCount: number
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  refresh: async () => {},
})

export const useNotification = () => useContext(NotificationContext)

// Simple beep using Web Audio API
function playBeep() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.value = 0.1
    osc.start()
    osc.stop(ctx.currentTime + 0.15)
  } catch { /* ignore */ }
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const prevCountRef = useRef(0)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const isFirstLoadRef = useRef(true)

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return
    try {
      const res = await fetch("/api/notifications?unread=true", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const newCount = data.unreadCount || 0
      const newNotifs = data.notifications || []

      // Détecte les vraies nouvelles notifications par ID (pas seulement le compteur)
      const unseenNotifs = newNotifs.filter((n: any) => !seenIdsRef.current.has(n.id))
      if (unseenNotifs.length > 0 && !isFirstLoadRef.current) {
        if (soundEnabled) playBeep()
      }
      isFirstLoadRef.current = false
      newNotifs.forEach((n: any) => seenIdsRef.current.add(n.id))
      prevCountRef.current = newCount
      setUnreadCount(newCount)
    } catch {
      // ignore
    }
  }, [status, session, soundEnabled])

  // Load sound preference + re-sync periodically
  useEffect(() => {
    if (status !== "authenticated") return
    const loadPrefs = () => {
      fetch("/api/profile/notifications")
        .then(r => r.ok ? r.json() : null)
        .then(prefs => { if (prefs) setSoundEnabled(prefs.soundEnabled !== false) })
        .catch(() => {})
    }
    loadPrefs()
    const id = setInterval(loadPrefs, 30000)
    return () => clearInterval(id)
  }, [status])

  // Poll only when authenticated
  useEffect(() => {
    if (status !== "authenticated") {
      prevCountRef.current = 0
      setUnreadCount(0)
      return
    }
    refresh()
    const id = setInterval(refresh, 10000)
    return () => clearInterval(id)
  }, [status, refresh])

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  )
}
