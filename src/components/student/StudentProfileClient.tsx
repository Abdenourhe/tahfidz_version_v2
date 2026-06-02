"use client"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"

import { formatDate, getStatusStyle } from "@/lib/utils"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileAccordion } from "@/components/profile/ProfileAccordion"
import { AnimatedCounter } from "@/components/profile/AnimatedCounter"
import {
  Star, BookOpen, Award, Flame, TrendingUp, Mail, Phone, GraduationCap, UserCircle,
  CalendarCheck
} from "lucide-react"

interface Props {
  student: {
    user: {
      fullName: string
      fullNameAr: string | null
      email: string
      phone: string | null
      gender: string | null
      avatar: string | null
      createdAt: Date
      lastLoginAt: Date | null
    }
    group: { name: string; nameAr: string | null; level: string } | null
    teacher: { user: { fullName: string } } | null
    totalStars: number
    currentStreak: number
    longestStreak: number
    stats: {
      totalSurahsMemorized: number
      totalVersesMemorized: number
      averageScore: number
      attendanceRate: number
    } | null
    memorizationProgress: {
      id: string
      status: string
      completionPercentage: number
      currentVerse: number
      surah: { nameFr: string; nameAr: string; verseCount: number }
    }[]
    studentBadges: { badge: { name: string; icon: string; rarity: string } }[]
    attendances: { status: string; date: Date }[]
    _count: {
      memorizedSurahs: number
      studentBadges: number
      memorizationProgress: number
    }
  }
  schoolName?: string
  schoolCity?: string
}

const ATT_STYLE: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  LATE: "bg-yellow-100 text-yellow-700",
  EXCUSED: "bg-blue-100 text-blue-700",
  ABSENT: "bg-red-100 text-red-500",
}
const ATT_ICON: Record<string, string> = { PRESENT: "✓", LATE: "~", EXCUSED: "E", ABSENT: "✗" }

export function StudentProfileClient({ student, schoolName, schoolCity }: Props) {
  const t = useT("studentProfileClient")
  const tc = useT("profileCommon")
  const ts = useT("memorizationStatus")

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <ProfileHeader
        name={student.user.fullName}
        nameAr={student.user.fullNameAr}
        role={t("student")}
        avatarLetter={student.user.fullName.charAt(0)}
        avatar={student.user.avatar || undefined}
        avatarColor="bg-blue-600"
        roleColor="bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Mail size={13} /> {student.user.email}</span>
          {student.user.phone && <span className="flex items-center gap-1"><Phone size={13} /> {student.user.phone}</span>}
          <span>· {genderLabel(student.user.gender)}</span>
          <span>· {t("memberSince")} {formatDate(student.user.createdAt, { month: "short", year: "numeric" })}</span>
          {schoolName && (
            <span>· {schoolName}{schoolCity ? `, ${schoolCity}` : ""}</span>
          )}
        </div>
        {student.group && (
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1 text-tahfidz-green"><BookOpen size={13} /> {student.group.name}</span>
            {student.teacher && (
              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400"><GraduationCap size={13} /> {student.teacher.user.fullName}</span>
            )}
          </div>
        )}
      </ProfileHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Star} label={t("stars")} value={student.totalStars} prefix="⭐" colorClass="text-tahfidz-gold" delay={0.1} />
        <StatCard icon={BookOpen} label={t("memorized")} value={student._count.memorizedSurahs} colorClass="text-tahfidz-green" delay={0.2} />
        <StatCard icon={Award} label={t("badges")} value={student._count.studentBadges} colorClass="text-purple-600" delay={0.3} />
        <StatCard icon={Flame} label={t("streak")} value={student.currentStreak} suffix="j" colorClass="text-orange-600" delay={0.4} />
      </div>

      {student.stats && (
        <ProfileAccordion title={t("progress")} icon={TrendingUp} defaultOpen delay={0.5}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-tahfidz-green"><AnimatedCounter value={student.stats.totalSurahsMemorized} /></p>
              <p className="text-xs text-gray-500">{t("memorized")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-blue-600"><AnimatedCounter value={student.stats.totalVersesMemorized} /></p>
              <p className="text-xs text-gray-500">{t("progress")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-tahfidz-gold"><AnimatedCounter value={Math.round(student.stats.averageScore)} suffix="/100" /></p>
              <p className="text-xs text-gray-500">{t("avgScore")}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-purple-600"><AnimatedCounter value={Math.round(student.stats.attendanceRate)} suffix="%" /></p>
              <p className="text-xs text-gray-500">{t("attendance")}</p>
            </div>
          </div>
        </ProfileAccordion>
      )}

      <ProfileAccordion title={t("activeMemorization")} icon={BookOpen} delay={0.6}>
        {student.memorizationProgress.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noActive")}</p>
        ) : (
          <div className="space-y-3">
            {student.memorizationProgress.map((prog) => {
              const sl = getStatusStyle(prog.status)
              return (
                <div key={prog.id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</span>
                      <span className="arabic text-sm text-tahfidz-green">{prog.surah.nameAr}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{ts(prog.status) || prog.status}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-1">
                    <span>{t("verse")} {prog.currentVerse} / {prog.surah.verseCount}</span>
                    <span className="font-bold text-tahfidz-green">{Math.round(prog.completionPercentage)}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-tahfidz-green rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${prog.completionPercentage}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ProfileAccordion>

      <ProfileAccordion title={t("recentBadges")} icon={Award} delay={0.7}>
        {student.studentBadges.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noBadge")}</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {student.studentBadges.map((sb, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2"
                title={sb.badge.name}
              >
                <span className="text-2xl">{sb.badge.icon}</span>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{sb.badge.name}</span>
              </motion.div>
            ))}
          </div>
        )}
      </ProfileAccordion>

      <ProfileAccordion title={t("attendance")} icon={CalendarCheck} delay={0.8}>
        {student.attendances.length === 0 ? (
          <p className="text-sm text-gray-400">{tc("notProvided")}</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {student.attendances.map((att, i) => (
              <div
                key={i}
                title={formatDate(att.date, { weekday: "short", day: "numeric", month: "short" })}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${ATT_STYLE[att.status] ?? "bg-gray-100"}`}
              >
                {ATT_ICON[att.status] ?? "?"}
              </div>
            ))}
          </div>
        )}
      </ProfileAccordion>
    </motion.div>
  )
}
