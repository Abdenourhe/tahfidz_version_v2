// src/components/halaqa/HalaqaCalendarView.tsx
// Vue unique "Semaine" : agenda vertical intelligent des séances Halaqa

"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  meetingName: string
  status: string
  scheduledAt: string | Date
  duration?: number | null
  teacher?: { id?: string; fullName?: string | null } | null
  group?: { id?: string; name?: string | null } | null
}

interface HalaqaCalendarViewProps {
  sessions: Session[]
  locale: string
  isRTL?: boolean
  onSessionClick?: (session: Session) => void
}

const statusDotColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  LIVE: "bg-red-500",
  ENDED: "bg-gray-400",
  CANCELLED: "bg-orange-400",
}

const dotPalette = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-violet-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-fuchsia-500",
  "bg-lime-500",
  "bg-indigo-500",
]

function hashToIndex(str: string, length: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % length
}

function getSessionDotColor(session: Session, colorBy: "status" | "teacher" | "group"): string {
  if (colorBy === "status") return statusDotColors[session.status] || statusDotColors.SCHEDULED
  const key = colorBy === "teacher" ? session.teacher?.id : session.group?.id
  if (!key) return statusDotColors[session.status] || statusDotColors.SCHEDULED
  return dotPalette[hashToIndex(key, dotPalette.length)]
}

export default function HalaqaCalendarView({ sessions, locale, isRTL, onSessionClick }: HalaqaCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [colorBy, setColorBy] = useState<"status" | "teacher" | "group">("status")
  const [now, setNow] = useState(new Date())
  const [initialScrollDone, setInitialScrollDone] = useState(false)
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!initialScrollDone) {
      const key = dateKey(now)
      const el = dayRefs.current[key]
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        setInitialScrollDone(true)
      }
    }
  }, [currentDate, initialScrollDone, now])

  const parsedSessions = useMemo(() => {
    return sessions.map((s) => ({ ...s, scheduledAt: new Date(s.scheduledAt) }))
  }, [sessions])

  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }, [currentDate])

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [weekStart])

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const agendaDays = useMemo(() => {
    const map = new Map<string, (Session & { scheduledAt: Date })[]>()
    weekDays.forEach((d) => map.set(dateKey(d), []))
    parsedSessions.forEach((s) => {
      const key = dateKey(s.scheduledAt)
      if (map.has(key)) {
        map.get(key)!.push(s)
      }
    })
    return weekDays.map((d) => ({
      date: d,
      sessions: (map.get(dateKey(d)) || []).sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()),
    }))
  }, [weekDays, parsedSessions])

  const formatDay = (d: Date) =>
    d.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { weekday: "short", day: "numeric" })

  const formatTime = (d: Date) =>
    d.toLocaleTimeString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { hour: "2-digit", minute: "2-digit" })

  const formatEndTime = (d: Date, durationMinutes?: number | null) => {
    if (!durationMinutes) return ""
    const end = new Date(d.getTime() + durationMinutes * 60 * 1000)
    return formatTime(end)
  }

  const statusBadgeClasses = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      LIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      ENDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  const SessionCard = ({ session }: { session: Session & { scheduledAt: Date } }) => {
    const endTime = formatEndTime(session.scheduledAt, session.duration)
    const dotColor = getSessionDotColor(session, colorBy)
    const duration = session.duration ? `${session.duration} min` : null

    return (
      <button
        type="button"
        onClick={() => onSessionClick?.(session)}
        className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
      >
        <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatTime(session.scheduledAt)}
              {endTime && <span className="text-gray-400 font-medium"> – {endTime}</span>}
              {duration && (
                <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {duration}
                </span>
              )}
            </span>
            <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusBadgeClasses(session.status))}>
              {session.status}
            </span>
          </div>
          <div className="font-semibold text-gray-800 dark:text-gray-100 truncate mt-0.5">{session.meetingName}</div>
          {(session.teacher?.fullName || session.group?.name) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
              {session.teacher?.fullName && (
                <span className="font-medium text-gray-700 dark:text-gray-300">{session.teacher.fullName}</span>
              )}
              {session.teacher?.fullName && session.group?.name && <span className="mx-1.5 opacity-60">·</span>}
              {session.group?.name}
            </div>
          )}
        </div>
      </button>
    )
  }

  const isToday = (d: Date) => now.toDateString() === d.toDateString()

  const handlePrev = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 7)
    setCurrentDate(d)
    setInitialScrollDone(false)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 7)
    setCurrentDate(d)
    setInitialScrollDone(false)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-tahfidz-green" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Semaine</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {(["status", "teacher", "group"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setColorBy(mode)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition capitalize",
                  colorBy === mode
                    ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {mode === "status" ? "Statut" : mode === "teacher" ? "Enseignant" : "Groupe"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft size={18} className={isRTL ? "rotate-180" : ""} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[140px] text-center">
            {formatDay(weekDays[0])} – {formatDay(weekDays[6])}
          </span>
          <button
            type="button"
            onClick={handleNext}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <ChevronRight size={18} className={isRTL ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      {/* Vue Semaine (Agenda vertical) */}
      <div className="space-y-4">
        {agendaDays.map(({ date, sessions: daySessions }) => (
          <div
            key={dateKey(date)}
            ref={(el) => {
              dayRefs.current[dateKey(date)] = el
            }}
            className={cn(
              "rounded-2xl border p-4 transition",
              isToday(date)
                ? "border-tahfidz-green bg-tahfidz-green/5"
                : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
            )}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                  isToday(date)
                    ? "bg-tahfidz-green text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                )}
              >
                {date.getDate()}
              </div>
              <div>
                <h3
                  className={cn(
                    "text-sm font-bold",
                    isToday(date) ? "text-tahfidz-green" : "text-gray-900 dark:text-white"
                  )}
                >
                  {date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                    weekday: "long",
                  })}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            {daySessions.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">Aucune séance</p>
            ) : (
              <div className="space-y-2">
                {daySessions.map((s) => (
                  <SessionCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
