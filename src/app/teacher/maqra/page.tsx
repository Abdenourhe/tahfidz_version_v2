// src/app/teacher/maqra/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/LanguageContext"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Video, Plus, Calendar, Clock, Users, BookOpen,
  Play, StopCircle, FileVideo, BarChart3
} from "lucide-react"

interface MaqraSession {
  id: string
  meetingName: string
  status: string
  type: string
  mode: string
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  recordingUrl?: string
  group?: { name: string }
  studentIds: string[]
}

export default function TeacherMaqraPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const [sessions, setSessions] = useState<MaqraSession[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "scheduled" | "live" | "ended">("all")

  useEffect(() => {
    fetchSessions()
  }, [])

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/maqra/sessions")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setSessions(data.sessions || [])
    } catch {
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = sessions.filter((s) => {
    if (filter === "all") return true
    return s.status.toLowerCase() === filter
  })

  const now = new Date()
  const upcoming = filtered.filter((s) => new Date(s.scheduledAt) > now && s.status === "SCHEDULED")
  const live = filtered.filter((s) => s.status === "LIVE")
  const past = filtered.filter((s) => s.status === "ENDED")

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      LIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 animate-pulse",
      ENDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video size={28} className="text-tahfidz-green" />
              Maqra&apos; Électronique
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gérez vos séances de récitation en ligne
            </p>
          </div>
          <Link
            href="/teacher/maqra/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green hover:bg-emerald-700 text-white font-semibold rounded-xl transition shadow-lg shadow-tahfidz-green/20"
          >
            <Plus size={18} />
            Nouvelle séance
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Séances planifiées", value: upcoming.length, icon: Calendar, color: "text-blue-600" },
            { label: "En direct", value: live.length, icon: Play, color: "text-red-600" },
            { label: "Terminées", value: past.length, icon: FileVideo, color: "text-gray-600" },
            { label: "Cette semaine", value: sessions.filter((s) => {
              const d = new Date(s.scheduledAt)
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
              return d >= weekAgo
            }).length, icon: BarChart3, color: "text-tahfidz-green" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gray-50 dark:bg-gray-800 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filtres */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(["all", "scheduled", "live", "ended"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === f
                  ? "bg-tahfidz-green text-white"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              {f === "all" ? "Toutes" : f === "scheduled" ? "Planifiées" : f === "live" ? "En direct" : "Terminées"}
            </button>
          ))}
        </div>

        {/* Liste */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Video size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucune séance trouvée</p>
            <Link
              href="/teacher/maqra/new"
              className="inline-flex items-center gap-2 mt-4 text-tahfidz-green hover:text-emerald-700 font-medium"
            >
              <Plus size={16} />
              Créer votre première séance
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800 hover:shadow-md transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusBadge(session.status)}`}>
                        {session.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {session.type === "INDIVIDUAL" ? "Individuel" : "Collectif"}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{session.meetingName}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {new Date(session.scheduledAt).toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                          day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={14} />
                        {session.studentIds.length} élève{session.studentIds.length > 1 ? "s" : ""}
                      </span>
                      {session.group && (
                        <span className="flex items-center gap-1">
                          <BookOpen size={14} />
                          {session.group.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {session.status === "SCHEDULED" && (
                      <>
                        <Link
                          href={`/teacher/maqra/${session.id}`}
                          className="px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          <Play size={16} className="inline mr-1" />
                          Démarrer
                        </Link>
                      </>
                    )}
                    {session.status === "LIVE" && (
                      <Link
                        href={`/teacher/maqra/${session.id}`}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition animate-pulse"
                      >
                        <Video size={16} className="inline mr-1" />
                        Rejoindre
                      </Link>
                    )}
                    {session.status === "ENDED" && (
                      <>
                        {session.recordingUrl && (
                          <a
                            href={session.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
                          >
                            <FileVideo size={16} className="inline mr-1" />
                            Replay
                          </a>
                        )}
                        <Link
                          href={`/teacher/maqra/${session.id}/evaluation`}
                          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg transition"
                        >
                          <BarChart3 size={16} className="inline mr-1" />
                          Noter
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
