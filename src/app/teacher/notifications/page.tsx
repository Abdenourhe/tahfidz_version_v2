"use client"
// src/app/teacher/notifications/page.tsx

import { useState, useEffect } from "react"
import { Bell, CheckCheck, BookOpen, Star, Award, Megaphone, Link2, Trash2, Loader2, Mail } from "lucide-react"
import { useRouter } from "next/navigation"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Notification {
  id: string; type: string; title: string; titleAr?: string | null
  message: string; isRead: boolean; createdAt: string
  data?: Record<string, any>
}

export default function TeacherNotificationsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("notificationsX")

  const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Bell }> = {
    progress_update: { label: L === "ar" ? "تقدم" : L === "en" ? "Progress" : "Progression", color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", icon: BookOpen },
    evaluation:      { label: L === "ar" ? "تقييم" : L === "en" ? "Evaluation" : "Évaluation", color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light", icon: Star },
    achievement:     { label: L === "ar" ? "شارة" : L === "en" ? "Badge" : "Badge", color: "text-purple-600", bg: "bg-purple-50", icon: Award },
    announcement:    { label: L === "ar" ? "إعلان" : L === "en" ? "Announcement" : "Annonce", color: "text-blue-600", bg: "bg-blue-50", icon: Megaphone },
    parent_link:     { label: L === "ar" ? "ربط ولي" : L === "en" ? "Parent link" : "Parent", color: "text-orange-600", bg: "bg-orange-50", icon: Link2 },
    reminder:        { label: L === "ar" ? "تذكير" : L === "en" ? "Reminder" : "Rappel", color: "text-gray-500", bg: "bg-gray-50", icon: Bell },
    memorization_assigned:      { label: L === "ar" ? "حفظ معين" : L === "en" ? "Assigned" : "Mémorisation assignée", color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", icon: BookOpen },
    memorization_progress_updated: { label: L === "ar" ? "تحديث تقدم" : L === "en" ? "Progress update" : "Progression mise à jour", color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light", icon: Star },
    attendance_absent_reported:  { label: L === "ar" ? "غياب مسجل" : L === "en" ? "Absence reported" : "Absence signalée", color: "text-red-500", bg: "bg-red-50", icon: Bell },
    attendance_validated:        { label: L === "ar" ? "حضور محقق" : L === "en" ? "Attendance validated" : "Présence validée", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
    direct_message:              { label: L === "ar" ? "رسالة" : L === "en" ? "Message" : "Message", color: "text-blue-600", bg: "bg-blue-50", icon: Mail },
  }

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount,   setUnreadCount]   = useState(0)
  const [loading,       setLoading]       = useState(true)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [deletingAll,   setDeletingAll]   = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications")
      const d   = await res.json()
      setNotifications(d.notifications || [])
      setUnreadCount(d.unreadCount || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    setUnreadCount(0)
  }

  const deleteOne = async (id: string) => {
    setDeleting(id)
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" })
      setNotifications(prev => {
        const removed = prev.find(n => n.id === id)
        if (removed && !removed.isRead) setUnreadCount(c => Math.max(0, c - 1))
        return prev.filter(n => n.id !== id)
      })
    } finally {
      setDeleting(null)
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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-tahfidz-green mt-1 font-medium">
              {unreadCount} {t("unread")}{unreadCount > 1 ? (L === "fr" ? "s" : L === "en" ? "s" : "") : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAll}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 dark:border-gray-700">
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-tahfidz-green border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noNotif")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const tc = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.reminder
            return (
              <div key={notif.id}
                className={`relative rounded-2xl border p-4 flex gap-4 group transition cursor-pointer ${!notif.isRead ? "border-tahfidz-green/40 bg-tahfidz-green-light/20 dark:bg-emerald-900/20 dark:border-emerald-500/40 shadow-sm" : "border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-md"}`}
                onClick={() => {
                  if (!notif.isRead) markRead(notif.id)
                  if (notif.data?.url) router.push(notif.data.url)
                }}>
                {!notif.isRead && <div className="absolute left-0 top-4 bottom-4 w-1 rounded-r-full bg-tahfidz-green dark:bg-emerald-400" />}
                <div className={`w-11 h-11 rounded-xl ${tc.bg} dark:bg-gray-700 flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <tc.icon size={20} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{tc.label}</span>
                      <p className={`text-sm font-bold leading-snug ${!notif.isRead ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-200"}`}>{notif.title}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteOne(notif.id) }} disabled={deleting === notif.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                      title={t("delete")}>
                      {deleting === notif.id ? <Loader2 size={13} className="animate-spin text-gray-400" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                  {notif.titleAr && <p className="arabic text-xs text-gray-400 dark:text-gray-500 mt-0.5">{notif.titleAr}</p>}
                  <p className={`text-sm mt-1.5 whitespace-pre-line leading-relaxed ${!notif.isRead ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-600 dark:text-gray-300"}`}>{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {new Date(notif.createdAt).toLocaleDateString(L === "ar" ? "ar-DZ" : L === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
