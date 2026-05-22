"use client"
// src/components/parent/ParentProfileClient.tsx

import { useState } from "react"
import Link from "next/link"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { ParentProfileAttendance } from "@/components/parent/ParentProfileAttendance"
import {
  Phone, Mail, Link2, BookOpen, Star, CalendarCheck, GraduationCap,
  TrendingUp, Award, MessageSquare, User, ArrowRight, Bug
} from "lucide-react"
import { FeedbackModal } from "@/components/shared/FeedbackModal"

interface ChildLink {
  id: string
  relation: string
  student: {
    id: string
    totalStars: number
    currentStreak: number
    dateOfBirth: Date | null
    user: { fullName: string; fullNameAr: string | null }
    group: { name: string } | null
    teacher: { user: { fullName: string; phone: string | null; email: string } } | null
    memorizationProgress: {
      id: string
      status: string
      completionPercentage: number
      surah: { nameFr: string; nameAr: string; verseCount: number }
    }[]
    studentBadges: { id: string; badge: { icon: string; name: string; rarity: string } }[]
    attendances: { status: string; date: Date }[]
    _count: { memorizedSurahs: number; studentBadges: number }
  }
}

interface Props {
  parent: {
    user: {
      fullName: string
      fullNameAr: string | null
      email: string
      phone: string | null
      createdAt: Date
    }
    childrenLinks: ChildLink[]
  }
  totalChildren: number
  totalMemorized: number
  totalStars: number
  totalBadges: number
  formatDate: (d: Date, opts?: Intl.DateTimeFormatOptions) => string
  formatAge: (dob: Date | null) => string
  statusLabel: (status: string) => { label: string; bg: string; color: string }
}

const RELATION_LABELS: Record<string, { fr: string; en: string; ar: string }> = {
  father:   { fr: "Père",   en: "Father",   ar: "أب" },
  mother:   { fr: "Mère",   en: "Mother",   ar: "أم" },
  guardian: { fr: "Tuteur", en: "Guardian", ar: "ولي" },
}

const ATT_STYLE: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE:    "bg-yellow-100 text-yellow-700",
  EXCUSED: "bg-blue-100 text-blue-700",
  ABSENT:  "bg-red-100 text-red-500",
}
const ATT_ICON: Record<string, string> = { PRESENT: "✓", LATE: "~", EXCUSED: "E", ABSENT: "✗" }

