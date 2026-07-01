"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"
import { TeacherEvaluationModal } from "./TeacherEvaluationModal"
import {
  Award, Plus, Filter, Search, Calendar, User, BookOpen,
  CheckCircle, AlertTriangle, XCircle, ChevronRight,
  Trash2, Edit3, Eye, Loader2, X
} from "lucide-react"

interface Props {
  evaluations: {
    id: string
    evaluatedAt: Date
    memorizationScore: number
    tajweedScore: number
    fluencyScore: number
    makharijScore: number | null
    tafsirUnderstanding: number | null
    finalScore: number
    decision: string
    teacherNotes: string | null
    revisionRequired: boolean
    student: { id: string; user: { fullName: string; fullNameAr: string | null } }
    progress: { id: string; surah: { nameFr: string; nameAr: string } } | null
  }[]
  stats: { total: number; approved: number; revision: number; rejected: number }
  students: { id: string; user: { fullName: string; fullNameAr: string | null } }[]
}

export function TeacherEvaluationsClient({ evaluations, stats, students }: Props) {
  const { locale } = useLanguage()
  const t = useT("teacherEvaluations")
  const [filter, setFilter] = useState<"all" | "approved" | "revision" | "rejected">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewingEval, setViewingEval] = useState<typeof evaluations[0] | null>(null)

  const filtered = evaluations.filter(e => {
    const matchesFilter = filter === "all" || 
      (filter === "approved" && e.decision === "APPROVED") ||
      (filter === "revision" && e.decision === "NEEDS_REVISION") ||
      (filter === "rejected" && e.decision === "REJECTED")
    const matchesSearch = e.student.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.progress?.surah.nameFr.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    return matchesFilter && matchesSearch
  })

  const getDecisionStyle = (decision: string) => {
    switch (decision) {
      case "APPROVED": return { bg: "bg-green-100 dark:bg-green-900/20", text: "text-green-700 dark:text-green-300", icon: CheckCircle, label: t("approvedLabel") }
      case "NEEDS_REVISION": return { bg: "bg-yellow-100 dark:bg-yellow-900/20", text: "text-yellow-700 dark:text-yellow-300", icon: AlertTriangle, label: t("revisionLabel") }
      case "REJECTED": return { bg: "bg-red-100 dark:bg-red-900/20", text: "text-red-700 dark:text-red-300", icon: XCircle, label: t("rejectedLabel") }
      default: return { bg: "bg-gray-100", text: "text-gray-700", icon: AlertTriangle, label: decision }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 flex items-center gap-1">
            <Calendar size={12} /> {t("sync")} : {formatDate(new Date(), { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-tahfidz-green text-white rounded-lg text-sm font-medium hover:opacity-90 transition"
          >
            <Plus size={16} />
            {t("newEval")}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "evaluations", value: stats.total, color: "bg-blue-500", icon: Award },
          { key: "approved", value: stats.approved, color: "bg-green-500", icon: CheckCircle },
          { key: "pending", value: stats.revision, color: "bg-yellow-500", icon: AlertTriangle },
          { key: "exams", value: stats.rejected, color: "bg-red-500", icon: XCircle },
        ].map(stat => {
          const Icon = stat.icon
          return (
            <button
              key={stat.key}
              onClick={() => setFilter(stat.key === "evaluations" ? "all" : stat.key as any)}
              className={`bg-white dark:bg-gray-900 rounded-xl border p-3 sm:p-4 text-left transition-all hover:shadow-md ${
                (stat.key === "evaluations" && filter === "all") ||
                (stat.key === "approved" && filter === "approved") ||
                (stat.key === "pending" && filter === "revision") ||
                (stat.key === "exams" && filter === "rejected")
                  ? "border-tahfidz-green ring-2 ring-tahfidz-green/20"
                  : "border-gray-200 dark:border-gray-800"
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg ${stat.color} flex items-center justify-center mb-2`}>
                <Icon size={16} className="text-white" />
              </div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t(stat.key)}</p>
            </button>
          )
        })}
      </div>

      {/* Filters + Search */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "approved", "revision", "rejected"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                filter === f
                  ? "bg-tahfidz-green text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {f === "all" && <Filter size={12} className="inline mr-1" />}
              {f === "approved" && <CheckCircle size={12} className="inline mr-1" />}
              {f === "revision" && <AlertTriangle size={12} className="inline mr-1" />}
              {f === "rejected" && <XCircle size={12} className="inline mr-1" />}
              {t(f)} ({f === "all" ? stats.total : stats[f === "approved" ? "approved" : f === "revision" ? "revision" : "rejected"]})
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={locale === "ar" ? "بحث..." : locale === "en" ? "Search..." : "Rechercher..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20"
          />
        </div>
      </div>

      {/* Evaluations List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 sm:p-16 text-center">
            <Award size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">{t("noEval")}</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t("noEvalDesc")}</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-tahfidz-green hover:underline"
            >
              {t("createFirst")} <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 text-xs font-semibold text-gray-500 dark:text-gray-400">
              <div className="col-span-3">{t("student")}</div>
              <div className="col-span-2">{t("surah")}</div>
              <div className="col-span-2">{t("date")}</div>
              <div className="col-span-2">{t("score")}</div>
              <div className="col-span-2">{t("decision")}</div>
              <div className="col-span-1">{t("actions")}</div>
            </div>

            {filtered.map(eval_ => {
              const decision = getDecisionStyle(eval_.decision)
              const DecisionIcon = decision.icon
              return (
                <div
                  key={eval_.id}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 px-4 py-3 sm:px-6 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition items-center"
                >
                  {/* Student */}
                  <div className="col-span-3 flex items-center gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-tahfidz-green/10 flex items-center justify-center">
                      <User size={14} className="text-tahfidz-green" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{eval_.student.user.fullName}</p>
                      {eval_.student.user.fullNameAr && (
                        <p className="arabic text-xs text-gray-500">{eval_.student.user.fullNameAr}</p>
                      )}
                    </div>
                  </div>

                  {/* Surah */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-1.5">
                      <BookOpen size={14} className="text-tahfidz-green" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {eval_.progress?.surah.nameFr ?? "—"}
                      </span>
                    </div>
                    {eval_.progress?.surah.nameAr && (
                      <p className="arabic text-xs text-tahfidz-green mt-0.5">{eval_.progress.surah.nameAr}</p>
                    )}
                  </div>

                  {/* Date */}
                  <div className="col-span-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={14} />
                    {formatDate(eval_.evaluatedAt, { day: "numeric", month: "short", year: "numeric" })}
                  </div>

                  {/* Score */}
                  <div className="col-span-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${eval_.finalScore}%`,
                              backgroundColor: eval_.finalScore >= 80 ? "#22c55e" : eval_.finalScore >= 60 ? "#eab308" : "#ef4444",
                            }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-bold ${
                        eval_.finalScore >= 80 ? "text-green-600" : eval_.finalScore >= 60 ? "text-yellow-600" : "text-red-500"
                      }`}>
                        {eval_.finalScore}%
                      </span>
                    </div>
                  </div>

                  {/* Decision */}
                  <div className="col-span-2">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${decision.bg} ${decision.text}`}>
                      <DecisionIcon size={12} />
                      {decision.label}
                    </span>
                    {eval_.revisionRequired && (
                      <span className="block text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        ⚠ {t("revisionRequired")}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="col-span-1 flex items-center gap-1">
                    <button onClick={() => setViewingEval(eval_)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-tahfidz-green transition" title={t("viewDetails")}>
                      <Eye size={14} />
                    </button>
                    <Link href={`/teacher/evaluation/new?progressId=${eval_.progress?.id}&studentId=${eval_.student?.id}&edit=${eval_.id}`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-blue-500 transition" title={t("edit")}>
                      <Edit3 size={14} />
                    </Link>
                    <button
                      onClick={async () => {
                        if (!confirm(t("confirmDelete"))) return
                        setDeletingId(eval_.id)
                        try {
                          const res = await fetch(`/api/evaluations/${eval_.id}`, { method: "DELETE" })
                          if (res.ok) {
                            window.location.reload()
                          } else {
                            const errData = await res.json().catch(() => ({}))
                            alert(errData.error || "Erreur lors de la suppression")
                          }
                        } finally {
                          setDeletingId(null)
                        }
                      }}
                      disabled={deletingId === eval_.id}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-red-500 transition disabled:opacity-50"
                      title={t("delete")}
                    >
                      {deletingId === eval_.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Nouvelle Évaluation */}
      <TeacherEvaluationModal open={showModal} students={students} onClose={() => setShowModal(false)} />

      {/* Modal Voir Détails */}
      {viewingEval && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setViewingEval(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t("evalDetails")}</h3>
              <button onClick={() => setViewingEval(null)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">{t("student")}</span><span className="font-medium">{viewingEval.student.user.fullName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("surah")}</span><span className="font-medium">{viewingEval.progress?.surah.nameFr ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("date")}</span><span className="font-medium">{formatDate(viewingEval.evaluatedAt, { day: "numeric", month: "short", year: "numeric" })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("score")}</span><span className="font-medium">{viewingEval.finalScore}/100</span></div>
              <div className="flex justify-between"><span className="text-gray-500">{t("decision")}</span><span className="font-medium">{getDecisionStyle(viewingEval.decision).label}</span></div>
              {viewingEval.teacherNotes && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-2">
                  <span className="text-gray-500 text-xs">{t("notes")}</span>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">{viewingEval.teacherNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
