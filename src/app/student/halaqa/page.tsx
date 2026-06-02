// src/app/student/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Video, Calendar, Clock, Play, FileVideo, Loader2 } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface HalaqaSession {
  id: string
  meetingName: string
  status: string
  mode: string
  scheduledAt: string
  recordingUrl?: string
  teacher?: { fullName: string } | null
}

export default function StudentHalaqaPage() {
  const { locale } = useLanguage()
  const t = useT("halaqa")
  const isRTL = locale === "ar"
  const [sessions, setSessions] = useState<HalaqaSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/halaqa/sessions")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const upcoming = sessions.filter((s) => s.status === "SCHEDULED" || s.status === "LIVE")
  const past = sessions.filter((s) => s.status === "ENDED")

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Video size={28} className="text-tahfidz-green" />
          {t("myHalaqasStudent")}
        </h1>

        {/* Upcoming */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {t("upcomingSessions")}
        </h2>
        {loading ? (
          <div className="text-center py-10"><Loader2 size={24} className="animate-spin text-tahfidz-green mx-auto" /></div>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">{t("noSessionScheduled")}</p>
        ) : (
          <div className="space-y-3 mb-8">
            {upcoming.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{s.meetingName}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(s.scheduledAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {new Date(s.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span>{s.teacher?.fullName || "—"}</span>
                    </div>
                  </div>
                  <Link
                    href={`/student/halaqa/${s.id}`}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      s.status === "LIVE"
                        ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                        : "bg-tahfidz-green hover:bg-emerald-700 text-white"
                    }`}
                  >
                    <Play size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                    {s.status === "LIVE" ? t("join") : t("enter")}
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Past */}
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {t("pastSessions")}
        </h2>
        {past.length === 0 ? (
          <p className="text-gray-400 text-sm py-4">{t("noPastSession")}</p>
        ) : (
          <div className="space-y-3">
            {past.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 opacity-70"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{s.meetingName}</h3>
                    <p className="text-sm text-gray-500">{s.teacher?.fullName || "—"}</p>
                  </div>
                  {s.recordingUrl ? (
                    <a
                      href={s.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
                    >
                      <FileVideo size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                      {t("replay")}
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">{t("noRecording")}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
