"use client"
// src/components/teacher/TeacherStudentDetailClient.tsx

import { useState } from "react"
import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { ArrowLeft, Star, BookOpen, CalendarCheck, ClipboardList, NotebookPen, Globe, Languages } from "lucide-react"
import { formatDate, statusLabel, scoreToGrade, formatAge } from "@/lib/utils"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { TeacherDailyLogModal } from "@/components/teacher/TeacherDailyLogModal"

interface Props {
  student: any
  memorized: any[]
  inProgress: any[]
  readyToRecite: any
  totalAtt: number
  presentAtt: number
  attRate: number
}

export function TeacherStudentDetailClient({
  student, memorized, inProgress, readyToRecite, totalAtt, presentAtt, attRate,
}: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("teacherStudentDetailClient")
  const [showLogModal, setShowLogModal] = useState(false)

  const ATT_STYLE: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    LATE:    "bg-yellow-100 text-yellow-700",
    EXCUSED: "bg-blue-100 text-blue-700",
    ABSENT:  "bg-red-100 text-red-500",
  }
  const ATT_ICON: Record<string, string> = { PRESENT: "✓", LATE: "~", EXCUSED: "E", ABSENT: "✗" }

  const relationLabel = (rel: string) => {
    if (rel === "father") return t("father")
    if (rel === "mother") return t("mother")
    return t("guardian")
  }

  const nationalityLabel = (code?: string | null) => {
    if (!code) return ""
    const map: Record<string, Record<string, string>> = {
      fr: { DZ: "Algérien(ne)", MA: "Marocain(e)", TN: "Tunisien(ne)", EG: "Égyptien(ne)", SA: "Saoudien(ne)", AE: "Émirien(ne)", QA: "Qatari(e)", KW: "Koweïtien(ne)", LB: "Libanais(e)", SY: "Syrien(ne)", IQ: "Irakien(ne)", JO: "Jordanien(ne)", PS: "Palestinien(ne)", SD: "Soudanais(e)", LY: "Libyen(ne)", MR: "Mauritanien(ne)", SO: "Somalien(ne)", TR: "Turc/Turque", CA: "Canadien(ne)", OTHER: "Autre" },
      en: { DZ: "Algerian", MA: "Moroccan", TN: "Tunisian", EG: "Egyptian", SA: "Saudi", AE: "Emirati", QA: "Qatari", KW: "Kuwaiti", LB: "Lebanese", SY: "Syrian", IQ: "Iraqi", JO: "Jordanian", PS: "Palestinian", SD: "Sudanese", LY: "Libyan", MR: "Mauritanian", SO: "Somali", TR: "Turkish", CA: "Canadian", OTHER: "Other" },
      ar: { DZ: "جزائري(ة)", MA: "مغربي(ة)", TN: "تونسي(ة)", EG: "مصري(ة)", SA: "سعودي(ة)", AE: "إماراتي(ة)", QA: "قطري(ة)", KW: "كويتي(ة)", LB: "لبناني(ة)", SY: "سوري(ة)", IQ: "عراقي(ة)", JO: "أردني(ة)", PS: "فلسطيني(ة)", SD: "سوداني(ة)", LY: "ليبي(ة)", MR: "موريتاني(ة)", SO: "صومالي(ة)", TR: "تركي(ة)", CA: "كندي(ة)", OTHER: "أخرى" },
    }
    return map[L]?.[code] ?? code
  }

  const languageLabel = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      fr: { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" },
      en: { ar: "Arabic", fr: "French", en: "English", other: "Other" },
      ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية", other: "أخرى" },
    }
    return map[L]?.[key] ?? key
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/teacher/students" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{student.user.fullName}</h1>
          {student.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{student.user.fullNameAr}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
          >
            <NotebookPen size={16} /> {t("dailyLog")}
          </button>
          {readyToRecite && (
            <Link href={`/teacher/evaluation/new?progressId=${readyToRecite.id}&studentId=${student.id}`}
              className="px-4 py-2 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
              {t("evaluateNow")} →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-2xl gradient-tahfidz flex items-center justify-center mb-3 overflow-hidden">
                <AvatarLightbox
                  src={student.user.avatar}
                  alt={student.user.fullName}
                  fallback={<span className="text-white font-bold text-xl">{student.user.fullName.charAt(0)}</span>}
                  className="w-full h-full"
                  imgClassName="w-full h-full"
                />
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{student.user.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{student.user.email}</p>
            </div>
            <div className="space-y-2 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("group")}</span><span className="font-medium text-gray-700 dark:text-gray-300">{student.group?.name ?? "—"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("age")}</span><span className="font-medium text-gray-700 dark:text-gray-300">{formatAge(student.dateOfBirth)}</span></div>
              {student.user.phone && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("phone")}</span><span className="font-medium text-gray-700 dark:text-gray-300">{student.user.phone}</span></div>}
              {student.emergencyPhone && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">{t("emergencyPhone") || "Urgence"}</span><span className="font-medium text-gray-700 dark:text-gray-300">{student.emergencyPhone}</span></div>}

            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 grid grid-cols-2 gap-3">
            {[
              { icon: Star, label: t("stars"), value: student.totalStars, color: "text-tahfidz-gold" },
              { icon: BookOpen, label: t("memorized2"), value: memorized.length, color: "text-tahfidz-green" },
              { icon: CalendarCheck, label: `${t("attendance")} ${attRate}%`, value: `${presentAtt}/${totalAtt}`, color: "text-blue-600" },
              { icon: ClipboardList, label: t("badges"), value: student.studentBadges.length, color: "text-purple-600" },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <s.icon size={16} className={`${s.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {student.attendances.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t("recentAtt")}</p>
              <div className="flex flex-wrap gap-1.5">
                {student.attendances.map((att: any, i: number) => (
                  <div key={i} title={formatDate(att.date, { weekday: "long", day: "numeric", month: "short" })}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${ATT_STYLE[att.status] ?? "bg-gray-100"}`}>
                    {ATT_ICON[att.status] ?? "?"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {student.parentLinks.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-orange-100 dark:border-orange-800 p-4">
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-300 mb-3">👨‍👩‍👦 {t("contacts")}</p>
              <div className="space-y-3">
                {student.parentLinks.map((link: any) => (
                  <div key={link.id} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{link.parent.user.fullName}</p>
                      <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                        {relationLabel(link.relation)}
                      </span>
                    </div>
                    {link.parent.user.fullNameAr && (
                      <p className="arabic text-xs text-gray-400 mb-1">{link.parent.user.fullNameAr}</p>
                    )}
                    <div className="space-y-1">
                      {link.parent.user.phone && (
                        <a href={`tel:${link.parent.user.phone}`} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                          📱 {link.parent.user.phone}
                        </a>
                      )}
                      <a href={`mailto:${link.parent.user.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        ✉️ {link.parent.user.email}
                      </a>
                      {link.parent.nationality && (
                        <p className="text-xs text-gray-500">🌍 {link.parent.nationality}</p>
                      )}
                      {link.parent.spokenLanguages && (
                        <p className="text-xs text-gray-500">🗣️ {link.parent.spokenLanguages}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("inProgress2")} ({inProgress.length})</h3>
            {inProgress.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("noProgress")}</p>
            ) : (
              <div className="space-y-3">
                {inProgress.map((prog: any) => {
                  const sl = statusLabel(prog.status)
                  const isReady = ["READY_FOR_RECITATION", "PENDING_TEACHER_APPROVAL"].includes(prog.status)
                  return (
                    <div key={prog.id} className={`p-4 rounded-xl border ${isReady ? "border-orange-200 bg-orange-50 dark:bg-orange-900/20" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</span>
                          <span className="arabic text-sm text-tahfidz-green">{prog.surah.nameAr}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                        </div>
                        {isReady && (
                          <Link href={`/teacher/evaluation/new?progressId=${prog.id}&studentId=${student.id}`}
                            className="text-xs px-3 py-1.5 bg-tahfidz-green text-white rounded-lg hover:opacity-90 font-medium">
                            {t("evaluate")}
                          </Link>
                        )}
                      </div>
                      <div className="progress-bar mb-1">
                        <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{prog.surah.verseCount} {t("verse")}</span>
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
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("memorized3")} ({memorized.length}) ✓</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {memorized.map((prog: any) => {
                  const grade = prog.evaluation ? scoreToGrade(prog.evaluation.finalScore) : null
                  return (
                    <div key={prog.id} className="flex items-center gap-3 p-2.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                      <span className="text-tahfidz-green text-base">✓</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                        <p className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</p>
                      </div>
                      {grade && <span className={`text-xs font-bold flex-shrink-0 ${grade.color}`}>{prog.evaluation.finalScore}/100</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showLogModal && (
        <TeacherDailyLogModal
          studentId={student.id}
          studentName={student.user.fullName}
          onClose={() => setShowLogModal(false)}
        />
      )}
    </div>
  )
}