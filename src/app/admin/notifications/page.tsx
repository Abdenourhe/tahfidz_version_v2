"use client"
// src/app/admin/notifications/page.tsx — with delete option

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck, BookOpen, Star, Award, Megaphone, Link2, Trash2, Loader2, XCircle, Building2 } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Notification {
  id: string
  type: string
  title: string
  titleAr?: string | null
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, any>
}

export default function AdminNotificationsPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("notificationsXXX")

  const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Bell }> = {
    progress_update: { label: L === "ar" ? "تقدم" : L === "en" ? "Progress" : "Progression", color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", icon: BookOpen },
    evaluation:      { label: L === "ar" ? "تقييم" : L === "en" ? "Evaluation" : "Évaluation", color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light", icon: Star },
    achievement:     { label: L === "ar" ? "إنجاز" : L === "en" ? "Achievement" : "Réussite", color: "text-purple-600", bg: "bg-purple-50", icon: Award },
    announcement:    { label: L === "ar" ? "إعلان" : L === "en" ? "Announcement" : "Annonce", color: "text-blue-600", bg: "bg-blue-50", icon: Megaphone },
    parent_link:     { label: L === "ar" ? "ربط ولي" : L === "en" ? "Parent link" : "Lien parent", color: "text-orange-600", bg: "bg-orange-50", icon: Link2 },
    reminder:        { label: L === "ar" ? "تذكير" : L === "en" ? "Reminder" : "Rappel", color: "text-gray-500", bg: "bg-gray-50", icon: Bell },
    memorization_assigned:      { label: L === "ar" ? "حفظ معين" : L === "en" ? "Assigned" : "Mémorisation assignée", color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", icon: BookOpen },
    memorization_progress_updated: { label: L === "ar" ? "تحديث تقدم" : L === "en" ? "Progress update" : "Progression mise à jour", color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light", icon: Star },
    attendance_absent_reported:  { label: L === "ar" ? "غياب مسجل" : L === "en" ? "Absence reported" : "Absence signalée", color: "text-red-500", bg: "bg-red-50", icon: Bell },
    attendance_validated:        { label: L === "ar" ? "حضور محقق" : L === "en" ? "Attendance validated" : "Présence validée", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
    attendance_rejected:         { label: L === "ar" ? "غياب مرفوض" : L === "en" ? "Absence rejected" : "Absence rejetée", color: "text-red-600", bg: "bg-red-100", icon: XCircle },
    school_update_requested:     { label: L === "ar" ? "تعديل مدرسة" : L === "en" ? "School update" : "Mise à jour école", color: "text-orange-500", bg: "bg-orange-50", icon: Building2 },
    school_update_approved:      { label: L === "ar" ? "تعديل مقبول" : L === "en" ? "Update approved" : "Modification approuvée", color: "text-green-600", bg: "bg-green-50", icon: CheckCheck },
    school_update_rejected:      { label: L === "ar" ? "تعديل مرفوض" : L === "en" ? "Update rejected" : "Modification rejetée", color: "text-red-600", bg: "bg-red-50", icon: XCircle },
  }

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount]     = useState(0)
  const [loading, setLoading]             = useState(true)
  const [filter, setFilter]               = useState<"all" | "unread">("all")
  const [deleting, setDeleting]           = useState<string | null>(null)
  const [deletingAll, setDeletingAll]     = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications${filter === "unread" ? "?unread=true" : ""}`)
      const d   = await res.json()
      setNotifications(d.notifications || [])
      setUnreadCount(d.unreadCount || 0)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchNotifications() }, [fetchNotifications])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    fetchNotifications()
  }

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const deleteNotif = async (id: string) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-tahfidz-green mt-1 font-medium">
              {unreadCount} {t("unread")}{unreadCount > 1 ? (L === "fr" ? "s" : L === "en" ? "s" : "") : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-tahfidz-green transition px-3 py-2 rounded-lg hover:bg-gray-50 border border-gray-200 dark:border-gray-700">
              <CheckCheck size={15} /> {t("markAllRead")}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} disabled={deletingAll}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 transition px-3 py-2 rounded-lg hover:bg-red-50 border border-red-200 disabled:opacity-50">
              {deletingAll ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {t("deleteAll")}
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2">
        {[
          { value: "all",    label: t("all") },
          { value: "unread", label: `${t("unreadFilter")}${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value as "all" | "unread")}
            className={`px-4 py-2 text-sm rounded-lg border transition ${filter === f.value ? "bg-tahfidz-green text-white border-tahfidz-green" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-tahfidz-green border-t-transparent rounded-full" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{filter === "unread" ? t("noUnread") : t("noNotif")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const tc = TYPE_CONFIG[notif.type.toLowerCase()] ?? TYPE_CONFIG.reminder
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
                    <button onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id) }} disabled={deleting === notif.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                      title={t("delete")}>
                      {deleting === notif.id ? <Loader2 size={13} className="animate-spin text-gray-400" /> : <Trash2 size={13} />}
                    </button>
                  </div>
                  {notif.titleAr && <p className="arabic text-xs text-gray-400 dark:text-gray-500 mt-0.5">{notif.titleAr}</p>}
                  <p className={`text-sm mt-1.5 whitespace-pre-line leading-relaxed ${!notif.isRead ? "text-gray-700 dark:text-gray-200 font-medium" : "text-gray-600 dark:text-gray-300"}`}>{notif.message}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {formatDate(notif.createdAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
