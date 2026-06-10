"use client"
// src/app/parent/notifications/page.tsx — with delete + click to navigate

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { Bell, CheckCheck, BookOpen, Star, Award, Trash2, Loader2, Mail } from "lucide-react"

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; createdAt: string;
  data: Record<string, any>
}

const typeIcon: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  progress_update: { icon: BookOpen, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light" },
  evaluation:      { icon: Star,     color: "text-tahfidz-gold",  bg: "bg-tahfidz-gold-light" },
  achievement:     { icon: Award,    color: "text-purple-600",    bg: "bg-purple-50" },
  attendance:      { icon: Bell,     color: "text-blue-600",      bg: "bg-blue-50" },
  announcement:    { icon: Bell,     color: "text-orange-500",    bg: "bg-orange-50" },
  memorization_assigned:      { icon: BookOpen, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light" },
  memorization_progress_updated: { icon: Star,    color: "text-tahfidz-gold",  bg: "bg-tahfidz-gold-light" },
  attendance_absent_reported:  { icon: Bell,     color: "text-red-500",       bg: "bg-red-50" },
  attendance_validated:        { icon: CheckCheck, color: "text-green-600",   bg: "bg-green-50" },
  direct_message:              { icon: Mail,     color: "text-blue-600",      bg: "bg-blue-50" },
}

export default function ParentNotificationsPage() {
  const router = useRouter()
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

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

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

  const handleClick = (notif: Notification) => {
    if (!notif.isRead) markRead(notif.id)
    if (notif.data?.url) router.push(notif.data.url)
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-tahfidz-green border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-tahfidz-green mt-1 font-medium">{unreadCount} non lue{unreadCount > 1 ? "s" : ""}</p>}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
              <CheckCheck size={14} /> Tout lire
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={deleteAll} disabled={deletingAll}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 transition px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50">
              {deletingAll ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Tout supprimer
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Bell size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Aucune notification</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const tc = typeIcon[notif.type] ?? { icon: Bell, color: "text-gray-500", bg: "bg-gray-50" }
            return (
              <div key={notif.id}
                onClick={() => handleClick(notif)}
                className={`bg-white rounded-xl border p-4 flex gap-4 group transition cursor-pointer ${!notif.isRead ? "border-tahfidz-green/30 bg-tahfidz-green-light/20" : "border-gray-100 hover:border-gray-200"}`}>
                <div className={`w-10 h-10 rounded-xl ${tc.bg} flex items-center justify-center flex-shrink-0`}>
                  <tc.icon size={18} className={tc.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-semibold ${!notif.isRead ? "text-gray-900" : "text-gray-700"}`}>{notif.title}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && <div className="w-2 h-2 rounded-full bg-tahfidz-green" />}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteOne(notif.id) }}
                        disabled={deletingId === notif.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                        title="Supprimer cette notification"
                      >
                        {deletingId === notif.id
                          ? <Loader2 size={13} className="animate-spin text-gray-400" />
                          : <Trash2 size={13} />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {formatDate(notif.createdAt, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
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
