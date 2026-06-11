"use client"
// src/app/admin/notifications/page.tsx — with delete option

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck, BookOpen, Star, Award, Megaphone, Link2, Trash2, Loader2, XCircle } from "lucide-react"
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

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/notifications${filter === "unread" ? "?unread=true" : ""}`)
      const d   = await res.json()
      setNotifications(d.notifications || [])
      setUnreadCount(d.unreadCount || 0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNotifications() }, [filter])

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
                className={`bg-white dark:bg-gray-900 rounded-xl border p-4 flex gap-4 transition hover:shadow-sm ${!notif.isRead ? "border-tahfidz-green/30 bg-tahfidz-green-light/20" : "border-gray-100 dark:border-gray-800"}`}>
                <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0 cursor-pointer`}
                  onClick={() => {
                    if (!notif.isRead) markRead(notif.id)
                    if (notif.data?.url) router.push(notif.data.url)
                  }}>
                  <tc.icon size={18} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => {
                    if (!notif.isRead) markRead(notif.id)
                    if (notif.data?.url) router.push(notif.data.url)
                  }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.bg} ${tc.color}`}>{tc.label}</span>
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900 dark:text-gray-100" : "text-gray-600 dark:text-gray-400"}`}>{notif.title}</p>
                    {notif.titleAr && <p className="arabic text-xs text-gray-400">{notif.titleAr}</p>}
                  </div>
                  <p className="text-xs text-gray-500 mt-1 truncate">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(notif.createdAt)}</p>
                </div>
                <button onClick={() => deleteNotif(notif.id)} disabled={deleting === notif.id}
                  className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-red-50 disabled:opacity-50"
                  title={t("delete")}>
                  {deleting === notif.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
