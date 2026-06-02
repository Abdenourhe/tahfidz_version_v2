"use client"
// src/components/student/StudentDashboardClient.tsx

import Link from "next/link"
import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { ReadyToReciteButton } from "@/components/student/ReadyToReciteButton"
import { FeedbackModal } from "@/components/shared/FeedbackModal"
import { Bug, Megaphone } from "lucide-react"
import { UpcomingHalaqaWidget } from "@/components/student/dashboard/UpcomingHalaqaWidget"
import { MiniCalendarWidget } from "@/components/student/dashboard/MiniCalendarWidget"
import { DailyTasksWidget } from "@/components/student/dashboard/DailyTasksWidget"
import { GroupLeaderboardWidget } from "@/components/student/dashboard/GroupLeaderboardWidget"
import { SessionNotesWidget } from "@/components/student/dashboard/SessionNotesWidget"
import { QuickActionsWidget } from "@/components/student/dashboard/QuickActionsWidget"

interface Progress {
  id: string
  status: string
  surahId: number | string
  completionPercentage: number
  currentVerse: number
  surah: { nameFr: string; nameAr: string; verseCount: number }
}

interface Badge { id: string; badge: { icon: string; name: string } }

interface Attendance {
  id: string
  status: string
  date: Date
}

interface Announcement {
  id: string
  title: string
  titleAr: string | null
  content: string
  isPinned: boolean
  author: { fullName: string }
}

interface HalaqaSession {
  id: string
  meetingName: string
  status: string
  scheduledAt: string
  teacher?: { fullName: string } | null
}

interface LeaderboardPeer {
  userId: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; avatar?: string | null }
}

interface Evaluation {
  id: string
  sourah: string | null
  notes: string | null
  tajweedScore: number | null
  memorizationScore: number | null
  fluencyScore: number | null
  session: { meetingName: string; scheduledAt: Date } | null
}

interface Props {
  studentId: string
  studentName: string
  studentNameAr: string | null
  groupName: string | null
  teacherName: string | null
  totalStars: number
  currentStreak: number
  memorizedCount: number
  badgeCount: number
  inProgress: Progress[]
  badges: Badge[]
  recentAttendance: Attendance[]
  announcements: Announcement[]
  upcomingHalaqa: HalaqaSession | null
  monthAttendances: Attendance[]
  groupLeaderboard: LeaderboardPeer[]
  recentEvaluations: Evaluation[]
}

function statusBadge(status: string, locale: string) {
  const map: Record<string, { label: Record<string, string>; bg: string; color: string }> = {
    IN_PROGRESS:              { label: { fr: "En cours",       en: "In progress",    ar: "جارٍ" },           bg: "bg-blue-100",   color: "text-blue-700" },
    READY_FOR_RECITATION:     { label: { fr: "Prêt à réciter", en: "Ready to recite",ar: "جاهز للتسميع" },   bg: "bg-orange-100", color: "text-orange-700" },
    UNDER_REVIEW:             { label: { fr: "En révision",    en: "Under review",   ar: "قيد المراجعة" },   bg: "bg-purple-100", color: "text-purple-700" },
  }
  const entry = map[status] ?? { label: { fr: status, en: status, ar: status }, bg: "bg-gray-100", color: "text-gray-600" }
  const l = locale as "fr" | "en" | "ar"
  return { label: entry.label[l] ?? entry.label.fr, bg: entry.bg, color: entry.color }
}

function attIcon(status: string) {
  return status === "PRESENT" ? "✓" : status === "LATE" ? "~" : status === "EXCUSED" ? "E" : "✗"
}
function attColor(status: string) {
  return status === "PRESENT" ? "bg-green-100 text-green-700"
    : status === "LATE" ? "bg-yellow-100 text-yellow-700"
    : status === "EXCUSED" ? "bg-blue-100 text-blue-700"
    : "bg-red-100 text-red-500"
}

