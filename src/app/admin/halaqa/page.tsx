// src/app/admin/halaqa/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Video, Calendar, Users, Play, FileVideo, BarChart3, ArrowLeft, Eye, XCircle,
  Plus, Pencil, LayoutList, CalendarDays, Copy, PieChart
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import HalaqaCalendarView from "@/components/halaqa/HalaqaCalendarView"
import HalaqaStats from "@/components/halaqa/HalaqaStats"
import { cancelSession, deleteSession } from "./actions"

interface HalaqaSession {
  id: string
  meetingName: string
  status: string
  type: string
  scheduledAt: string
  studentIds: string[]
  duration?: number | null
  teacher?: { fullName?: string | null } | null
  group?: { name?: string | null } | null
  evaluations?: { id: string }[]
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

export default function AdminHalaqaPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<HalaqaSession[]>([])
  const [quota, setQuota] = useState<QuotaStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"list" | "calendar" | "stats">("list")
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSessions()
    fetchQuota()
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

  const handleCancel = async (id: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette séance ?")) return
    setCancellingId(id)
    try {
      const formData = new FormData()
      formData.append("id", id)
      await cancelSession(formData)
      setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, status: "CANCELLED" } : s)))
      fetchQuota()
    } catch {
      alert("Erreur lors de l'annulation")
    } finally {
      setCancellingId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette séance ?")) return
    setDeletingId(id)
    try {
      const formData = new FormData()
      formData.append("id", id)
      await deleteSession(formData)
      setSessions((prev) => prev.filter((s) => s.id !== id))
      fetchQuota()
    } catch {
      alert("Erreur lors de la suppression")
    } finally {
      setDeletingId(null)
    }
  }

  const now = new Date()
  const upcoming = sessions.filter((s) => new Date(s.scheduledAt) > now && s.status === "SCHEDULED")
  const live = sessions.filter((s) => s.status === "LIVE")
  const past = sessions.filter((s) => s.status === "ENDED")

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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Video size={28} className="text-tahfidz-green" />
              Halaqa Online
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Toutes les séances de récitation en ligne de l&apos;école
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/halaqa/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition"
            >
              <Plus size={16} />
              Planifier une séance
            </Link>
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition"
            >
              <ArrowLeft size={16} />
              Retour au tableau de bord
            </Link>
          </div>
        </div>

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
                  className={`h-full transition-all ${quota.remaining === 0 ? "bg-red-500" : "bg-tahfidz-green"}`}
                  style={{ width: `${Math.min(100, (quota.totalConsumed / Math.max(1, quota.totalAllowed)) * 100)}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Séances planifiées", value: upcoming.length, icon: Calendar, color: "text-blue-600" },
            { label: "En direct", value: live.length, icon: Play, color: "text-red-600" },
            { label: "Terminées", value: past.length, icon: FileVideo, color: "text-gray-600" },
            { label: "Total", value: sessions.length, icon: BarChart3, color: "text-tahfidz-green" },
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

        {/* Toggle vue */}
        <div className="flex items-center justify-between gap-4 mb-6">
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
              Liste
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
              Calendrier
            </button>
            <button
              type="button"
              onClick={() => setView("stats")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition ${
                view === "stats"
                  ? "bg-tahfidz-green text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <PieChart size={14} />
              Stats
            </button>
          </div>
        </div>

        {/* Contenu */}
        {loading ? (
          <div className="text-center py-20 text-gray-400">Chargement…</div>
        ) : view === "stats" ? (
          <HalaqaStats />
        ) : view === "calendar" ? (
          <HalaqaCalendarView
            sessions={sessions}
            locale="fr"
            onSessionClick={(session) => router.push(`/admin/halaqa/${session.id}`)}
          />
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium">Nom</th>
                    <th className="text-left px-4 py-3 font-medium">Enseignant</th>
                    <th className="text-left px-4 py-3 font-medium">Statut</th>
                    <th className="text-left px-4 py-3 font-medium">Type</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Participants</th>
                    <th className="text-left px-4 py-3 font-medium">Évaluations</th>
                    <th className="text-left px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {sessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.meetingName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {s.teacher?.fullName || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${statusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {s.type === "INDIVIDUAL" ? "Individuel" : "Collectif"}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {formatDate(s.scheduledAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {s.studentIds.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {(s.evaluations?.length ?? 0) > 0 ? (
                          <span className="text-tahfidz-green font-medium">{s.evaluations?.length} éval.</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/admin/halaqa/${s.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green/10 transition"
                            title="Voir"
                          >
                            <Eye size={15} />
                          </Link>
                          {s.status === "SCHEDULED" && (
                            <Link
                              href={`/admin/halaqa/${s.id}/edit`}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                              title="Modifier"
                            >
                              <Pencil size={15} />
                            </Link>
                          )}
                          <Link
                            href={`/admin/halaqa/new?duplicate=${s.id}`}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition"
                            title="Dupliquer"
                          >
                            <Copy size={15} />
                          </Link>
                          {(s.status === "SCHEDULED" || s.status === "LIVE") && (
                            <button
                              type="button"
                              onClick={() => handleCancel(s.id)}
                              disabled={cancellingId === s.id}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-60"
                              title="Annuler"
                            >
                              {cancellingId === s.id ? (
                                <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <XCircle size={15} />
                              )}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(s.id)}
                            disabled={deletingId === s.id}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-60"
                            title="Supprimer"
                          >
                            {deletingId === s.id ? (
                              <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {sessions.length === 0 && (
              <div className="text-center py-12">
                <Video size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Aucune séance Halaqa Online</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
