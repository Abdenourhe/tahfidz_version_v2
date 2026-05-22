"use client"
// src/components/teacher/TeacherStudentsListClient.tsx

import Link from "next/link"
import { Search, Users } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Student {
  id: string
  totalStars: number
  dateOfBirth: Date | null
  user: { fullName: string; email: string; avatar: string | null }
  group: { id: string; name: string } | null
  teacher: { user: { fullName: string } } | null
  memorizationProgress: {
    id: string
    status: string
    completionPercentage: number
    surah: { nameFr: string; nameAr: string }
  }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  students: Student[]
  search: string
  statusFilter: string
  calculateAge: (birthDate: Date | string | null | undefined) => number | null
}

const STATUS_FILTERS = [
  { value: "",                        label: { fr: "Tous", en: "All", ar: "الكل" } },
  { value: "IN_PROGRESS",             label: { fr: "En cours", en: "In progress", ar: "جارٍ" } },
  { value: "READY_FOR_RECITATION",    label: { fr: "Prêt à réciter", en: "Ready to recite", ar: "جاهز للتسميع" } },
  { value: "NEEDS_REVISION",          label: { fr: "Révision", en: "Revision", ar: "مراجعة" } },
  { value: "PENDING_TEACHER_APPROVAL", label: { fr: "En attente", en: "Pending", ar: "في الانتظار" } },
]

export function TeacherStudentsListClient({ students, search, statusFilter, calculateAge }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("teacherStudentsListClient")

  const statusLabelMap: Record<string, { label: string; bg: string; color: string }> = {
    IN_PROGRESS:              { label: L === "ar" ? "جارٍ" : L === "en" ? "In progress" : "En cours",       bg: "bg-blue-100",   color: "text-blue-700" },
    READY_FOR_RECITATION:     { label: L === "ar" ? "جاهز للتسميع" : L === "en" ? "Ready" : "Prêt",         bg: "bg-orange-100", color: "text-orange-700" },
    NEEDS_REVISION:           { label: L === "ar" ? "مراجعة" : L === "en" ? "Revision" : "Révision",        bg: "bg-red-100",    color: "text-red-700" },
    PENDING_TEACHER_APPROVAL: { label: L === "ar" ? "في الانتظار" : L === "en" ? "Pending" : "En attente",  bg: "bg-yellow-100", color: "text-yellow-700" },
    MEMORIZED:                { label: L === "ar" ? "محفوظ" : L === "en" ? "Memorized" : "Mémorisé",        bg: "bg-green-100",  color: "text-green-700" },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <form>
            <input name="search" defaultValue={search} placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </form>
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map(f => (
            <Link key={f.value}
              href={`/teacher/students?${f.value ? `status=${f.value}` : ""}${search ? `&search=${search}` : ""}`}
              className={`px-3 py-2.5 text-xs rounded-lg border transition font-medium ${statusFilter === f.value ? "bg-tahfidz-green text-white border-tahfidz-green" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
              {f.label[L] ?? f.label.fr}
            </Link>
          ))}
        </div>
      </div>

      {/* Grille élèves */}
      {students.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Users size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-gray-400">{t("noStudent")}{statusFilter ? t("noStudentStatus") : ""}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map(student => {
            const age = calculateAge(student.dateOfBirth)
            const readyProg = student.memorizationProgress.find(p => ["READY_FOR_RECITATION","PENDING_TEACHER_APPROVAL"].includes(p.status))
            return (
              <div key={student.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">{student.user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm truncate">{student.user.fullName}</p>
                      {age !== null && (
                        <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded font-medium flex-shrink-0">
                          {age} {t("years")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{student.group?.name ?? t("noGroup")}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-tahfidz-gold">⭐ {student.totalStars}</p>
                    <p className="text-xs text-gray-400">{student._count.memorizedSurahs} {t("surahs")}</p>
                  </div>
                </div>

                {/* Progressions */}
                {student.memorizationProgress.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {student.memorizationProgress.slice(0, 2).map(prog => {
                      const sl = statusLabelMap[prog.status] ?? statusLabelMap.IN_PROGRESS
                      return (
                        <div key={prog.id} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{prog.surah.nameFr}</span>
                              <span className="arabic text-xs text-tahfidz-green flex-shrink-0">{prog.surah.nameAr}</span>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-1 ${sl.bg} ${sl.color}`}>{sl.label}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 text-right">{Math.round(prog.completionPercentage)}%</p>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 text-center py-3 mb-4">{t("noProgress")}</p>
                )}

                <div className="flex gap-2">
                  <Link href={`/teacher/students/${student.id}`}
                    className="flex-1 text-center text-xs py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition font-medium">
                    {t("viewProfile")}
                  </Link>
                  {readyProg ? (
                    <Link href={`/teacher/evaluation/new?progressId=${readyProg.id}&studentId=${student.id}`}
                      className="flex-1 text-center text-xs py-2 bg-tahfidz-green text-white rounded-lg hover:bg-tahfidz-green/90 transition font-medium">
                      {t("evaluate")} ✓
                    </Link>
                  ) : (
                    <Link href={`/teacher/progress?studentId=${student.id}`}
                      className="flex-1 text-center text-xs py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-medium">
                      {t("progress")}
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}