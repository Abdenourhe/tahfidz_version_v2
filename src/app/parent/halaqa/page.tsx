// src/app/parent/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { FileVideo, Calendar, Loader2, User, BarChart3, Video, Play, Eye } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Recording {
  id: string
  meetingName: string
  scheduledAt: string
  recordingUrl?: string
  teacher?: { fullName: string } | null
  evaluations: { memorizationScore?: number | null }[]
}

interface LiveSession {
  id: string
  meetingName: string
  scheduledAt: string
  mode: string
  teacher?: { fullName: string } | null
}

export default function ParentHalaqaPage() {
  const { locale } = useLanguage()
  const t = useT("halaqa")
  const isRTL = locale === "ar"
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
  const [loading, setLoading] = useState(true)
  const [joiningId, setJoiningId] = useState<string | null>(null)

  useEffect(() => {
    fetchRecordings()
    fetchLiveSessions()
  }, [])

  const fetchRecordings = async () => {
    try {
      const res = await fetch("/api/halaqa/recordings")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setRecordings(data.recordings || [])
    } catch {
      setRecordings([])
    } finally {
      setLoading(false)
    }
  }

  const fetchLiveSessions = async () => {
    try {
      const res = await fetch("/api/halaqa/sessions?status=LIVE")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setLiveSessions(data.sessions || [])
    } catch {
      setLiveSessions([])
    }
  }

  const observeSession = async (sessionId: string) => {
    setJoiningId(sessionId)
    try {
      const res = await fetch("/api/halaqa/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      if (data.joinUrl) {
        window.open(`/halaqa/room?joinUrl=${encodeURIComponent(data.joinUrl)}&name=${encodeURIComponent("Parent")}`, "_blank")
      }
    } catch (err: any) {
      alert(err.message || t("errorCancel"))
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
          <Video size={28} className="text-tahfidz-green" />
          {t("halaqa")}
        </h1>

        {/* Séances en direct */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Play size={20} className="text-red-500" />
            {t("liveNow")}
          </h2>
          {liveSessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
              {t("noLiveSession")}
            </div>
          ) : (
            <div className="space-y-3">
              {liveSessions.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-red-100 dark:border-red-900/20 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        {s.meetingName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(s.scheduledAt).toLocaleString()}</span>
                        <span className="flex items-center gap-1"><User size={14} /> {s.teacher?.fullName || "—"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => observeSession(s.id)}
                      disabled={joiningId === s.id}
                      className="px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60 inline-flex items-center gap-2"
                    >
                      {joiningId === s.id ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Eye size={16} />
                      )}
                      {t("observe")}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>

        {/* Enregistrements */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <FileVideo size={20} className="text-tahfidz-green" />
            {t("recordingsTitle")}
          </h2>

          {loading ? (
            <div className="text-center py-20">
              <Loader2 size={32} className="animate-spin text-tahfidz-green mx-auto" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <FileVideo size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t("noRecordingAvailable")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{r.meetingName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(r.scheduledAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><User size={14} /> {r.teacher?.fullName || "—"}</span>
                        {r.evaluations.length > 0 && r.evaluations[0]?.memorizationScore !== null && (
                          <span className="flex items-center gap-1 text-tahfidz-green">
                            <BarChart3 size={14} />
                            {t("grade")}: {r.evaluations[0].memorizationScore}/100
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {r.recordingUrl ? (
                        <a
                          href={r.recordingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          <FileVideo size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("watch")}
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">{t("processing")}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
