"use client"
// src/components/teacher/TeacherProfileClient.tsx

import Link from "next/link"
import { useState } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { Users, BookOpen, Star, ClipboardList, Phone, Mail, GraduationCap, CalendarCheck, Bug } from "lucide-react"
import { FeedbackModal } from "@/components/shared/FeedbackModal"

interface Student {
  id: string
  user: { fullName: string }
  _count: { memorizedSurahs: number }
}

interface Group {
  id: string
  name: string
  level: string
  _count: { students: number }
  students: { totalStars: number; _count: { memorizedSurahs: number } }[]
}

interface Evaluation {
  id: string
  finalScore: number
  decision: string
  evaluatedAt: Date
  student: { user: { fullName: string } }
  progress: { surah: { nameFr: string } }
}

interface Props {
  teacher: {
    id: string
    specialization: string | null
    maxStudents: number
    user: {
      fullName: string
      fullNameAr: string | null
      email: string
      phone: string | null
      gender: string | null
      createdAt: Date
      lastLoginAt: Date | null
    }
    groups: Group[]
    students: Student[]
    evaluations: Evaluation[]
    _count: { students: number; evaluations: number }
  }
  totalMemorized: number
  avgScore: number | null
  formatDate: (d: Date, opts?: Intl.DateTimeFormatOptions) => string
}

export function TeacherProfileClient({ teacher, totalMemorized, avgScore, formatDate }: Props) {
  const [showFeedback, setShowFeedback] = useState(false)

  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("teacherProfileClient")

  const levelMap: Record<string, string> = {
    beginner: L === "ar" ? "مبتدئ" : L === "en" ? "Beginner" : "Débutant",
    intermediate: L === "ar" ? "متوسط" : L === "en" ? "Intermediate" : "Intermédiaire",
    advanced: L === "ar" ? "متقدم" : L === "en" ? "Advanced" : "Avancé",
  }

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Infos */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-3">
                <span className="text-white font-bold text-2xl">{teacher.user.fullName.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100 text-lg">{teacher.user.fullName}</p>
              {teacher.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{teacher.user.fullNameAr}</p>}
              {teacher.specialization && (
                <span className="mt-2 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-full font-medium">{teacher.specialization}</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <Mail size={14} className="text-gray-400 flex-shrink-0" />
                <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{teacher.user.email}</p>
              </div>
              {teacher.user.phone && (
                <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <Phone size={14} className="text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-700 dark:text-gray-300">{teacher.user.phone}</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("memberSince")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.createdAt, { month: "short", year: "numeric" })}</span>
              </div>
              {teacher.user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("lastLogin")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.lastLoginAt, { day: "2-digit", month: "short" })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("maxCapacity")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.maxStudents} {t("students").toLowerCase()}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-2 gap-3">
            {[
              { icon: Users,         label: t("students"), value: teacher._count.students,    color: "text-blue-600" },
              { icon: BookOpen,      label: t("groups"),   value: teacher.groups.length,       color: "text-purple-600" },
              { icon: Star,          label: t("memorized"), value: totalMemorized,              color: "text-tahfidz-green" },
              { icon: ClipboardList, label: t("avgScore"),  value: avgScore !== null ? `${avgScore}/100` : "—", color: "text-tahfidz-gold" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mes groupes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("myGroups")} ({teacher.groups.length})</h2>
              <Link href="/teacher/groups" className="text-xs text-tahfidz-green hover:underline">{t("manage")}</Link>
            </div>
            {teacher.groups.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("noGroup")}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teacher.groups.map(g => {
                  const avgMemo = g.students.length > 0 ? Math.round(g.students.reduce((a, s) => a + s._count.memorizedSurahs, 0) / g.students.length) : 0
                  const avgStars = g.students.length > 0 ? Math.round(g.students.reduce((a, s) => a + s.totalStars, 0) / g.students.length) : 0
                  return (
                    <Link key={g.id} href={`/teacher/groups/${g.id}`}
                      className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/20 rounded-xl transition group">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-tahfidz-green mb-2">{g.name}</p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-sm font-bold text-blue-600">{g._count.students}</p><p className="text-xs text-gray-400">{t("students2")}</p></div>
                        <div><p className="text-sm font-bold text-tahfidz-green">{avgMemo}</p><p className="text-xs text-gray-400">{t("avgSurahs")}</p></div>
                        <div><p className="text-sm font-bold text-tahfidz-gold">⭐{avgStars}</p><p className="text-xs text-gray-400">{t("avgStars")}</p></div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("quickActions")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: t("myStudents"),      href: "/teacher/students",    icon: GraduationCap, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30" },
                { label: t("attendance"),      href: "/teacher/attendance",  icon: CalendarCheck, color: "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green hover:bg-tahfidz-green/20 dark:hover:bg-emerald-900/30" },
                { label: t("progress"),        href: "/teacher/progress",    icon: BookOpen,      color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30" },
                { label: t("myEvaluations"),   href: "/teacher/evaluations", icon: ClipboardList, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30" },
              ].map(a => a.href ? (
                <Link key={a.href} href={a.href} className={`flex items-center gap-3 p-4 rounded-xl transition ${a.color}`}>
                  <a.icon size={18} />
                  <span className="text-sm font-medium">{a.label}</span>
                </Link>
              ) : null)}
              <button
                onClick={() => setShowFeedback(true)}
                className="flex items-center gap-3 p-4 rounded-xl transition bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <Bug size={18} />
                <span className="text-sm font-medium">{L === "ar" ? "الإبلاغ عن مشكلة" : L === "en" ? "Report issue" : "Signaler un problème"}</span>
              </button>
            </div>
          </div>

          {/* Évaluations récentes */}
          {teacher.evaluations.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("recentEvals")}</h2>
                <Link href="/teacher/evaluations" className="text-xs text-tahfidz-green hover:underline">{t("seeAll")}</Link>
              </div>
              <div className="space-y-2">
                {teacher.evaluations.map(ev => (
                  <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.student.user.fullName}</p>
                      <p className="text-xs text-gray-500">{ev.progress.surah.nameFr} · {formatDate(ev.evaluatedAt, { day: "2-digit", month: "short" })}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${ev.finalScore >= 75 ? "text-tahfidz-green" : ev.finalScore >= 50 ? "text-yellow-600" : "text-red-500"}`}>
                        {ev.finalScore}/100
                      </p>
                      <p className="text-xs text-gray-400">{ev.decision === "APPROVED" ? `✓ ${t("approved")}` : `↺ ${t("revision")}`}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="TEACHER"
        userName={teacher.user.fullName}
        userEmail={teacher.user.email}
        schoolName={undefined}
      />
    </div>
  )
}