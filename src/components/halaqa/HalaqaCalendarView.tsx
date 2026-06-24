// src/components/halaqa/HalaqaCalendarView.tsx
// Calendrier Halaqa : Agenda (7 colonnes), Mois (grille + détail)

"use client"

import { useState, useMemo, useEffect } from "react"
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
  const [view, setView] = useState<"agenda" | "month">("agenda")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [colorBy, setColorBy] = useState<"status" | "teacher" | "group">("status")
  const [selectedMonthDay, setSelectedMonthDay] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setSelectedMonthDay(null)
  }, [currentDate, view])

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

  const weekSessions = useMemo(() => {
    return parsedSessions.filter((s) => {
      const d = new Date(s.scheduledAt)
      return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    })
  }, [parsedSessions, weekStart])

  const monthStart = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), [currentDate])
  const monthEnd = useMemo(() => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), [currentDate])
  const startDayOfWeek = monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1
  const daysInMonth = monthEnd.getDate()

  const monthSessions = useMemo(() => {
    return parsedSessions.filter((s) => {
      const d = new Date(s.scheduledAt)
      return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear()
    })
  }, [parsedSessions, currentDate])

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

  const SessionCard = ({
    session,
    compact = false,
  }: {
    session: Session & { scheduledAt: Date }
    compact?: boolean
  }) => {
    const endTime = formatEndTime(session.scheduledAt, session.duration)
    const dotColor = getSessionDotColor(session, colorBy)
    const duration = session.duration ? `${session.duration} min` : null
    const subtitle = [session.teacher?.fullName, session.group?.name].filter(Boolean).join(" · ")

    return (
      <button
        type="button"
        onClick={() => onSessionClick?.(session)}
        className={cn(
          "w-full flex items-start gap-3 rounded-xl border text-left transition hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600",
          compact ? "p-2" : "p-3",
          "bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700"
        )}
      >
        <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {formatTime(session.scheduledAt)}
              {endTime && <span className="text-gray-400 font-medium"> – {endTime}</span>}
              {duration && !compact && (
                <span className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {duration}
                </span>
              )}
            </span>
            {!compact && (
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusBadgeClasses(session.status))}>
                {session.status}
              </span>
            )}
          </div>
          <div
            className={cn(
              "font-semibold text-gray-800 dark:text-gray-100 mt-0.5",
              compact ? "truncate text-xs" : "truncate"
            )}
          >
            {session.meetingName}
          </div>
          {!compact && subtitle && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{subtitle}</div>
          )}
        </div>
      </button>
    )
  }

  const isToday = (d: Date) => now.toDateString() === d.toDateString()

  const handlePrev = () => {
    const d = new Date(currentDate)
    if (view === "month") d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  const handleNext = () => {
    const d = new Date(currentDate)
    if (view === "month") d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-tahfidz-green" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendrier</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            {(["agenda", "month"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition capitalize",
                  view === v
                    ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm"
                    : "text-gray-600 dark:text-gray-400"
                )}
              >
                {v === "agenda" ? "Agenda" : "Mois"}
              </button>
            ))}
          </div>
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
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {view === "month"
              ? currentDate.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                  month: "long",
                  year: "numeric",
                })
              : `${formatDay(weekDays[0])} – ${formatDay(weekDays[6])}`}
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

      {/* Vue Agenda (anciennement Semaine) */}
      {view === "agenda" && (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] grid grid-cols-7 gap-3">
            {weekDays.map((day) => {
              const daySessions = weekSessions
                .filter((s) => dateKey(s.scheduledAt) === dateKey(day))
                .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
              return (
                <div
                  key={dateKey(day)}
                  className="flex flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-hidden min-h-[360px]"
                >
                  <div
                    className={cn(
                      "text-center py-3 border-b border-gray-100 dark:border-gray-800",
                      isToday(day) ? "bg-tahfidz-green text-white" : "bg-white dark:bg-gray-900"
                    )}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
                      {day.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                        weekday: "short",
                      })}
                    </div>
                    <div className="text-xl font-bold">{day.getDate()}</div>
                  </div>
                  <div className="flex-1 p-2 space-y-2">
                    {daySessions.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6 italic">Aucune séance</p>
                    ) : (
                      daySessions.map((s) => <SessionCard key={s.id} session={s} compact />)
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Vue Mois */}
      {view === "month" && (
        <div>
          <div className="grid grid-cols-7 gap-2">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: startDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[110px] rounded-xl bg-gray-50/50 dark:bg-gray-800/30"></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
              const daySessions = monthSessions.filter((s) => new Date(s.scheduledAt).getDate() === day)
              const selected = selectedMonthDay && dateKey(selectedMonthDay) === dateKey(dayDate)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedMonthDay(dayDate)}
                  className={cn(
                    "min-h-[110px] p-2 rounded-xl border text-left transition flex flex-col",
                    selected
                      ? "border-tahfidz-green ring-2 ring-tahfidz-green/20 bg-tahfidz-green/5"
                      : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  )}
                >
                  <div
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold",
                      isToday(dayDate) ? "bg-tahfidz-green text-white" : "text-gray-700 dark:text-gray-300"
                    )}
                  >
                    {day}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-auto content-end">
                    {daySessions.slice(0, 4).map((s) => (
                      <div key={s.id} className={cn("h-2 w-2 rounded-full", getSessionDotColor(s, colorBy))} />
                    ))}
                    {daySessions.length > 4 && (
                      <span className="text-[10px] text-gray-400 font-medium">+{daySessions.length - 4}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
          {selectedMonthDay && (
            <div className="mt-6 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedMonthDay.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedMonthDay(null)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Fermer
                </button>
              </div>
              <div className="space-y-2">
                {monthSessions
                  .filter((s) => dateKey(new Date(s.scheduledAt)) === dateKey(selectedMonthDay))
                  .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
                  .map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                {monthSessions.filter((s) => dateKey(new Date(s.scheduledAt)) === dateKey(selectedMonthDay)).length === 0 && (
                  <p className="text-sm text-gray-400 italic">Aucune séance ce jour</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  )
}
