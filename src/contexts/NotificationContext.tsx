"use client"

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Bell, MessageCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  data: Record<string, any>
  isRead: boolean
  createdAt: string
}

interface NotificationPrefs {
  messageNotifications: boolean
  evaluationNotifications: boolean
  attendanceNotifications: boolean
  soundEnabled: boolean
}

interface NotificationContextType {
  unreadCount: number
  notifications: Notification[]
  prefs: NotificationPrefs | null
  refresh: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  notifications: [],
  prefs: null,
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null)
  const [toasts, setToasts] = useState<{ id: string; title: string; message: string; url?: string }[]>([])
  const prevCountRef = useRef(0)
  const router = useRouter()

  const fetchPrefs = useCallback(async () => {
    try {
      const res = await fetch("/api/profile/notifications")
      if (res.ok) setPrefs(await res.json())
    } catch { /* ignore */ }
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [notifRes, prefsRes] = await Promise.all([
        fetch("/api/notifications?unread=true"),
        prefs ? Promise.resolve(null) : fetch("/api/profile/notifications"),
      ])
      if (notifRes.ok) {
        const data = await notifRes.json()
        const newCount = data.unreadCount || 0
        const newNotifs: Notification[] = data.notifications || []

        // Detect new notifications
        if (newCount > prevCountRef.current && prevCountRef.current > 0) {
          const latest = newNotifs[0]
          if (latest) {
            const shouldShow =
              (latest.type === "direct_message" && prefs?.messageNotifications !== false) ||
              (latest.type === "evaluation" && prefs?.evaluationNotifications !== false) ||
              (latest.type === "attendance" && prefs?.attendanceNotifications !== false)

            if (shouldShow) {
              setToasts(prev => [...prev, {
                id: latest.id,
                title: latest.title,
                message: latest.message,
                url: latest.data?.url,
              }])
              if (prefs?.soundEnabled !== false) playBeep()
            }
          }
        }

        prevCountRef.current = newCount
        setUnreadCount(newCount)
        setNotifications(newNotifs)
      }
      if (prefsRes && prefsRes.ok) setPrefs(await prefsRes.json())
    } catch { /* ignore */ }
  }, [prefs])

  useEffect(() => {
    fetchPrefs()
    refresh()
    const id = setInterval(refresh, 10000)
    return () => clearInterval(id)
  }, [fetchPrefs, refresh])

  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, prefs, refresh }}>
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
              className="pointer-events-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 p-3.5 flex items-start gap-3 cursor-pointer hover:shadow-2xl transition"
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
                onClick={(e) => { e.stopPropagation(); removeToast(t.id) }}
                className="p-1 rounded hover:bg-gray-100 text-gray-400"
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