export function ParentProfileClient({
  parent, totalChildren, totalMemorized, totalStars, totalBadges,
  formatDate, formatAge, statusLabel,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false)

  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("parentProfileClient")

  const relationLabel = (rel: string) => RELATION_LABELS[rel]?.[L] ?? rel

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("welcome")}, {parent.user.fullName}</p>
      </div>

      {/* Bandeau infos parent + stats */}
      <div className="bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-orange-900/10 dark:via-gray-900 dark:to-amber-900/10 rounded-2xl border border-orange-100 dark:border-orange-800 p-6">
        <div className="flex items-center gap-5 flex-wrap">
          <div className="w-20 h-20 rounded-2xl bg-orange-500 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-3xl">{parent.user.fullName.charAt(0)}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-gray-900 dark:text-gray-100 text-xl">{parent.user.fullName}</h2>
              <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full font-medium">{t("parent")}</span>
            </div>
            {parent.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-base mt-0.5">{parent.user.fullNameAr}</p>}

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <a href={`mailto:${parent.user.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition">
                <Mail size={13} className="text-orange-400" />{parent.user.email}
              </a>
              {parent.user.phone && (
                <a href={`tel:${parent.user.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition">
                  <Phone size={13} className="text-orange-400" />{parent.user.phone}
                </a>
              )}
              <span className="text-sm text-gray-400">
                · {t("memberSince")} {formatDate(parent.user.createdAt, { month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            {[
              { v: totalChildren,  l: t("children"),     c: "text-orange-600" },
              { v: totalMemorized, l: t("memorized"),  c: "text-tahfidz-green" },
              { v: totalStars,     l: t("stars"),        c: "text-tahfidz-gold", prefix: "⭐" },
              { v: totalBadges,    l: t("badges"),       c: "text-purple-600" },
            ].map(s => (
              <div key={s.l} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 px-4 py-2.5 text-center">
                <p className={`text-xl font-bold ${s.c}`}>{s.prefix}{s.v}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium hover:bg-red-100 transition"
            title={L === "ar" ? "الإبلاغ عن مشكلة" : L === "en" ? "Report issue" : "Signaler un problème"}
          >
            <Bug size={14} />
            <span className="hidden sm:inline">{L === "ar" ? "إبلاغ" : L === "en" ? "Report" : "Signaler"}</span>
          </button>
        </div>
      </div>

      {/* Aucun enfant lié */}
      {totalChildren === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-800 p-12 text-center">
          <div className="text-6xl mb-3">👨‍👩‍👦</div>
          <p className="font-semibold text-gray-700 dark:text-gray-200 text-lg mb-1">{t("noChild")}</p>
          <p className="text-sm text-gray-400 mb-5">{t("linkChild")}</p>
          <Link href="/parent/link"
            className="inline-flex items-center gap-2 px-6 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
            <Link2 size={16} /> {t("link")}
          </Link>
        </div>
      ) : (
        <>
          {/* Cartes des enfants */}
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <User size={17} className="text-orange-500" /> {t("myChildren")} ({totalChildren})
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {parent.childrenLinks.map(link => {
                const s = link.student
                const present = s.attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length
                const rate = s.attendances.length > 0 ? Math.round((present / s.attendances.length) * 100) : 0

                return (
                  <div key={link.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition">
                    <Link href={`/parent/child/${s.id}`}
                      className="flex items-center gap-3 p-5 bg-gradient-to-r from-tahfidz-green-light/40 to-transparent dark:from-emerald-900/20 border-b border-gray-100 dark:border-gray-700 hover:from-tahfidz-green-light/70 transition group">
                      <div className="w-14 h-14 rounded-2xl gradient-tahfidz flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                        <span className="text-white font-bold text-xl">{s.user.fullName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-tahfidz-green transition">{s.user.fullName}</p>
                          {(() => {
                            const ageStr = formatAge(s.dateOfBirth)
                            return ageStr !== "—" ? <span className="text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">{ageStr}</span> : null
                          })()}
                          <span className="text-xs bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                            {relationLabel(link.relation)}
                          </span>
                          <span className="text-xs text-tahfidz-green opacity-0 group-hover:opacity-100 transition font-medium ml-auto">
                            {t("viewProfile")} →
                          </span>
                        </div>
                        {s.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-sm">{s.user.fullNameAr}</p>}
                        {s.group && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <BookOpen size={11}/>{s.group.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl font-bold text-tahfidz-gold">⭐{s.totalStars}</p>
                        <p className="text-xs text-gray-400">{s._count.memorizedSurahs} {t("memorized").toLowerCase()}</p>
                      </div>
                    </Link>

                    <div className="p-5 space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <TrendingUp size={12} className="text-tahfidz-green"/>{t("progress")}
                          </p>
                          <span className="text-xs text-gray-400">{s.memorizationProgress.length} {t("inProgress")}</span>
                        </div>
                        {s.memorizationProgress.length === 0 ? (
                          <p className="text-xs text-gray-300 italic py-1">{t("noActive")}</p>
                        ) : (
                          <div className="space-y-2.5">
                            {s.memorizationProgress.map(prog => {
                              const sl = statusLabel(prog.status)
                              return (
                                <div key={prog.id}>
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{prog.surah.nameFr}</span>
                                      <span className="arabic text-xs text-tahfidz-green flex-shrink-0">{prog.surah.nameAr}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                                      <span className="text-xs font-bold text-tahfidz-green w-9 text-right">{Math.round(prog.completionPercentage)}%</span>
                                    </div>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${prog.completionPercentage}%` }}/>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      <div className="border-t border-gray-50 dark:border-gray-800 pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <CalendarCheck size={12} className="text-blue-500"/>{t("attendance7")}
                          </p>
                          <span className={`text-xs font-bold ${rate >= 80 ? "text-tahfidz-green" : rate >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                            {rate}%
                          </span>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          {s.attendances.length === 0 ? (
                            <p className="text-xs text-gray-300 italic">{t("noData")}</p>
                          ) : s.attendances.map((att, i) => (
                            <div key={i} title={formatDate(att.date, { weekday: "long", day: "numeric", month: "short" })}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${ATT_STYLE[att.status] ?? "bg-gray-100"}`}>
                              {ATT_ICON[att.status] ?? "?"}
                            </div>
                          ))}
                        </div>
                      </div>

                      {s.studentBadges.length > 0 && (
                        <div className="border-t border-gray-50 dark:border-gray-800 pt-4">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 flex items-center gap-1 mb-2">
                            <Award size={12} className="text-purple-500"/>{t("recentBadges")}
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            {s.studentBadges.map((sb, i) => (
                              <div key={i} title={sb.badge.name} className="text-2xl cursor-help">{sb.badge.icon}</div>
                            ))}
                          </div>
                        </div>
                      )}

                      {s.teacher && (
                        <div className="border-t border-gray-50 dark:border-gray-800 pt-4 bg-blue-50/30 dark:bg-blue-900/10 -mx-5 -mb-5 px-5 py-4">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1 mb-2">
                            <GraduationCap size={12}/>{t("teacher")} : {s.teacher.user.fullName}
                          </p>
                          <div className="flex items-center gap-3 flex-wrap">
                            {s.teacher.user.phone && (
                              <a href={`tel:${s.teacher.user.phone}`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                <Phone size={11}/>{s.teacher.user.phone}
                              </a>
                            )}
                            {s.teacher.user.email && (
                              <a href={`mailto:${s.teacher.user.email}`} className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                <Mail size={11}/>{s.teacher.user.email}
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Marquer présences */}
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
              <CalendarCheck size={17} className="text-tahfidz-green"/>{t("markAttendance")}
            </h2>
            <ParentProfileAttendance children={parent.childrenLinks as any} />
          </div>
        </>
      )}
      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="PARENT"
        userName={parent.user.fullName}
        userEmail={parent.user.email}
        schoolName={undefined}
      />
    </div>
  )
}