// ✅ AJOUTÉ : Fonction formatAttDate dans le Client Component
function formatAttDate(d: Date | string, t: (k: string) => string): string {
  const date = typeof d === "string" ? new Date(d) : d
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) return t("today")
  if (days === 1) return t("yesterday")
  if (days < 7) return t("daysAgo").replace("{{count}}", String(days))

  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export function StudentDashboardClient({
  studentId,
  studentName,
  studentNameAr,
  groupName,
  teacherName,
  totalStars,
  currentStreak,
  memorizedCount,
  badgeCount,
  inProgress,
  badges,
  recentAttendance,
  announcements,
  upcomingHalaqa,
  monthAttendances,
  groupLeaderboard,
  recentEvaluations,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false)
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("studentDashboardClient")

  const initials = (studentName || "").split(" ").filter(Boolean).map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* En-tête */}
      <motion.div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-lg">{initials}</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("welcome")}</h1>
            {studentNameAr && <p className="arabic text-gray-500 text-sm">{studentNameAr}</p>}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {groupName ?? t("noGroup")} · {teacherName ? `${t("prof")} ${teacherName}` : t("noTeacher")}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-tahfidz-gold">⭐ {totalStars}</div>
            <div className="text-xs text-gray-400">{t("stars")}</div>
          </div>
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium hover:bg-red-100 transition"
            title={t("report")}
          >
            <Bug size={14} />
            <span className="hidden sm:inline">{t("report")}</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-tahfidz-green">{memorizedCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t("memorized")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">🔥 {currentStreak}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t("daysStreak")}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{badgeCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{t("badges")}</div>
          </div>
        </div>
      </motion.div>

      {/* Widgets row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div className="md:col-span-2 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}>
          <UpcomingHalaqaWidget halaqa={upcomingHalaqa} />
          <DailyTasksWidget inProgress={inProgress} hasUpcomingHalaqa={!!upcomingHalaqa} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}>
          <MiniCalendarWidget attendances={monthAttendances} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div className="md:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}>
          <GroupLeaderboardWidget peers={groupLeaderboard} currentUserId={studentId} />
        </motion.div>
        <motion.div className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}>
          {/* Annonces */}
          {announcements.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mb-3 flex items-center gap-2">
                <Megaphone size={16} className="text-tahfidz-green" />
                {t("announcements")}
              </h2>
              <div className="space-y-2">
                {announcements.slice(0, 3).map((ann) => (
                  <div key={ann.id} className={`p-3 rounded-lg border text-sm ${ann.isPinned ? "border-tahfidz-green bg-tahfidz-green-light/20 dark:bg-emerald-900/20" : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"}`}>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{ann.title}</p>
                    {ann.titleAr && <p className="arabic text-xs text-gray-500 mt-0.5">{ann.titleAr}</p>}
                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ann.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <SessionNotesWidget evaluations={recentEvaluations} />
          <QuickActionsWidget teacherName={teacherName} />
        </motion.div>
      </div>

      {/* Progression */}
      <motion.div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("inProgress")}</h2>
          <Link href="/student/progress" className="text-xs text-tahfidz-green hover:underline">{t("seeAll")}</Link>
        </div>
        {inProgress.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-2xl mb-2">📖</p>
            <p className="text-sm text-gray-400">{t("noProgress")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inProgress.slice(0, 3).map((prog) => {
              const sl = statusBadge(prog.status, L)
              return (
                <div key={prog.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                      <p className="arabic text-sm text-tahfidz-green">{prog.surah.nameAr}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                      {prog.status === "IN_PROGRESS" && (
                        <ReadyToReciteButton progressId={prog.id} studentId={studentId} surahId={Number(prog.surahId)} />
                      )}
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">{t("verse")} {prog.currentVerse}/{prog.surah.verseCount}</span>
                    <span className="text-xs text-tahfidz-green font-medium">{Math.round(prog.completionPercentage)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Badges */}
        <motion.div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("myBadges")}</h2>
            <Link href="/student/badges" className="text-xs text-tahfidz-green hover:underline">{t("seeAll")}</Link>
          </div>
          {badges.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t("noBadge")}</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {badges.map((sb) => (
                <div key={sb.id} className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="text-2xl mb-1">{sb.badge.icon}</div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{sb.badge.name}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Présences */}
        <motion.div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">{t("recentAtt")}</h2>
            <Link href="/student/attendance" className="text-xs text-tahfidz-green hover:underline">{t("seeAll")}</Link>
          </div>
          <div className="flex gap-2">
            {recentAttendance.length === 0 ? (
              <p className="text-sm text-gray-400">{t("noAtt")}</p>
            ) : (
              recentAttendance.map(att => (
                <div key={att.id} className="flex-1 text-center">
                  <div className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center text-xs font-bold ${attColor(att.status)}`}>
                    {attIcon(att.status)}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatAttDate(att.date, t)}</p>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>


      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="STUDENT"
        userName={studentName}
        userEmail="" /* passer l'email si dispo dans les props */
        schoolName={undefined}
      />
    </motion.div>
  )
}