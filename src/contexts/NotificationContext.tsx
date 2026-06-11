"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { X, Bell } from "lucide-react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Toast {
  id: string
  title: string
  message: string
  url?: string
}

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
  const [toasts, setToasts] = useState<Toast[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const prevCountRef = useRef(0)
  const seenIdsRef = useRef<Set<string>>(new Set())
  const router = useRouter()

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return
    try {
      const res = await fetch("/api/notifications?unread=true", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const newCount = data.unreadCount || 0
      const newNotifs = data.notifications || []
      // eslint-disable-next-line no-console
      console.log("[toast debug] count:", newCount, "notifs:", newNotifs.length, "seen:", seenIdsRef.current.size)

      // Détecte les vraies nouvelles notifications par ID (pas seulement le compteur)
      const unseenNotifs = newNotifs.filter((n: any) => !seenIdsRef.current.has(n.id))
      // eslint-disable-next-line no-console
      console.log("[toast debug] unseen:", unseenNotifs.length)
      if (unseenNotifs.length > 0 && seenIdsRef.current.size > 0) {
        const latest = unseenNotifs[0]
        // eslint-disable-next-line no-console
        console.log("[toast debug] showing toast:", latest.title)
        setToasts(prev => [...prev, {
          id: latest.id,
          title: latest.title,
          message: latest.message,
          url: latest.data?.url,
        }])
        if (soundEnabled) playBeep()
      }
      newNotifs.forEach((n: any) => seenIdsRef.current.add(n.id))
      prevCountRef.current = newCount
      setUnreadCount(newCount)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[toast debug] refresh error:", err)
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

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}

      {/* Toast stack */}
      <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border-2 border-red-500 dark:border-red-400 p-3.5 flex items-start gap-3 cursor-pointer hover:shadow-2xl transition"
            onClick={() => {
              removeToast(t.id)
              if (t.url) router.push(t.url)
            }}
          >
            <div className="w-9 h-9 rounded-full bg-tahfidz-green-light flex items-center justify-center shrink-0">
              <Bell size={16} className="text-tahfidz-green" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t.title}</p>
              <p className="text-xs text-gray-500 truncate">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeToast(t.id); }}
              className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0 transition"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  )
}
