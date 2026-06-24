// src/app/teacher/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import Link from "next/link"
import HalaqaCalendarView from "@/components/halaqa/HalaqaCalendarView"
import { motion } from "framer-motion"
import {
  Video, Plus, Calendar, Users, BookOpen,
  Play, FileVideo, BarChart3, X, LayoutList, CalendarDays, Copy
} from "lucide-react"

interface HalaqaSession {
  id: string
  meetingName: string
  status: string
  type: string
  mode: string
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  recordingUrl?: string
  duration?: number | null
  teacher?: { fullName?: string | null } | null
  group?: { id?: string; name: string }
  studentIds: string[]
}

interface QuotaStatus {
  plan: string
  monthlyLimit: number | null
  bonusCredits: number
  plannedCount: number
  sessionsUsed: number
  totalAllowed: number
  totalConsumed: number
  remaining: number
  isUnlimited: boolean
}

export default function TeacherHalaqaPage() {
  const router = useRouter()
  const { locale } = useLanguage()
  const t = useT("halaqa")
  const isRTL = locale === "ar"
  const [sessions, setSessions] = useState<HalaqaSession[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "scheduled" | "live" | "ended">("all")
  const [filterGroup, setFilterGroup] = useState<string>("ALL")
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [view, setView] = useState<"list" | "calendar">("list")
  const [quota, setQuota] = useState<QuotaStatus | null>(null)

  useEffect(() => {
    fetchSessions()
    fetchQuota()
    fetchGroups()
  }, [])

  const fetchQuota = async () => {
    try {
      const res = await fetch("/api/halaqa/quota")
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      setQuota(data.status || null)
    } catch {
      setQuota(null)
    }
  }

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

  const filtered = sessions.filter((s) => {
    const statusMatch = filter === "all" || s.status.toLowerCase() === filter
    const groupMatch = filterGroup === "ALL" || s.group?.id === filterGroup
    return statusMatch && groupMatch
  })

  const fetchGroups = async () => {
    try {
      const res = await fetch("/api/groups")
      if (res.ok) {
        const data = await res.json()
        setGroups((data.groups || []).map((g: any) => ({ id: g.id, name: g.name })))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const cancelSession = async (sessionId: string) => {
    if (!confirm(t("confirmCancel"))) return
    setCancellingId(sessionId)
    try {
      const res = await fetch("/api/halaqa/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error("Erreur")
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, status: "CANCELLED" } : s))
      )
    } catch {
      alert(t("errorCancel"))
    } finally {
      setCancellingId(null)
    }
  }

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
        {/* Quota banner */}
        {quota && (
          <div className={`mb-6 rounded-xl p-4 border ${
            quota.isUnlimited || quota.remaining > 0
              ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20"
              : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {quota.isUnlimited
                    ? "Halaqa Online illimitées"
                    : `${quota.totalConsumed} / ${quota.totalAllowed} Halaqa utilisées ce mois`}
                </p>
                {!quota.isUnlimited && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {quota.plannedCount} planifiée{quota.plannedCount > 1 ? "s" : ""} · {quota.sessionsUsed} effectuée{quota.sessionsUsed > 1 ? "s" : ""} · {quota.bonusCredits > 0 ? `+${quota.bonusCredits} bonus` : ""}
                  </p>
                )}
              </div>
              {!quota.isUnlimited && quota.remaining === 0 && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Quota atteint — Passez à un plan supérieur
                </span>
              )}
            </div>
            {!quota.isUnlimited && (
              <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    quota.remaining === 0 ? "bg-red-500" : "bg-tahfidz-green"
                  }`}
                  style={{ width: `${Math.min(100, (quota.totalConsumed / Math.max(1, quota.totalAllowed)) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video size={28} className="text-tahfidz-green" />
              {t("halaqa")}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {t("manageHalaqas")}
            </p>
          </div>
          <Link
            href={quota && !quota.isUnlimited && quota.remaining === 0 ? "#" : "/teacher/halaqa/new"}
            onClick={(e) => {
              if (quota && !quota.isUnlimited && quota.remaining === 0) {
                e.preventDefault()
                alert("Quota de Halaqa atteint. Passez à un plan supérieur.")
              }
            }}
            className={`inline-flex items-center gap-2 px-5 py-2.5 font-semibold rounded-xl transition shadow-lg shadow-tahfidz-green/20 ${
              quota && !quota.isUnlimited && quota.remaining === 0
                ? "bg-gray-400 cursor-not-allowed text-white"
                : "bg-tahfidz-green hover:bg-emerald-700 text-white"
            }`}
          >
            <Plus size={18} />
            {t("newSession")}
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: t("scheduledSessions"), value: upcoming.length, icon: Calendar, color: "text-blue-600" },
            { label: t("liveNow"), value: live.length, icon: Play, color: "text-red-600" },
            { label: t("endedSessions"), value: past.length, icon: FileVideo, color: "text-gray-600" },
            { label: t("thisWeek"), value: sessions.filter((s) => {
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

        {/* Filtres + toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
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
                {f === "all" ? t("all") : f === "scheduled" ? t("planned") : f === "live" ? t("liveNow") : t("endedSessions")}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            >
              <option value="ALL">{t("allGroups") || "Tous les groupes"}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <div className="inline-flex items-center p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
              <button
                type="button"
                onClick={() => setView("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  view === "list"
                    ? "bg-tahfidz-green text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <LayoutList size={14} />
                {t("list") || "Liste"}
              </button>
              <button
                type="button"
                onClick={() => setView("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                  view === "calendar"
                    ? "bg-tahfidz-green text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <CalendarDays size={14} />
                {t("calendar") || "Calendrier"}
              </button>
            </div>
          </div>
        </div>

        {/* Contenu */}
        {view === "calendar" ? (
          <HalaqaCalendarView
            sessions={filtered}
            locale={locale}
            isRTL={isRTL}
            onSessionClick={(session) => router.push(`/teacher/halaqa/${session.id}`)}
          />
        ) : loading ? (
          <div className="text-center py-20 text-gray-400">{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Video size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">{t("noSessionFound")}</p>
            <Link
              href="/teacher/halaqa/new"
              className="inline-flex items-center gap-2 mt-4 text-tahfidz-green hover:text-emerald-700 font-medium"
            >
              <Plus size={16} />
              {t("createFirstHalaqa")}
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
                        {session.type === "INDIVIDUAL" ? t("individual") : t("collective")}
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
                        {session.studentIds.length} {session.studentIds.length > 1 ? t("studentCountPlural") : t("studentCount")}
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
                          href={`/teacher/halaqa/${session.id}/edit`}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition"
                        >
                          {t("edit") || "Modifier"}
                        </Link>
                        <Link
                          href={`/teacher/halaqa/new?duplicate=${session.id}`}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition"
                        >
                          <Copy size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("duplicate") || "Dupliquer"}
                        </Link>
                        <Link
                          href={`/teacher/halaqa/${session.id}`}
                          className="px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
                        >
                          <Play size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("start")}
                        </Link>
                        <button
                          onClick={() => cancelSession(session.id)}
                          disabled={cancellingId === session.id}
                          className="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition disabled:opacity-60"
                        >
                          {cancellingId === session.id ? (
                            <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          )}
                          {t("cancel")}
                        </button>
                      </>
                    )}
                    {session.status === "LIVE" && (
                      <Link
                        href={`/teacher/halaqa/${session.id}`}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition animate-pulse"
                      >
                        <Video size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                        {t("join")}
                      </Link>
                    )}
                    {session.status === "ENDED" && (
                      <>
                        <Link
                          href={`/teacher/halaqa/new?duplicate=${session.id}`}
                          className="px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm font-medium rounded-lg transition"
                        >
                          <Copy size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("duplicate") || "Dupliquer"}
                        </Link>
                        {session.recordingUrl && (
                          <a
                            href={session.recordingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition"
                          >
                            <FileVideo size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                            {t("replay")}
                          </a>
                        )}
                        <Link
                          href={`/teacher/halaqa/${session.id}/evaluation`}
                          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/20 hover:bg-purple-200 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm font-medium rounded-lg transition"
                        >
                          <BarChart3 size={16} className={`inline ${isRTL ? "ml-1" : "mr-1"}`} />
                          {t("rate")}
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
