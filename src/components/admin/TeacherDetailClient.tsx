"use client"
// src/components/admin/TeacherDetailClient.tsx

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { ArrowLeft, Users, BookOpen, Star, ClipboardList } from "lucide-react"
import { formatDate, scoreToGrade } from "@/lib/utils"

interface Props {
  teacher: any
  school: any
  avgScore: number | null
}

export function TeacherDetailClient({ teacher, school, avgScore }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    back:           { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    active:         { fr: "Actif",                    en: "Active",                ar: "نشط" },
    inactive:       { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    specialization: { fr: "Spécialisation",           en: "Specialization",        ar: "التخصص" },
    phone:          { fr: "Téléphone",                en: "Phone",                 ar: "الهاتف" },
    gender:         { fr: "Genre",                    en: "Gender",                ar: "الجنس" },
    male:           { fr: "Masculin",                 en: "Male",                  ar: "ذكر" },
    female:         { fr: "Féminin",                  en: "Female",                ar: "أنثى" },
    unknown:        { fr: "—",                        en: "—",                     ar: "—" },
    enrolled:       { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    lastLogin:      { fr: "Dernière connexion",       en: "Last login",            ar: "آخر تسجيل دخول" },
    school:         { fr: "École",                    en: "School",                ar: "المدرسة" },
    groups:         { fr: "Groupes",                  en: "Groups",                ar: "المجموعات" },
    students:       { fr: "Élèves",                   en: "Students",              ar: "الطلاب" },
    evaluations:    { fr: "Évaluations",              en: "Evaluations",           ar: "التقييمات" },
    avgScore:       { fr: "Score moyen",              en: "Average score",         ar: "المعدل" },
    recentEval:     { fr: "Évaluations récentes",     en: "Recent evaluations",    ar: "التقييمات الأخيرة" },
    student:        { fr: "Élève",                    en: "Student",               ar: "الطالب" },
    surah:          { fr: "Sourate",                  en: "Surah",                 ar: "السورة" },
    score:          { fr: "Score",                    en: "Score",                 ar: "النتيجة" },
    noEval:         { fr: "Aucune évaluation",        en: "No evaluation",         ar: "لا يوجد تقييم" },
    manageGroup:    { fr: "Gérer →",                  en: "Manage →",              ar: "← إدارة" },
    viewStudent:    { fr: "Voir →",                   en: "View →",                ar: "← عرض" },
    memorized:      { fr: "sourates mémorisées",      en: "memorized surahs",      ar: "سور محفوظة" },  // ← AJOUTÉ
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</h1>
          {teacher.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{teacher.user.fullNameAr}</p>}
        </div>
        <span className={`px-3 py-1 text-sm rounded-full font-medium ${teacher.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {teacher.user.isActive ? t("active") : t("inactive")}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center mb-3">
                <span className="text-white font-bold text-xl">{teacher.user.fullName.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{teacher.user.email}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("specialization")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.specialization ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("gender")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{genderLabel(teacher.user.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("enrolled")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.createdAt, { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
              {teacher.user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("lastLogin")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.lastLoginAt, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              {teacher.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("phone")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.user.phone}</span>
                </div>
              )}
            </div>

            {school && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                  {school.logo ? (
                    <Image src={school.logo} alt={school.name} width={36} height={36} className="w-full h-full object-contain p-0.5" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{school.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{t("school")}</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{school.name}</p>
                  {school.nameAr && <p className="arabic text-xs text-gray-400 truncate">{school.nameAr}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: t("groups"), value: teacher.groups.length, color: "text-blue-600" },
              { icon: BookOpen, label: t("students"), value: teacher._count.students, color: "text-tahfidz-green" },
              { icon: ClipboardList, label: t("evaluations"), value: teacher._count.evaluations, color: "text-purple-600" },
              { icon: Star, label: t("avgScore"), value: avgScore ?? "—", color: "text-tahfidz-gold" },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <stat.icon size={18} className={`${stat.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-4">
          {/* Groupes */}
          {teacher.groups.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("groups")} ({teacher.groups.length})</h3>
              <div className="space-y-2">
                {teacher.groups.map((group: any) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{group.name}</p>
                      <p className="text-xs text-gray-400">{group._count.students} {t("students")}</p>
                    </div>
                    <Link href={`/admin/groups/${group.id}`} className="text-xs text-tahfidz-green hover:underline font-medium">
                      {t("manageGroup")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Élèves récents */}
          {teacher.students.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("students")} ({teacher.students.length})</h3>
              <div className="space-y-2">
                {teacher.students.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{s.user.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{s.user.fullName}</p>
                        {s.user.fullNameAr && <p className="arabic text-xs text-gray-400">{s.user.fullNameAr}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{s._count.memorizedSurahs} {t("memorized")}</span> 
                      <Link href={`/admin/students/${s.id}`} className="text-xs text-tahfidz-green hover:underline font-medium">
                        {t("viewStudent")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Évaluations récentes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("recentEval")} ({teacher.evaluations.length})</h3>
            {teacher.evaluations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("noEval")}</p>
            ) : (
              <div className="space-y-2">
                {teacher.evaluations.map((evalItem: any) => {
                  const grade = scoreToGrade(evalItem.finalScore)
                  return (
                    <div key={evalItem.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{evalItem.student.user.fullName}</p>
                          <p className="text-xs text-gray-400">{evalItem.progress?.surah?.nameFr ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${grade.color}`}>{evalItem.finalScore}/100</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${grade.bg} ${grade.color}`}>{grade.label}</span>
                        <span className="text-xs text-gray-400">{formatDate(evalItem.evaluatedAt, { day: "2-digit", month: "short" })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}