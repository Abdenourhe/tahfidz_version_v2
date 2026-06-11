"use client"
// src/app/student/notifications/page.tsx — with delete

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck, Star, Award, Megaphone, BookOpen, Trash2, Loader2, Mail, XCircle } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { useRouter } from "next/navigation"

interface Notification {
  id: string; type: string; title: string; titleAr?: string | null
  message: string; isRead: boolean; createdAt: string
  data?: Record<string, any>
}

export default function StudentNotificationsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("notificationsXX")

  const typeIcon: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    progress_update: { icon: BookOpen,  color: "text-tahfidz-green",  bg: "bg-tahfidz-green-light" },
    evaluation:      { icon: Star,      color: "text-tahfidz-gold",   bg: "bg-tahfidz-gold-light" },
    achievement:     { icon: Award,     color: "text-purple-600",     bg: "bg-purple-50" },
    announcement:    { icon: Megaphone, color: "text-blue-600",       bg: "bg-blue-50" },
    exam:            { icon: BookOpen,  color: "text-orange-500",       bg: "bg-orange-50" },
    attendance:      { icon: Bell,      color: "text-blue-500",         bg: "bg-blue-50" },
    memorization_assigned:      { icon: BookOpen, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light" },
    memorization_progress_updated: { icon: Star,    color: "text-tahfidz-gold",  bg: "bg-tahfidz-gold-light" },
    attendance_absent_reported:  { icon: Bell,     color: "text-red-500",       bg: "bg-red-50" },
    attendance_validated:        { icon: CheckCheck, color: "text-green-600",   bg: "bg-green-50" },
    attendance_rejected:         { icon: XCircle,    color: "text-red-600",     bg: "bg-red-100" },
    direct_message:              { icon: Mail,       color: "text-blue-600",      bg: "bg-blue-50" },
  }

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [deletingId,    setDeletingId]    = useState<string | null>(null)
  const [deletingAll,   setDeletingAll]   = useState(false)

  const load = () => {
    fetch("/api/notifications")
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    load()
  }

  const deleteOne = async (id: string) => {
    setDeletingId(id)
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      setNotifications(prev => prev.filter(n => n.id !== id))
      setUnreadCount(prev => {
        const notif = notifications.find(n => n.id === id)
        return notif && !notif.isRead ? Math.max(0, prev - 1) : prev
      })
    } finally {
      setDeletingId(null)
    }
  }

  const deleteAll = async () => {
    setDeletingAll(true)
    try {
      await fetch("/api/notifications?deleteAll=true", { method: "DELETE" })
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setDeletingAll(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-tahfidz-green border-t-transparent rounded-full" /></div>
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {unreadCount > 0 && <p className="text-sm text-tahfidz-green font-medium">{unreadCount} {t("unread")}{unreadCount > 1 ? (L === "fr" ? "s" : L === "en" ? "s" : "") : ""}</p>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
              <CheckCheck size={14} /> {t("markAllRead")}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} disabled={deletingAll}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
              {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              {t("deleteAll")}
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <motion.div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}>
          <Bell size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noNotif")}</p>
        </motion.div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif, i) => {
            const tc = typeIcon[notif.type.toLowerCase()] ?? { icon: Bell, color: "text-gray-500", bg: "bg-gray-50" }
            return (
              <motion.div key={notif.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className={`relative rounded-2xl border p-4 flex gap-4 group transition cursor-pointer ${!notif.isRead ? "border-tahfidz-green/40 bg-tahfidz-green-light/20 dark:bg-emerald-900/20 dark:border-emerald-500/40 shadow-sm" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md"}`}
                onClick={() => {
                  if (!notif.isRead) {
                    fetch("/api/notifications", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ids: [notif.id] }),
                    }).then(() => load())
                  }
                  if (notif.data?.url) router.push(notif.data.url)
                }}>
                {!notif.isRead && <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-tahfidz-green dark:bg-emerald-400" />}
                <div className={`w-11 h-11 rounded-xl ${tc.bg} dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <tc.icon size={20} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-snug ${!notif.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{notif.title}</p>
                      {notif.titleAr && <p className="arabic text-xs text-gray-400 dark:text-gray-500 mt-0.5">{notif.titleAr}</p>}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteOne(notif.id) }} disabled={deletingId === notif.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                      title={t("delete")}>
                      {deletingId === notif.id ? <Loader2 size={13} className="animate-spin text-gray-400" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                  <p className={`text-sm mt-1.5 whitespace-pre-line leading-relaxed ${!notif.isRead ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-600 dark:text-gray-300"}`}>{notif.message}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {notif.type.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {formatDate(notif.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
