"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
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
  const router = useRouter()

  const refresh = useCallback(async () => {
    if (status !== "authenticated" || !session?.user?.id) return
    try {
      const res = await fetch("/api/notifications?unread=true", { cache: "no-store" })
      if (!res.ok) return
      const data = await res.json()
      const newCount = data.unreadCount || 0
      const newNotifs = data.notifications || []

      if (newCount > prevCountRef.current && prevCountRef.current > 0) {
        const latest = newNotifs[0]
        if (latest) {
          setToasts(prev => [...prev, {
            id: latest.id,
            title: latest.title,
            message: latest.message,
            url: latest.data?.url,
          }])
          if (soundEnabled) playBeep()
        }
      }
      prevCountRef.current = newCount
      setUnreadCount(newCount)
    } catch { /* ignore */ }
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
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              className="pointer-events-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3.5 flex items-start gap-3 hover:shadow-2xl transition overflow-hidden"
            >
              <div
                className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  removeToast(t.id)
                  if (t.url) router.push(t.url)
                }}
              >
                <div className="w-9 h-9 rounded-full bg-tahfidz-green-light flex items-center justify-center shrink-0">
                  <Bell size={16} className="text-tahfidz-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{t.title}</p>
                  <p className="text-xs text-gray-500 truncate">{t.message}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); removeToast(t.id); }}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shrink-0 transition"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
