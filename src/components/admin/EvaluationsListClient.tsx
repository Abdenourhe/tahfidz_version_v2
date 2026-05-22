"use client"
// src/components/admin/EvaluationsListClient.tsx

import Link from "next/link"
import { ArrowLeft, ClipboardList, Star, Check, RotateCcw, X } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Evaluation {
  id: string
  finalScore: number
  decision: string
  evaluatedAt: Date
  student: {
    user: { fullName: string }
    group: { name: string } | null
  }
  teacher: { user: { fullName: string } }
  progress: { surah: { nameFr: string; nameAr: string } }
}

interface Teacher {
  id: string
  user: { fullName: string }
}

interface Props {
  evaluations: Evaluation[]
  teachers: Teacher[]
  stats: {
    total: number
    approved: number
    revision: number
    rejected: number
    avg: number
  }
  decisionFilter: string | undefined
}

export function EvaluationsListClient({ evaluations, teachers, stats, decisionFilter }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("evaluationsListClient")

  const DECISIONS: Record<string, { label: string; cls: string; icon: any }> = {
    APPROVED:       { label: L === "ar" ? "مُصادَق" : L === "en" ? "Approved" : "Approuvé",  cls: "bg-green-100 text-green-700 border-green-300",   icon: Check },
    NEEDS_REVISION: { label: L === "ar" ? "مراجعة" : L === "en" ? "Revision" : "Révision",  cls: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: RotateCcw },
    REJECTED:       { label: L === "ar" ? "مرفوض" : L === "en" ? "Rejected" : "Rejeté",    cls: "bg-red-100 text-red-700 border-red-300",          icon: X },
  }

  const fmtDate = (d: Date) => d.toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "short", year: "numeric" }
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {stats.total} {t("subtitle")} {stats.avg}/100
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-center">
          <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{stats.total}</p>
          <p className="text-xs text-gray-500">{t("total")}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800 p-3 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-xs text-gray-500">{t("approved")}</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800 p-3 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.revision}</p>
          <p className="text-xs text-gray-500">{t("revision")}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-100 dark:border-red-800 p-3 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
          <p className="text-xs text-gray-500">{t("rejected")}</p>
        </div>
        <div className="bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-xl border border-tahfidz-green/20 dark:border-emerald-800 p-3 text-center">
          <p className="text-2xl font-bold text-tahfidz-green">{stats.avg}</p>
          <p className="text-xs text-gray-500">{t("avg")}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/admin/evaluations"
          className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${!decisionFilter ? "bg-tahfidz-green text-white border-tahfidz-green" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
          {t("all")}
        </Link>
        {Object.entries(DECISIONS).map(([v, c]) => (
          <Link key={v} href={`/admin/evaluations?decision=${v}`}
            className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition flex items-center gap-1 ${decisionFilter === v ? c.cls : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
            <c.icon size={11}/>{c.label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      {evaluations.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <ClipboardList size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">{t("noEval")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evaluations.map(ev => {
            const dc = DECISIONS[ev.decision] ?? DECISIONS.NEEDS_REVISION
            return (
              <div key={ev.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-sm transition">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="w-10 h-10 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{ev.student.user.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{ev.student.user.fullName}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span>{ev.progress.surah.nameFr}</span>
                      <span className="arabic text-tahfidz-green">{ev.progress.surah.nameAr}</span>
                      <span className="text-gray-300">·</span>
                      <span>{ev.student.group?.name ?? "—"}</span>
                      <span className="text-gray-300">·</span>
                      <span>{t("teacher")} {ev.teacher.user.fullName}</span>
                      <span className="text-gray-300">·</span>
                      <span>{fmtDate(ev.evaluatedAt)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-base font-bold ${ev.finalScore >= 75 ? "text-tahfidz-green" : ev.finalScore >= 60 ? "text-yellow-600" : "text-red-500"}`}>{ev.finalScore}/100</p>
                      <div className="flex gap-0.5 justify-end">
                        {[...Array(5)].map((_, i) => <Star key={i} size={9} className={i < Math.round(ev.finalScore/20) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />)}
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-medium ${dc.cls}`}>
                      <dc.icon size={11}/>{dc.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}