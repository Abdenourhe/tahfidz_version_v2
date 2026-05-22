"use client"
// src/components/student/StudentProgressClient.tsx

import { useLanguage, useT } from "@/contexts/LanguageContext"
import { VerseProgressTracker } from "@/components/student/VerseProgressTracker"

interface Surah {
  id: number; nameFr: string; nameAr: string; verseCount: number; juzNumber: number
}
interface StatusHistory {
  id: string; oldStatus: string; newStatus: string; changedAt: Date
}
interface Evaluation {
  finalScore: number; decision: string
}
interface Progress {
  id: string
  surahId: number
  status: string
  completionPercentage: number
  currentVerse: number
  startedAt: Date
  surah: Surah
  statusHistory: StatusHistory[]
  evaluation: Evaluation | null
}
interface Props {
  studentId: string
  memorized: Progress[]
  inProgress: Progress[]
  formatDate: (d: Date, opts?: Intl.DateTimeFormatOptions) => string
  statusLabel: (status: string) => { label: string; bg: string; color: string }
}

export function StudentProgressClient({ studentId, memorized, inProgress, formatDate, statusLabel }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("studentProgressClient")

  const total = memorized.length + inProgress.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {inProgress.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("inProgress")}</h2>
          <div className="space-y-4">
            {inProgress.map((prog) => {
              const sl = statusLabel(prog.status)
              return (
                <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{prog.surah.nameFr}</h3>
                        <span className="arabic text-tahfidz-green font-medium">{prog.surah.nameAr}</span>
                        <span className={`text-xs px-2.5 py-1 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {t("juz")} {prog.surah.juzNumber} · {prog.surah.verseCount} {t("verses")} ·
                        {t("started")} {formatDate(prog.startedAt, { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-bold text-tahfidz-green">{Math.round(prog.completionPercentage)}%</p>
                    </div>
                  </div>

                  <VerseProgressTracker
                    progressId={prog.id}
                    studentId={studentId}
                    surahId={prog.surahId}
                    totalVerses={prog.surah.verseCount}
                    currentVerse={prog.currentVerse}
                    status={prog.status}
                    startedAt={prog.startedAt.toISOString()}
                  />

                  {prog.statusHistory.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-800">
                      <p className="text-xs text-gray-400 mb-1.5">{t("history")}</p>
                      <div className="space-y-1">
                        {prog.statusHistory.slice(0, 3).map((h) => {
                          const oldSl = statusLabel(h.oldStatus)
                          const newSl = statusLabel(h.newStatus)
                          return (
                            <p key={h.id} className="text-xs text-gray-400">
                              <span className={`font-medium ${oldSl.color}`}>{oldSl.label}</span>
                              {" → "}
                              <span className={`font-medium ${newSl.color}`}>{newSl.label}</span>
                              {" · "}
                              {formatDate(h.changedAt, { day: "2-digit", month: "short" })}
                            </p>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {memorized.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">{t("memorized")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {memorized.map((prog) => (
              <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-xl border border-tahfidz-green/30 dark:border-emerald-800 p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-tahfidz-green text-lg">✓</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                  <p className="arabic text-sm text-tahfidz-green">{prog.surah.nameAr}</p>
                  <p className="text-xs text-gray-400">{prog.surah.verseCount} {t("verses")} · {t("juz")} {prog.surah.juzNumber}</p>
                </div>
                {prog.evaluation && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-tahfidz-green">{prog.evaluation.finalScore}</p>
                    <p className="text-xs text-gray-400">/100</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <p className="text-4xl mb-3">📖</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noProgress")}</p>
          <p className="text-sm text-gray-400">{t("waitTeacher")}</p>
        </div>
      )}
    </div>
  )
}