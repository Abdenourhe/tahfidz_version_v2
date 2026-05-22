"use client"
// src/components/parent/ParentDashboardClient.tsx

import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Progress {
  id: string
  status: string
  completionPercentage: number
  surah: { nameFr: string; nameAr: string }
}

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null }
  group: { name: string } | null
  teacher: { user: { fullName: string } } | null
  memorizationProgress: Progress[]
  studentBadges: { id: string; badge: { icon: string; name: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  todayDate: string
  children: Child[]
}

function statusColor(status: string, locale: string) {
  const map: Record<string, { label: Record<string, string>; bg: string; color: string }> = {
    IN_PROGRESS:              { label: { fr: "En cours",       en: "In progress",   ar: "جارٍ" },         bg: "bg-blue-100",   color: "text-blue-700" },
    READY_FOR_RECITATION:     { label: { fr: "Prêt à réciter", en: "Ready",         ar: "جاهز" },          bg: "bg-orange-100", color: "text-orange-700" },
    PENDING_TEACHER_APPROVAL: { label: { fr: "En attente",     en: "Pending",       ar: "في الانتظار" },   bg: "bg-yellow-100", color: "text-yellow-700" },
    UNDER_REVIEW:             { label: { fr: "En révision",    en: "Under review",  ar: "قيد المراجعة" },  bg: "bg-purple-100", color: "text-purple-700" },
    MEMORIZED:                { label: { fr: "Mémorisé",       en: "Memorized",     ar: "محفوظ" },         bg: "bg-green-100",  color: "text-green-700" },
  }
  const entry = map[status] ?? { label: { fr: status, en: status, ar: status }, bg: "bg-gray-100", color: "text-gray-600" }
  const l = locale as "fr" | "en" | "ar"
  return { label: entry.label[l] ?? entry.label.fr, bg: entry.bg, color: entry.color }
}

export function ParentDashboardClient({ todayDate, children }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("parentDashboardClient")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{todayDate}</p>
      </div>

      {children.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
          <p className="text-4xl mb-3">👨‍👩‍👦</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noChild")}</p>
          <p className="text-sm text-gray-500 mb-4">{t("noChildDesc")}</p>
        </div>
      ) : (
        children.map((child) => {
          const activeProgress = child.memorizationProgress.filter(
            p => ["IN_PROGRESS", "UNDER_REVIEW", "READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL"].includes(p.status)
          )
          return (
            <div key={child.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {/* En-tête enfant */}
              <div className="p-6 bg-gradient-to-r from-tahfidz-green-light to-white dark:from-emerald-900/20 dark:to-gray-900">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl gradient-tahfidz flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{child.user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{child.user.fullName}</h2>
                    {child.user.fullNameAr && <p className="arabic text-gray-500 text-sm">{child.user.fullNameAr}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      {child.group?.name ?? t("noGroup")} ·
                      {child.teacher ? ` ${t("prof")} ${child.teacher.user.fullName}` : ` ${t("noTeacher")}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-tahfidz-gold">⭐ {child.totalStars}</div>
                    <div className="text-xs text-gray-400">{t("stars")}</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                    <div className="text-xl font-bold text-tahfidz-green">{child._count.memorizedSurahs}</div>
                    <div className="text-xs text-gray-500">{t("memorized")}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                    <div className="text-xl font-bold text-orange-500">🔥 {child.currentStreak}</div>
                    <div className="text-xs text-gray-500">{t("streak")}</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-100 dark:border-gray-700">
                    <div className="text-xl font-bold text-purple-600">{child.studentBadges.length}</div>
                    <div className="text-xs text-gray-500">{t("badges")}</div>
                  </div>
                </div>
              </div>

              {/* Progression */}
              <div className="p-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 text-sm">{t("inProgress")}</h3>
                {activeProgress.length === 0 ? (
                  <p className="text-sm text-gray-400">{t("noProgress")}</p>
                ) : (
                  <div className="space-y-3">
                    {activeProgress.map((prog) => {
                      const sl = statusColor(prog.status, L)
                      return (
                        <div key={prog.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                              <p className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ml-auto ${sl.bg} ${sl.color}`}>{sl.label}</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-tahfidz-green">{Math.round(prog.completionPercentage)}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Badges */}
              {child.studentBadges.length > 0 && (
                <div className="px-6 pb-6">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm">{t("lastBadges")}</h3>
                  <div className="flex gap-3 flex-wrap">
                    {child.studentBadges.map((sb) => (
                      <div key={sb.id} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <span className="text-lg">{sb.badge.icon}</span>
                        <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{sb.badge.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
