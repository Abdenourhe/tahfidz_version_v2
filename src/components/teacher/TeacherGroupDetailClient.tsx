"use client"
// src/components/teacher/TeacherGroupDetailClient.tsx

import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { ArrowLeft, Star, CalendarCheck, Users } from "lucide-react"
import { TeacherGroupAttendance } from "@/components/teacher/TeacherGroupAttendance"

interface Props {
  group: any
  formatDate: (d: Date, opts?: Intl.DateTimeFormatOptions) => string
  statusLabel: (status: string) => { label: string; bg: string; color: string }
}

export function TeacherGroupDetailClient({ group, formatDate, statusLabel }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    students:     { fr: "Élèves",                   en: "Students",              ar: "الطلاب" },
    max:          { fr: "Max",                      en: "Max",                   ar: "الحد الأقصى" },
    schedule:     { fr: "Horaires",                 en: "Schedule",              ar: "الجدول الزمني" },
    todayAtt:     { fr: "Présences du jour",        en: "Today's attendance",    ar: "حضور اليوم" },
    assignSurahs: { fr: "Assigner sourates",        en: "Assign surahs",         ar: "تعيين السور" },
    noStudent:    { fr: "Aucun élève",              en: "No students",           ar: "لا يوجد طلاب" },
    inProgress:   { fr: "En cours",                 en: "In progress",           ar: "جارٍ" },
    surahs:       { fr: "sour.",                    en: "surahs",                ar: "سورة" },
    view:         { fr: "Voir",                     en: "View",                  ar: "عرض" },
    level:        { fr: "Niveau",                   en: "Level",                 ar: "المستوى" },
    beginner:     { fr: "Débutant",                 en: "Beginner",              ar: "مبتدئ" },
    intermediate: { fr: "Intermédiaire",            en: "Intermediate",          ar: "متوسط" },
    advanced:     { fr: "Avancé",                   en: "Advanced",              ar: "متقدم" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const levelLabel = (lvl: string) => {
    if (lvl === "beginner") return t("beginner")
    if (lvl === "intermediate") return t("intermediate")
    if (lvl === "advanced") return t("advanced")
    return lvl
  }

  const schedule = group.schedule as Record<string, string> | null

  const DAY_LABELS: Record<string, string> = {
    monday: L === "ar" ? "الإثنين" : L === "en" ? "Monday" : "Lundi",
    tuesday: L === "ar" ? "الثلاثاء" : L === "en" ? "Tuesday" : "Mardi",
    wednesday: L === "ar" ? "الأربعاء" : L === "en" ? "Wednesday" : "Mercredi",
    thursday: L === "ar" ? "الخميس" : L === "en" ? "Thursday" : "Jeudi",
    friday: L === "ar" ? "الجمعة" : L === "en" ? "Friday" : "Vendredi",
    saturday: L === "ar" ? "السبت" : L === "en" ? "Saturday" : "Samedi",
    sunday: L === "ar" ? "الأحد" : L === "en" ? "Sunday" : "Dimanche",
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/teacher/groups" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
              {levelLabel(group.level)}
            </span>
          </div>
          {group.nameAr && <p className="arabic text-gray-500 dark:text-gray-400 mt-0.5">{group.nameAr}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{group._count.students}</p>
                <p className="text-xs text-gray-400">{t("students")}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{group.maxCapacity}</p>
                <p className="text-xs text-gray-400">{t("max")}</p>
              </div>
            </div>

            {schedule && Object.keys(schedule).length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">📅 {t("schedule")}</p>
                <div className="space-y-1.5">
                  {Object.entries(schedule).map(([day, time]) => (
                    <div key={day} className="flex justify-between text-xs bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg">
                      <span className="text-gray-600 dark:text-gray-300 font-medium">{DAY_LABELS[day] ?? day}</span>
                      <span className="text-gray-400 font-mono">{time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">{t("todayAtt")}</h3>
            <TeacherGroupAttendance
              groupId={group.id}
              students={group.students.map((s: any) => ({ id: s.id, user: s.user }))}
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("students")} ({group._count.students})</h3>
            <Link href={`/teacher/progress`} className="text-xs text-tahfidz-green hover:underline font-medium">
              {t("assignSurahs")} →
            </Link>
          </div>
          {group.students.length === 0 ? (
            <div className="text-center py-12"><Users size={28} className="mx-auto mb-2 text-gray-300" /><p className="text-gray-400 text-sm">{t("noStudent")}</p></div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {group.students.map((student: any) => (
                <div key={student.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{student.user.fullName.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{student.user.fullName}</p>
                      {student.user.fullNameAr && <p className="arabic text-xs text-gray-400">{student.user.fullNameAr}</p>}
                      {student.memorizationProgress[0] && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500">{t("inProgress")} :</span>
                          <span className="text-xs font-medium">{student.memorizationProgress[0].surah.nameFr}</span>
                          <span className="arabic text-xs text-tahfidz-green">{student.memorizationProgress[0].surah.nameAr}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusLabel(student.memorizationProgress[0].status).bg} ${statusLabel(student.memorizationProgress[0].status).color}`}>
                            {statusLabel(student.memorizationProgress[0].status).label}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-tahfidz-green">{student._count.memorizedSurahs}</p>
                        <p className="text-xs text-gray-400">{t("surahs")}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-tahfidz-gold">⭐{student.totalStars}</p>
                        <p className="text-xs text-gray-400">★</p>
                      </div>
                      <Link href={`/teacher/students/${student.id}`}
                        className="text-xs text-tahfidz-green hover:underline font-medium ml-1">{t("view")} →</Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}