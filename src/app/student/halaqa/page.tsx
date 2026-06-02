// src/app/student/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Video, Calendar, Clock, Play, FileVideo, Loader2,
  User, Mic, Monitor, BarChart3, CheckCircle2, XCircle,
  Radio, Eye
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface HalaqaSession {
  id: string
  meetingName: string
  status: string
  mode: string
  scheduledAt: string
  recordingUrl?: string
  teacher?: { fullName: string } | null
  group?: { name: string } | null
  evaluations?: { id: string; studentId: string; memorizationScore?: number | null; tajweedScore?: number | null; fluencyScore?: number | null }[]
}

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: any }> = {
    SCHEDULED: { cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", label: "Planifiée", icon: Calendar },
    LIVE: { cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse", label: "En direct", icon: Radio },
    ENDED: { cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400", label: "Terminée", icon: CheckCircle2 },
    CANCELLED: { cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", label: "Annulée", icon: XCircle },
  }
  const cfg = map[status] || map.ENDED
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${cfg.cls}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  )
}

function ModeIcon({ mode }: { mode: string }) {
  if (mode === "VIDEO") return <Monitor size={14} className="text-gray-400" />
  if (mode === "SCREEN_SHARE") return <Monitor size={14} className="text-gray-400" />
  return <Mic size={14} className="text-gray-400" />
}

function ModeLabel({ mode }: { mode: string }) {
  const map: Record<string, string> = {
    AUDIO_ONLY: "Audio",
    VIDEO: "Vidéo",
    SCREEN_SHARE: "Écran",
  }
  return <span className="text-xs text-gray-400">{map[mode] || mode}</span>
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

  const formatDateTime = (d: string) => {
    const date = new Date(d)
    return {
      date: date.toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "short", year: "numeric" }),
      time: date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Video size={28} className="text-tahfidz-green" />
          {t("myHalaqasStudent")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t("manageHalaqas")}
        </p>
      </div>

      {/* Upcoming */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Calendar size={18} className="text-tahfidz-green" />
            {t("upcomingSessions")}
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {upcoming.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 size={28} className="animate-spin text-tahfidz-green mx-auto" />
          </div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-10">
            <Video size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400">{t("noSessionScheduled")}</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {upcoming.map((s) => {
              const dt = formatDateTime(s.scheduledAt)
              return (
                <motion.div
                  key={s.id}
                  variants={item}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-tahfidz-green/30 hover:shadow-sm transition bg-gray-50/50 dark:bg-gray-800/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{s.meetingName}</h3>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {dt.date}</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> {dt.time}</span>
                      <span className="flex items-center gap-1"><User size={14} /> {s.teacher?.fullName || "—"}</span>
                      {s.group?.name && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">{s.group.name}</span>
                      )}
                      <span className="flex items-center gap-1"><ModeIcon mode={s.mode} /> <ModeLabel mode={s.mode} /></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/student/halaqa/${s.id}`}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <Eye size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                      {t("view")}
                    </Link>
                    <Link
                      href={`/student/halaqa/${s.id}`}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition inline-flex items-center gap-1 ${
                        s.status === "LIVE"
                          ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                          : "bg-tahfidz-green hover:bg-emerald-700 text-white"
                      }`}
                    >
                      <Play size={14} />
                      {s.status === "LIVE" ? t("join") : t("enter")}
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>

      {/* Past */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FileVideo size={18} className="text-tahfidz-green" />
            {t("pastSessions")}
          </h2>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
            {past.length}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-10">
            <Loader2 size={28} className="animate-spin text-tahfidz-green mx-auto" />
          </div>
        ) : past.length === 0 ? (
          <div className="text-center py-10">
            <FileVideo size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <p className="text-sm text-gray-400">{t("noPastSession")}</p>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
            {past.map((s) => {
              const dt = formatDateTime(s.scheduledAt)
              const myEval = s.evaluations?.[0]
              const hasEval = !!myEval && myEval.memorizationScore != null
              return (
                <motion.div
                  key={s.id}
                  variants={item}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition bg-gray-50/30 dark:bg-gray-800/20"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">{s.meetingName}</h3>
                      {hasEval ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                          <CheckCircle2 size={12} />
                          Évalué
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          <XCircle size={12} />
                          Non évalué
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar size={14} /> {dt.date}</span>
                      <span className="flex items-center gap-1"><User size={14} /> {s.teacher?.fullName || "—"}</span>
                      {hasEval && (
                        <span className="flex items-center gap-1 text-tahfidz-green font-medium">
                          <BarChart3 size={14} />
                          {myEval!.memorizationScore}/100
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/student/halaqa/${s.id}`}
                      className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                      <Eye size={14} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                      {t("view")}
                    </Link>
                    {s.recordingUrl ? (
                      <a
                        href={s.recordingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition inline-flex items-center gap-1"
                      >
                        <FileVideo size={14} />
                        {t("replay")}
                      </a>
                    ) : (
                      <span className="px-3 py-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg">{t("noRecording")}</span>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </div>
    </div>
  )
}
