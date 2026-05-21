"use client"

import Link from "next/link"
import { Printer, Mail, Phone, Calendar, BookOpen, Award, Star, TrendingUp, Clock, GraduationCap, UserCheck, ChevronLeft } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"

interface StudentDetailClientProps {
  student: any
  school: any
  memorized: any[]
  inProgress: any[]
  attendanceRate: number
}

export function StudentDetailClient({ student, school, memorized, inProgress, attendanceRate }: StudentDetailClientProps) {
  const { L } = useLanguage()

  const T = {
    back: { fr: "← Retour à la liste", en: "← Back to list", ar: "← العودة إلى القائمة" },
    certificate: { fr: "Certificat", en: "Certificate", ar: "شهادة" },
    active: { fr: "Actif", en: "Active", ar: "نشط" },
    inactive: { fr: "Inactif", en: "Inactive", ar: "غير نشط" },
    info: { fr: "Informations", en: "Information", ar: "معلومات" },
    email: { fr: "Email", en: "Email", ar: "البريد الإلكتروني" },
    phone: { fr: "Téléphone", en: "Phone", ar: "الهاتف" },
    gender: { fr: "Genre", en: "Gender", ar: "الجنس" },
    male: { fr: "Garçon", en: "Boy", ar: "ولد" },
    female: { fr: "Fille", en: "Girl", ar: "بنت" },
    enrolled: { fr: "Inscrit le", en: "Enrolled on", ar: "مسجل بتاريخ" },
    group: { fr: "Groupe", en: "Group", ar: "المجموعة" },
    teacher: { fr: "Enseignant", en: "Teacher", ar: "المعلم" },
    memorizedSurahs: { fr: "Sourates mémorisées", en: "Memorized Surahs", ar: "السور المحفوظة" },
    inProgressSurahs: { fr: "Sourates en cours", en: "Surahs in progress", ar: "السور قيد الحفظ" },
    noMemorized: { fr: "Aucune sourate mémorisée", en: "No memorized surah", ar: "لا يوجد سور محفوظة" },
    noInProgress: { fr: "Aucune sourate en cours", en: "No surah in progress", ar: "لا يوجد سور قيد الحفظ" },
    date: { fr: "Date", en: "Date", ar: "التاريخ" },
    badges: { fr: "Badges", en: "Badges", ar: "الشارات" },
    noBadges: { fr: "Aucun badge", en: "No badges", ar: "لا توجد شارات" },
    stars: { fr: "Étoiles", en: "Stars", ar: "النجوم" },
    attendance: { fr: "Présences", en: "Attendance", ar: "الحضور" },
    attendanceRate: { fr: "Taux de présence", en: "Attendance rate", ar: "نسبة الحضور" },
    present: { fr: "Présent", en: "Present", ar: "حاضر" },
    absent: { fr: "Absent", en: "Absent", ar: "غائب" },
    late: { fr: "En retard", en: "Late", ar: "متأخر" },
    parents: { fr: "Parents", en: "Parents", ar: "الأولياء" },
    noParents: { fr: "Aucun parent lié", en: "No linked parent", ar: "لا يوجد ولي مرتبط" },
    linkedAt: { fr: "Lié le", en: "Linked on", ar: "تاريخ الربط" },
    stats: { fr: "Statistiques", en: "Statistics", ar: "الإحصائيات" },
    totalMemorized: { fr: "Total mémorisé", en: "Total memorized", ar: "المجموع المحفوظ" },
    totalEvaluations: { fr: "Total évaluations", en: "Total evaluations", ar: "مجموع التقييمات" },
  }

  const t = (k: keyof typeof T): string => {
    const val = T[k] as Record<string, string>
    return val[L] || val.fr || String(val)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/students"
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition"
              >
                <ChevronLeft size={16} />
                {t("back")}
              </Link>
              <div className="h-6 w-px bg-gray-300 dark:bg-gray-700" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                  {student.user.fullName?.charAt(0)?.toUpperCase() || "?"}
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {student.user.fullName}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{student.user.email}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge Actif/Inactif uniquement */}
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  student.user.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {student.user.isActive ? t("active") : t("inactive")}
              </span>

              {/* Bouton Certificat uniquement */}
              <Link
                href={`/admin/students/${student.id}/certificate`}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
              >
                <Printer size={15} />
                {t("certificate")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne gauche — Infos */}
          <div className="space-y-6">
            {/* Carte infos */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <UserCheck size={16} />
                  {t("info")}
                </h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail size={15} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{t("email")}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{student.user.email}</span>
                </div>
                {student.user.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone size={15} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{t("phone")}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{student.user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap size={15} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{t("gender")}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {student.user.gender === "MALE" ? t("male") : t("female")}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar size={15} className="text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{t("enrolled")}:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDate(student.user.createdAt, L)}
                  </span>
                </div>
                {student.group && (
                  <div className="flex items-center gap-3 text-sm">
                    <BookOpen size={15} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{t("group")}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{student.group.name}</span>
                  </div>
                )}
                {student.teacher?.user && (
                  <div className="flex items-center gap-3 text-sm">
                    <UserCheck size={15} className="text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">{t("teacher")}:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{student.teacher.user.fullName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte parents */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t("parents")}</h2>
              </div>
              <div className="p-4">
                {student.parentLinks?.length > 0 ? (
                  <div className="space-y-3">
                    {student.parentLinks.map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{link.parent.user.fullName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{link.parent.user.email}</p>
                        </div>
                        <span className="text-xs text-gray-400">{t("linkedAt")}: {formatDate(link.createdAt, L)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t("noParents")}</p>
                )}
              </div>
            </div>

            {/* Carte statistiques */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <TrendingUp size={16} />
                  {t("stats")}
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{memorized.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t("totalMemorized")}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inProgress.length}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t("inProgressSurahs")}</p>
                </div>
                <div className="text-center p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{attendanceRate}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t("attendanceRate")}</p>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{student._count?.memorizedSurahs || 0}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{t("totalEvaluations")}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne droite — Progression */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sourates mémorisées */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <BookOpen size={16} />
                  {t("memorizedSurahs")} ({memorized.length})
                </h2>
              </div>
              <div className="p-4">
                {memorized.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {memorized.map((p: any) => (
                      <div key={p.id} className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-emerald-800 dark:text-emerald-300">{p.surah.name}</span>
                          {p.evaluation?.finalScore && (
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{p.evaluation.finalScore}/20</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("date")}: {formatDate(p.updatedAt, L)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t("noMemorized")}</p>
                )}
              </div>
            </div>

            {/* Sourates en cours */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Clock size={16} />
                  {t("inProgressSurahs")} ({inProgress.length})
                </h2>
              </div>
              <div className="p-4">
                {inProgress.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {inProgress.map((p: any) => (
                      <div key={p.id} className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-amber-800 dark:text-amber-300">{p.surah.name}</span>
                          <span className="text-xs px-2 py-1 bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-300 rounded-full">{p.status}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t("date")}: {formatDate(p.updatedAt, L)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">{t("noInProgress")}</p>
                )}
              </div>
            </div>

            {/* Badges */}
            {student.studentBadges?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Award size={16} />
                    {t("badges")} ({student.studentBadges.length})
                  </h2>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-3">
                    {student.studentBadges.map((sb: any) => (
                      <div key={sb.id} className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <span className="text-lg">{sb.badge.icon || "🏆"}</span>
                        <div>
                          <p className="text-sm font-medium text-purple-800 dark:text-purple-300">{sb.badge.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(sb.earnedAt, L)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Étoiles récentes */}
            {student.starsLogs?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Star size={16} />
                    {t("stars")}
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {student.starsLogs.map((log: any) => (
                      <div key={log.id} className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Star size={14} className="text-yellow-500 fill-yellow-500" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{log.reason}</span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(log.createdAt, L)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Présences récentes */}
            {student.attendances?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Calendar size={16} />
                    {t("attendance")} — {t("attendanceRate")}: {attendanceRate}%
                  </h2>
                </div>
                <div className="p-4">
                  <div className="space-y-2">
                    {student.attendances.map((a: any) => (
                      <div key={a.id} className={`flex items-center justify-between p-2 rounded-lg ${
                        a.status === "PRESENT" ? "bg-green-50 dark:bg-green-900/20" :
                        a.status === "LATE" ? "bg-amber-50 dark:bg-amber-900/20" :
                        "bg-red-50 dark:bg-red-900/20"
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            a.status === "PRESENT" ? "bg-green-500" :
                            a.status === "LATE" ? "bg-amber-500" :
                            "bg-red-500"
                          }`} />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {a.status === "PRESENT" ? t("present") : a.status === "LATE" ? t("late") : t("absent")}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(a.date, L)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}