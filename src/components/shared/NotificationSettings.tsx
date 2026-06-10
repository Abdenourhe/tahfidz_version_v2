"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Volume2, MessageSquare, ClipboardCheck, CalendarCheck, Loader2 } from "lucide-react"

interface Prefs {
  messageNotifications: boolean
  evaluationNotifications: boolean
  attendanceNotifications: boolean
  soundEnabled: boolean
}

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/profile/notifications")
      .then(r => r.json())
      .then(data => {
        setPrefs(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const toggle = async (key: keyof Prefs) => {
    if (!prefs || saving) return
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    setSaving(true)
    try {
      await fetch("/api/profile/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: next[key] }),
      })
    } catch {
      setPrefs(prefs) // rollback
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
        <Loader2 size={14} className="animate-spin" /> Chargement...
      </div>
    )
  }

  if (!prefs) return null

  const items = [
    { key: "messageNotifications" as const, icon: MessageSquare, label: "Messages", desc: "Nouveaux messages des enseignants" },
    { key: "evaluationNotifications" as const, icon: ClipboardCheck, label: "Évaluations", desc: "Nouvelles évaluations de vos enfants" },
    { key: "attendanceNotifications" as const, icon: CalendarCheck, label: "Présences", desc: "Alertes de présence et d'absence" },
    { key: "soundEnabled" as const, icon: Volume2, label: "Son", desc: "Jouer un son à la réception d'une notification" },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm"
    >
      <div className="flex items-center gap-2 mb-4">
        <Bell size={18} className="text-tahfidz-green" />
        <h2 className="text-base font-bold text-gray-800 dark:text-gray-100">Notifications</h2>
      </div>
      <div className="space-y-3">
        {items.map(item => (
          <div key={item.key} className="flex items-center justify-between gap-3 py-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                <item.icon size={16} className="text-gray-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{item.label}</p>
                <p className="text-[11px] text-gray-400">{item.desc}</p>
              </div>
            </div>
            <button
              onClick={() => toggle(item.key)}
              disabled={saving}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs[item.key] ? "bg-tahfidz-green" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  prefs[item.key] ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
