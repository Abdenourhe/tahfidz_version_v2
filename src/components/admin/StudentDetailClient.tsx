"use client"
// src/components/admin/StudentDetailClient.tsx

import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { ArrowLeft, Star, Calendar, BookOpen, Award, Printer } from "lucide-react"
import { StudentGroupTransfer } from "@/components/admin/StudentGroupTransfer"
import { formatDate, statusLabel, scoreToGrade, formatAge } from "@/lib/utils"  // ← IMPORTS DIRECTS

interface Props {
  student: any
  school: any
  memorized: any[]
  inProgress: any[]
  attendanceRate: number
  // ← SUPPRIMÉ : formatDate, statusLabel, scoreToGrade, formatAge
}

export function StudentDetailClient({ student, school, memorized, inProgress, attendanceRate }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    back:         { fr: "Retour",                   en: "Back",                  ar: "رجوع" },
    active:       { fr: "Actif",                    en: "Active",                ar: "نشط" },
    inactive:     { fr: "Inactif",                  en: "Inactive",              ar: "غير نشط" },
    certificate:  { fr: "Certificat",               en: "Certificate",           ar: "شهادة" },
    group:        { fr: "Groupe",                   en: "Group",                 ar: "المجموعة" },
    teacher:      { fr: "Enseignant",               en: "Teacher",               ar: "المعلم" },
    gender:       { fr: "Genre",                    en: "Gender",                ar: "الجنس" },
    male:         { fr: "Masculin",                 en: "Male",                  ar: "ذكر" },
    female:       { fr: "Féminin",                  en: "Female",                ar: "أنثى" },
    unknown:      { fr: "—",                        en: "—",                     ar: "—" },
    age:          { fr: "Âge",                      en: "Age",                   ar: "العمر" },
    enrolled:     { fr: "Inscrit le",               en: "Enrolled on",           ar: "تاريخ التسجيل" },
    phone:        { fr: "Téléphone",                en: "Phone",                 ar: "الهاتف" },
    school:       { fr: "École",                    en: "School",                ar: "المدرسة" },
    stars:        { fr: "Étoiles",                  en: "Stars",                 ar: "النجوم" },
    memorized2:   { fr: "Mémorisées",               en: "Memorized",             ar: "محفوظة" },
    badges:       { fr: "Badges",                   en: "Badges",                ar: "الشارات" },
    attendance:   { fr: "Présence",                 en: "Attendance",            ar: "الحضور" },
    progress:     { fr: "Progression",              en: "Progress",              ar: "التقدم" },
    inProgress:   { fr: "en cours",                 en: "in progress",           ar: "جارٍ" },
    noProgress:   { fr: "Aucune progression active", en: "No active progress",   ar: "لا يوجد تقدم نشط" },
    verse:        { fr: "Verset",                   en: "Verse",                 ar: "آية" },
    evaluate:     { fr: "Évaluer",                  en: "Evaluate",              ar: "تقييم" },
    memorized3:   { fr: "Mémorisées",               en: "Memorized",             ar: "محفوظة" },
    parents:      { fr: "Parents liés",             en: "Linked parents",        ar: "أولياء الأمور المرتبطون" },
    father:       { fr: "Père",                     en: "Father",                ar: "أب" },
    mother:       { fr: "Mère",                     en: "Mother",                ar: "أم" },
    guardian:     { fr: "Tuteur",                   en: "Guardian",              ar: "ولي" },
    starsHistory: { fr: "Historique des étoiles",   en: "Stars history",         ar: "تاريخ النجوم" },
    recentAtt:    { fr: "Présences récentes",       en: "Recent attendance",     ar: "الحضور الأخير" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  const relationLabel = (rel: string) => {
    if (rel === "father") return t("father")
    if (rel === "mother") return t("mother")
    return t("guardian")
  }

  const relationEmoji = (rel: string) => rel === "father" ? "👨" : rel === "mother" ? "👩" : "🧑"

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/students" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{student.user.fullName}</h1>
          {student.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{student.user.fullNameAr}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${student.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {student.user.isActive ? t("active") : t("inactive")}
          </span>
          <Link href={`/admin/students/${student.id}/certificate`}
            className="flex items-center gap-2 px-4 py-2 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition shadow-sm">
            <Printer size={15} /> {t("certificate")}
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center mb-3">
                <span className="text-white font-bold text-xl">{student.user.fullName.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{student.user.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{student.user.email}</p>
              <code className="mt-1 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-600 dark:text-gray-300">{student.studentCode}</code>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">{t("group")}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-700 dark:text-gray-300">{student.group?.name ?? "—"}</span>
                  <StudentGroupTransfer
                    studentId={student.id}
                    studentName={student.user.fullName}
                    currentGroupId={student.groupId}
                    currentGroupName={student.group?.name}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("teacher")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{student.teacher?.user.fullName ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("gender")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{genderLabel(student.user.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("age")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatAge(student.dateOfBirth)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("enrolled")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(student.enrollmentDate, { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
              {student.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("phone")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{student.user.phone}</span>
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
              { icon: Star, label: t("stars"), value: student.totalStars, color: "text-tahfidz-gold" },
              { icon: BookOpen, label: t("memorized2"), value: memorized.length, color: "text-tahfidz-green" },
              { icon: Award, label: t("badges"), value: student.studentBadges.length, color: "text-purple-600" },
              { icon: Calendar, label: t("attendance"), value: `${attendanceRate}%`, color: "text-blue-600" },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <stat.icon size={18} className={`${stat.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>

          {student.parentLinks.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">{t("parents")}</h3>
              <div className="space-y-2">
                {student.parentLinks.map((link: any) => (
                  <div key={link.id} className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{relationEmoji(link.relation)}</span>
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300">{link.parent.user.fullName}</p>
                      <p className="text-xs text-gray-400">{link.parent.user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("progress")} ({inProgress.length} {t("inProgress")})</h3>
            {inProgress.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("noProgress")}</p>
            ) : (
              <div className="space-y-3">
                {inProgress.map((prog: any) => {
                  const sl = statusLabel(prog.status)
                  return (
                    <div key={prog.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</span>
                          <span className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                          {prog.status === "READY_FOR_RECITATION" && (
                            <Link href={`/teacher/evaluation/new?progressId=${prog.id}&studentId=${student.id}`}
                              className="text-xs px-2 py-1 bg-tahfidz-green text-white rounded-lg hover:opacity-90">
                              {t("evaluate")}
                            </Link>
                          )}
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-gray-400">
                        <span>{t("verse")} {prog.currentVerse}/{prog.surah.verseCount}</span>
                        <span>{Math.round(prog.completionPercentage)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {memorized.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("memorized3")} ({memorized.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {memorized.map((prog: any) => {
                  const grade = prog.evaluation ? scoreToGrade(prog.evaluation.finalScore) : null
                  return (
                    <div key={prog.id} className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                      <span className="text-tahfidz-green text-base">✓</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{prog.surah.nameFr}</p>
                        <p className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</p>
                      </div>
                      {grade && (
                        <span className={`text-xs font-bold flex-shrink-0 ${grade.color}`}>{prog.evaluation.finalScore}/100</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {student.studentBadges.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("badges")} ({student.studentBadges.length})</h3>
              <div className="flex flex-wrap gap-2">
                {student.studentBadges.map((sb: any) => (
                  <div key={sb.id} className="flex items-center gap-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <span className="text-lg">{sb.badge.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{sb.badge.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(sb.earnedAt, { day: "2-digit", month: "short" })}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.starsLogs.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("starsHistory")}</h3>
              <div className="space-y-2">
                {student.starsLogs.map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${log.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {log.amount >= 0 ? "+" : ""}{log.amount}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{log.reason}</span>
                    </div>
                    <span className="text-xs text-gray-400">{formatDate(log.createdAt, { day: "2-digit", month: "short" })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.attendances.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("recentAtt")}</h3>
              <div className="grid grid-cols-7 gap-1">
                {student.attendances.map((att: any) => {
                  const statusColor = ({
                    PRESENT: "bg-green-500",
                    ABSENT: "bg-red-500",
                    LATE: "bg-yellow-500",
                    EXCUSED: "bg-blue-500",
                  } as Record<string, string>)[att.status] || "bg-gray-300"
                  return (
                    <div key={att.id} className="text-center">
                      <div className={`w-8 h-8 rounded-lg ${statusColor} mx-auto mb-1`} />
                      <p className="text-xs text-gray-500">{new Date(att.date).getDate()}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}