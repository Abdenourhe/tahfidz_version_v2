"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  ChevronRight,
  GraduationCap,
  Star,
  User,
  MessageCircle,
  Phone,
  Mail,
  Flame,
  ClipboardList,
} from "lucide-react"
import { useT, useLanguage } from "@/contexts/LanguageContext"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { cn } from "@/lib/utils"

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { name: string } | null
  teacher: { user: { id: string; fullName: string; phone?: string | null; email: string } } | null
  studentBadges: { id: string; badge: { icon: string; name: string } }[]
  _count: { memorizedSurahs: number }
}

interface DailyLog {
  id: string
  date: string
  attendanceStatus?: string | null
  globalScore?: number | null
  hifzFromSurahId?: number | null
  hifzToSurahId?: number | null
  murajaFromSurahId?: number | null
  murajaToSurahId?: number | null
  talqinFromSurahId?: number | null
  talqinToSurahId?: number | null
  courseBook?: string | null
  courseFromPage?: number | null
  courseToPage?: number | null
  teacherObservation?: string | null
}

interface Props {
  child: Child
  surahs?: Record<number, { nameFr: string; nameAr: string }>
  onContactTeacher: (child: Child) => void
  onSelect?: (child: Child) => void
}

const ATT_CFG: Record<string, { label: string; cls: string }> = {
  PRESENT: { label: "Présent", cls: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800" },
  LATE:    { label: "Retard",  cls: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800" },
  EXCUSED: { label: "Excusé",  cls: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800" },
  ABSENT:  { label: "Absent",  cls: "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800" },
}

function AnimatedNumber({ value }: { value: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      key={value}
      className="tabular-nums"
    >
      {value}
    </motion.span>
  )
}

function HeroContent({ child }: { child: Child }) {
  const t = useT("parentDashboardClient")
  const teacher = child.teacher?.user

  return (
    <>
      {/* Avatar avec anneau animé */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-tahfidz-green to-emerald-400 opacity-75 blur-sm transition-opacity duration-300 group-hover:opacity-100" />
        <div className="relative w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center overflow-hidden ring-2 ring-white/50 dark:ring-white/10">
          <AvatarLightbox
            src={child.user.avatar}
            alt={child.user.fullName}
            fallback={<span className="text-white font-bold text-2xl">{child.user.fullName.charAt(0).toUpperCase()}</span>}
            className="w-full h-full"
            imgClassName="w-full h-full"
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-tahfidz-green transition truncate">
              {child.user.fullName}
            </h3>
            {child.user.fullNameAr && (
              <p className="arabic text-gray-400 text-xs truncate">{child.user.fullNameAr}</p>
            )}
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-tahfidz-green transition flex-shrink-0 mt-0.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-2">
          {child.group?.name && (
            <span className="flex items-center gap-1 text-[10px] bg-tahfidz-green-light/50 dark:bg-tahfidz-green/10 px-2 py-0.5 rounded-full text-tahfidz-green font-semibold">
              <GraduationCap size={9} /> {child.group.name}
            </span>
          )}
          {teacher && (
            <span className="flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
              <User size={9} /> {teacher.fullName}
            </span>
          )}
        </div>

        {/* Stats modernisées */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
            <BookIcon />
            <span className="font-bold text-emerald-600">
              <AnimatedNumber value={child._count.memorizedSurahs} />
            </span>
            <span className="text-gray-400 text-[10px]">{t("memorizedShort")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
            <Flame size={12} className="text-orange-500" />
            <span className="font-bold text-orange-500">
              <AnimatedNumber value={child.currentStreak} />
            </span>
            <span className="text-gray-400 text-[10px]">{t("streakShort")}</span>
          </div>
          <div className="flex items-center gap-1 text-xs bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
            <Star size={12} className="text-tahfidz-gold fill-tahfidz-gold" />
            <span className="font-bold text-gray-700 dark:text-gray-200">
              <AnimatedNumber value={child.totalStars} />
            </span>
          </div>
        </div>

        {/* Badges */}
        {child.studentBadges.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mt-3">
            {child.studentBadges.slice(0, 3).map((sb, idx) => (
              <motion.span
                key={sb.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-[10px] font-medium text-yellow-800 dark:text-yellow-300"
              >
                {sb.badge.icon} {sb.badge.name}
              </motion.span>
            ))}
            {child.studentBadges.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[10px] text-gray-400 font-medium">
                +{child.studentBadges.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </>
  )
}

export function ChildCard({ child, surahs = {}, onContactTeacher, onSelect }: Props) {
  const t = useT("parentDashboardClient")
  const { locale } = useLanguage()
  const teacher = child.teacher?.user

  const [lastLog, setLastLog] = useState<DailyLog | null>(null)

  useEffect(() => {
    fetch(`/api/students/${child.id}/daily-log?recent=true`)
      .then((r) => r.json())
      .then((d) => {
        const logs = d.logs || []
        setLastLog(logs[0] || null)
      })
      .catch((e) => console.error(e))
  }, [child.id])

  const heroClass = "relative flex items-start gap-4 active:scale-[0.98] transition"

  const dateLocale = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR"
  const fmtDate = (dateStr: string) =>
    new Date(`${dateStr}T12:00:00`).toLocaleDateString(dateLocale, { weekday: "short", day: "numeric", month: "short" })

  const surahName = (id?: number | null) => (id && surahs[id] ? surahs[id].nameFr : null)

  const formatRange = (fromId?: number | null, toId?: number | null) => {
    const a = surahName(fromId)
    const b = surahName(toId)
    if (!a && !b) return null
    if (!toId || fromId === toId) return a
    return `${a} → ${b}`
  }

  const hasLogContent = lastLog && (
    lastLog.attendanceStatus ||
    lastLog.globalScore !== null ||
    lastLog.hifzFromSurahId ||
    lastLog.murajaFromSurahId ||
    lastLog.talqinFromSurahId ||
    lastLog.courseBook
  )

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300",
        "bg-gradient-to-br from-white/80 to-white/50 dark:from-gray-900/80 dark:to-gray-900/50",
        "border-white/50 dark:border-white/10",
        "backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-black/20",
        "hover:shadow-xl hover:shadow-tahfidz-green/10 dark:hover:shadow-tahfidz-green/10",
        "hover:border-tahfidz-green/30 dark:hover:border-tahfidz-green/30"
      )}
    >
      {/* Glow décoratif au hover */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-tahfidz-green/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-tahfidz-gold/10 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Hero ligne cliquable */}
      {onSelect ? (
        <button onClick={() => onSelect(child)} className={cn(heroClass, "w-full text-left")}>
          <HeroContent child={child} />
        </button>
      ) : (
        <Link href={`/parent/child/${child.id}`} className={heroClass}>
          <HeroContent child={child} />
        </Link>
      )}

      {/* Dernier carnet de suivi */}
      {hasLogContent && (
        <div className="relative mt-3 pt-3 border-t border-gray-100/60 dark:border-gray-800/60">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 mb-1.5">
            <ClipboardList size={11} />
            <span className="font-semibold">{t("lastDailyLog")}</span>
            <span>·</span>
            <span>{fmtDate(lastLog!.date)}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {lastLog!.attendanceStatus && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-bold", ATT_CFG[lastLog!.attendanceStatus]?.cls ?? "bg-gray-100 text-gray-600")}>
                {ATT_CFG[lastLog!.attendanceStatus]?.label ?? lastLog!.attendanceStatus}
              </span>
            )}
            {lastLog!.globalScore !== null && lastLog!.globalScore !== undefined && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-tahfidz-green-light text-tahfidz-green font-bold">
                {lastLog!.globalScore}/20
              </span>
            )}
            {formatRange(lastLog!.hifzFromSurahId, lastLog!.hifzToSurahId) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800">
                H: {formatRange(lastLog!.hifzFromSurahId, lastLog!.hifzToSurahId)}
              </span>
            )}
            {formatRange(lastLog!.murajaFromSurahId, lastLog!.murajaToSurahId) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800">
                M: {formatRange(lastLog!.murajaFromSurahId, lastLog!.murajaToSurahId)}
              </span>
            )}
            {formatRange(lastLog!.talqinFromSurahId, lastLog!.talqinToSurahId) && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
                T: {formatRange(lastLog!.talqinFromSurahId, lastLog!.talqinToSurahId)}
              </span>
            )}
            {lastLog!.courseBook && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800">
                C: {lastLog!.courseBook} {lastLog!.courseFromPage}{lastLog!.courseToPage && lastLog!.courseToPage !== lastLog!.courseFromPage ? `→${lastLog!.courseToPage}` : ""}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions rapides modernisées */}
      {teacher && (
        <div className="relative grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100/60 dark:border-gray-800/60">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onContactTeacher(child)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-2 rounded-xl bg-tahfidz-green text-white text-[10px] font-bold hover:opacity-90 transition shadow-sm shadow-tahfidz-green/20"
          >
            <MessageCircle size={13} />
            <span className="hidden sm:inline">{t("contactTeacher")}</span>
          </motion.button>
          <a
            href={teacher.phone ? `tel:${teacher.phone}` : undefined}
            onClick={(e) => { if (!teacher.phone) e.preventDefault() }}
            className={cn(
              "flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-2 rounded-xl text-[10px] font-bold transition active:scale-95",
              teacher.phone
                ? "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                : "bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-400 cursor-not-allowed"
            )}
          >
            <Phone size={13} />
            <span className="hidden sm:inline">{t("call")}</span>
          </a>
          <a
            href={`mailto:${teacher.email}`}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-[10px] font-bold hover:bg-gray-50 transition active:scale-95"
          >
            <Mail size={13} />
            <span className="hidden sm:inline">{t("email")}</span>
          </a>
        </div>
      )}
    </div>
  )
}

function BookIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-emerald-600">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  )
}
