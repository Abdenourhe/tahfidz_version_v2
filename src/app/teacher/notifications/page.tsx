"use client"
// src/app/teacher/notifications/page.tsx

import { useState, useEffect } from "react"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck, BookOpen, Star, Award, Megaphone, Link2, Trash2, Loader2 } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Notification {
  id: string; type: string; title: string; titleAr?: string | null
  message: string; isRead: boolean; createdAt: string
}

export default function TeacherNotificationsPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("notifications")

  const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Bell }> = {
    progress_update: { label: L === "ar" ? "تقدم" : L === "en" ? "Progress" : "Progression", color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", icon: BookOpen },
    evaluation:      { label: L === "ar" ? "تقييم" : L === "en" ? "Evaluation" : "Évaluation", color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light", icon: Star },
    achievement:     { label: L === "ar" ? "شارة" : L === "en" ? "Badge" : "Badge", color: "text-purple-600", bg: "bg-purple-50", icon: Award },
    announcement:    { label: L === "ar" ? "إعلان" : L === "en" ? "Announcement" : "Annonce", color: "text-blue-600", bg: "bg-blue-50", icon: Megaphone },
    parent_link:     { label: L === "ar" ? "ربط ولي" : L === "en" ? "Parent link" : "Parent", color: "text-orange-600", bg: "bg-orange-50", icon: Link2 },
    reminder:        { label: L === "ar" ? "تذكير" : L === "en" ? "Reminder" : "Rappel", color: "text-gray-500", bg: "bg-gray-50", icon: Bell },
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
                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 flex gap-4 group transition hover:shadow-sm ${
                  !notif.isRead ? "border-tahfidz-green/30 bg-tahfidz-green-light/20" : "border-gray-100 dark:border-gray-800"
                }`}>
                <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0 cursor-pointer`}
                  onClick={() => !notif.isRead && markRead(notif.id)}>
                  <tc.icon size={18} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => !notif.isRead && markRead(notif.id)}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}>
            
                      {notif.title}
                    </p>
                    {notif.titleAr && <p className="arabic text-xs text-gray-400 mt-0.5">{notif.titleAr}</p>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
