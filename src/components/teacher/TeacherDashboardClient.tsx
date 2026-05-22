"use client"
// src/components/teacher/TeacherDashboardClient.tsx

import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { Users, BookOpen, Star, AlertCircle } from "lucide-react"

interface MemorizationProgress {
  id: string
  status: string
  studentId: string
  surahId: string
  surah: { nameFr: string; nameAr: string }
  student: { user: { fullName: string } }
}

interface Student {
  id: string
  user: { fullName: string; avatar: string | null }
  memorizationProgress: { id: string; status: string; surah: { nameFr: string; nameAr: string } }[]
}

interface Group {
  id: string
  name: string
  maxCapacity: number
  students: Student[]
  _count: { students: number }
}

interface Props {
  todayDate: string
  totalStudents: number
  totalMemorized: number
  groups: Group[]
  readyToRecite: MemorizationProgress[]
}

function statusBadge(status: string, locale: string) {
  const map: Record<string, { label: Record<string, string>; bg: string; color: string }> = {
    IN_PROGRESS:              { label: { fr: "En cours",         en: "In progress",    ar: "جارٍ" },       bg: "bg-blue-100",   color: "text-blue-700" },
    READY_FOR_RECITATION:     { label: { fr: "Prêt à réciter",   en: "Ready to recite",ar: "جاهز للتسميع" }, bg: "bg-orange-100", color: "text-orange-700" },
    PENDING_TEACHER_APPROVAL: { label: { fr: "En attente",       en: "Pending",        ar: "في الانتظار" }, bg: "bg-yellow-100", color: "text-yellow-700" },
    NEEDS_REVISION:           { label: { fr: "À réviser",        en: "Needs revision", ar: "يحتاج مراجعة" }, bg: "bg-red-100",    color: "text-red-700" },
    MEMORIZED:                { label: { fr: "Mémorisé",         en: "Memorized",      ar: "محفوظ" },       bg: "bg-green-100",  color: "text-green-700" },
  }
  const entry = map[status] ?? { label: { fr: status, en: status, ar: status }, bg: "bg-gray-100", color: "text-gray-600" }
  const l = locale as "fr" | "en" | "ar"
  return { label: entry.label[l] ?? entry.label.fr, bg: entry.bg, color: entry.color }
}

export function TeacherDashboardClient({ todayDate, totalStudents, totalMemorized, groups, readyToRecite }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("teacherDashboardClient")

  const allStudents = groups.flatMap(g => g.students)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{todayDate}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("myStudents"),  value: totalStudents,       icon: Users,       color: "text-blue-600",     bg: "bg-blue-50" },
          { label: t("myGroups"),    value: groups.length,        icon: BookOpen,    color: "text-purple-600",   bg: "bg-purple-50" },
          { label: t("validated"),   value: totalMemorized,       icon: Star,        color: "text-tahfidz-gold", bg: "bg-tahfidz-gold-light" },
          { label: t("readyRecite"), value: readyToRecite.length, icon: AlertCircle, color: "text-orange-600",   bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
            <div className={`inline-flex p-2.5 rounded-lg ${s.bg} mb-3`}><s.icon size={20} className={s.color} /></div>
            <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alertes */}
      {readyToRecite.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-5">
          <h2 className="font-semibold text-orange-800 dark:text-orange-300 mb-4 flex items-center gap-2">
            <AlertCircle size={18} /> {t("alertTitle")} ({readyToRecite.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {readyToRecite.map(prog => {
              const sl = statusBadge(prog.status, L)
              return (
                <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-lg border border-orange-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{prog.student.user.fullName}</p>
                    <p className="text-sm text-gray-500">
                      {prog.surah.nameFr} <span className="arabic text-tahfidz-green">{prog.surah.nameAr}</span>
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${sl.bg} ${sl.color}`}>{sl.label}</span>
                  </div>
                  <Link href={`/teacher/evaluation/new?progressId=${prog.id}&studentId=${prog.studentId}`}
                    className="px-4 py-2 bg-tahfidz-green text-white text-sm rounded-lg hover:opacity-90 transition font-medium">
                    {t("evaluate")}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Groupes + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("myGroups")} ({groups.length})</h2>
            <Link href="/teacher/groups" className="text-xs text-tahfidz-green hover:underline">{t("seeAll")}</Link>
          </div>
          {groups.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t("noGroup")}</p>
          ) : (
            <div className="space-y-3">
              {groups.map(group => (
                <Link key={group.id} href={`/teacher/groups/${group.id}`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-tahfidz-green-light rounded-lg transition group">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-tahfidz-green">{group.name}</p>
                    <p className="text-xs text-gray-500">{group._count.students} {t("students")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">{group._count.students}/{group.maxCapacity}</div>
                    <div className="text-xs text-gray-400">{t("places")}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("recentActivity")}</h2>
            <Link href="/teacher/students" className="text-xs text-tahfidz-green hover:underline">{t("allStudents")}</Link>
          </div>
          <div className="space-y-3">
            {allStudents.slice(0, 5).map(student => {
              const prog = student.memorizationProgress[0]
              const sl = prog ? statusBadge(prog.status, L) : null
              return (
                <div key={student.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="w-9 h-9 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-bold">{student.user.fullName.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{student.user.fullName}</p>
                    {prog && sl ? (
                      <p className="text-xs text-gray-500 truncate">
                        {prog.surah.nameFr} · <span className={sl.color}>{sl.label}</span>
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400">{t("noProgress")}</p>
                    )}
                  </div>
                </div>
              )
            })}
            {allStudents.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">{t("noStudent")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
