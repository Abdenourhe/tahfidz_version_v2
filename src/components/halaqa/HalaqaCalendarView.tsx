// src/components/halaqa/HalaqaCalendarView.tsx
// Vue calendrier simple (semaine / mois) pour les séances Halaqa

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

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-white dark:bg-gray-800 border-l-4 border-blue-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  LIVE: "bg-white dark:bg-gray-800 border-l-4 border-red-500 text-gray-900 dark:text-gray-100 shadow-sm animate-pulse hover:shadow-md",
  ENDED: "bg-gray-50 dark:bg-gray-800/60 border-l-4 border-gray-400 text-gray-600 dark:text-gray-400 shadow-sm hover:shadow-md",
  CANCELLED: "bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-400 text-orange-800 dark:text-orange-300 line-through opacity-70 shadow-sm hover:shadow-md",
}

const accentPalette = [
  "bg-white dark:bg-gray-800 border-l-4 border-blue-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-emerald-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-amber-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-rose-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-violet-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-orange-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-cyan-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-fuchsia-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-lime-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
  "bg-white dark:bg-gray-800 border-l-4 border-indigo-500 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md",
]

function hashToIndex(str: string, length: number): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % length
}

function getSessionColor(session: Session, colorBy: "status" | "teacher" | "group"): string {
  if (colorBy === "status") return statusColors[session.status] || statusColors.SCHEDULED
  const key = colorBy === "teacher" ? session.teacher?.id : session.group?.id
  if (!key) return statusColors[session.status] || statusColors.SCHEDULED
  return accentPalette[hashToIndex(key, accentPalette.length)]
}

const statusDotColors: Record<string, string> = {
  SCHEDULED: "bg-blue-500",
  LIVE: "bg-red-500",
  ENDED: "bg-gray-400",
  CANCELLED: "bg-orange-400",
}

const dotPalette = [
  "bg-blue-500", "bg-emerald-500", "bg-amber-500", "bg-rose-500", "bg-violet-500",
  "bg-orange-500", "bg-cyan-500", "bg-fuchsia-500", "bg-lime-500", "bg-indigo-500",
]

function getSessionDotColor(session: Session, colorBy: "status" | "teacher" | "group"): string {
  if (colorBy === "status") return statusDotColors[session.status] || statusDotColors.SCHEDULED
  const key = colorBy === "teacher" ? session.teacher?.id : session.group?.id
  if (!key) return statusDotColors[session.status] || statusDotColors.SCHEDULED
  return dotPalette[hashToIndex(key, dotPalette.length)]
}

const hours = Array.from({ length: 17 }, (_, i) => i + 6) // 06:00 → 22:00

function sessionEnd(s: Session & { scheduledAt: Date }): Date {
  return new Date(s.scheduledAt.getTime() + (s.duration ?? 60) * 60 * 1000)
}

function sessionsOverlap(a: Session & { scheduledAt: Date }, b: Session & { scheduledAt: Date }): boolean {
  return a.scheduledAt.getTime() < sessionEnd(b).getTime() && b.scheduledAt.getTime() < sessionEnd(a).getTime()
}

function computeOverlapLayout(sessions: (Session & { scheduledAt: Date })[]): Map<string, { column: number; total: number }> {
  if (sessions.length === 0) return new Map()

  // 1. Trouver les composantes connexes par chevauchement
  const visited = new Set<string>()
  const components: (Session & { scheduledAt: Date })[][] = []

  for (const session of sessions) {
    if (visited.has(session.id)) continue
    const component: (Session & { scheduledAt: Date })[] = []
    const queue = [session]
    visited.add(session.id)
    while (queue.length > 0) {
      const current = queue.shift()!
      component.push(current)
      for (const other of sessions) {
        if (!visited.has(other.id) && sessionsOverlap(current, other)) {
          visited.add(other.id)
          queue.push(other)
        }
      }
    }
    components.push(component)
  }

  const layout = new Map<string, { column: number; total: number }>()

  for (const component of components) {
    // 2. Calculer le nombre maximal de sessions simultanées dans la composante
    const events: { time: number; delta: number }[] = []
    for (const s of component) {
      events.push({ time: s.scheduledAt.getTime(), delta: 1 })
      events.push({ time: sessionEnd(s).getTime(), delta: -1 })
    }
    events.sort((a, b) => a.time - b.time || a.delta - b.delta)
    let current = 0
    let maxConcurrent = 0
    for (const e of events) {
      current += e.delta
      maxConcurrent = Math.max(maxConcurrent, current)
    }

    // 3. Assigner les colonnes en ordre chronologique
    const sorted = [...component].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
    const assigned: { start: number; end: number; column: number }[] = []

    for (const s of sorted) {
      const start = s.scheduledAt.getTime()
      const end = sessionEnd(s).getTime()
      const usedColumns = new Set<number>()
      for (const a of assigned) {
        if (start < a.end && a.start < end) {
          usedColumns.add(a.column)
        }
      }
      let column = 0
      while (usedColumns.has(column)) column++
      assigned.push({ start, end, column })
      layout.set(s.id, { column, total: Math.max(maxConcurrent, 1) })
    }
  }

  return layout
}

export default function HalaqaCalendarView({ sessions, locale, isRTL, onSessionClick }: HalaqaCalendarViewProps) {
  const [view, setView] = useState<"week" | "month" | "agenda">("agenda")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [colorBy, setColorBy] = useState<"status" | "teacher" | "group">("status")
  const [now, setNow] = useState(new Date())

  const HOUR_HEIGHT = 56

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const parsedSessions = useMemo(() => {
    return sessions.map((s) => ({ ...s, scheduledAt: new Date(s.scheduledAt) }))
  }, [sessions])

  // ─── Vue semaine ──────────────────────────────────────────────────
  const weekStart = useMemo(() => {
    const d = new Date(currentDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Lundi comme premier jour
    return new Date(d.setDate(diff))
  }, [currentDate])

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [weekStart])

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

  const weekSessions = useMemo(() => {
    return parsedSessions.filter((s) => {
      const d = new Date(s.scheduledAt)
      return d >= weekStart && d < new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    })
  }, [parsedSessions, weekStart])

  // ─── Vue mois ─────────────────────────────────────────────────────
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

  const statusBadgeClasses = (status: string) => {
    const map: Record<string, string> = {
      SCHEDULED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      LIVE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
      ENDED: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      CANCELLED: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    }
    return map[status] || "bg-gray-100 text-gray-700"
  }

  const formatEndTime = (d: Date, durationMinutes?: number | null) => {
    if (!durationMinutes) return ""
    const end = new Date(d.getTime() + durationMinutes * 60 * 1000)
    return formatTime(end)
  }

  const SessionPill = ({
    session,
    compact = false,
    narrow = false,
  }: {
    session: Session & { scheduledAt: Date }
    compact?: boolean
    narrow?: boolean
  }) => {
    const endTime = formatEndTime(session.scheduledAt, session.duration)
    const colorClasses = getSessionColor(session, colorBy)
    const titleParts = [
      session.meetingName,
      `${formatTime(session.scheduledAt)}${endTime ? ` – ${endTime}` : ""}`,
      session.teacher?.fullName,
      session.group?.name,
      session.status,
    ].filter(Boolean)

    return (
      <button
        type="button"
        onClick={() => onSessionClick?.(session)}
        className={cn(
          "w-full h-full text-left rounded-md border border-gray-100 dark:border-gray-700 transition overflow-hidden flex flex-col justify-center",
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1.5 text-[11px]",
          colorClasses
        )}
        title={titleParts.join(" · ")}
      >
        <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
          <span>{formatTime(session.scheduledAt)}</span>
          {endTime && !narrow && <span className="opacity-75">– {endTime}</span>}
        </div>
        <div className={cn("font-semibold leading-tight mt-0.5", compact || narrow ? "truncate" : "line-clamp-2 whitespace-normal break-words")}>
          {session.meetingName}
        </div>
        {!compact && !narrow && (
          <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400 truncate">
            {[session.teacher?.fullName, session.group?.name].filter(Boolean).join(" · ")}
          </div>
        )}
      </button>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
      {/* Header calendrier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <CalendarIcon size={20} className="text-tahfidz-green" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Calendrier</h2>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center p-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <button
              type="button"
              onClick={() => setView("week")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition",
                view === "week" ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm" : "text-gray-600 dark:text-gray-400"
              )}
            >
              Semaine
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition",
                view === "month" ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm" : "text-gray-600 dark:text-gray-400"
              )}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => setView("agenda")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition",
                view === "agenda" ? "bg-white dark:bg-gray-700 text-tahfidz-green shadow-sm" : "text-gray-600 dark:text-gray-400"
              )}
            >
              Agenda
            </button>
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
            onClick={() => {
              const d = new Date(currentDate)
              if (view === "week") d.setDate(d.getDate() - 7)
              else d.setMonth(d.getMonth() - 1)
              setCurrentDate(d)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <ChevronLeft size={18} className={isRTL ? "rotate-180" : ""} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {view === "week"
              ? `${formatDay(weekDays[0])} – ${formatDay(weekDays[6])}`
              : currentDate.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { month: "long", year: "numeric" })}
          </span>
          <button
            type="button"
            onClick={() => {
              const d = new Date(currentDate)
              if (view === "week") d.setDate(d.getDate() + 7)
              else d.setMonth(d.getMonth() + 1)
              setCurrentDate(d)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <ChevronRight size={18} className={isRTL ? "rotate-180" : ""} />
          </button>
        </div>
      </div>

      {/* Vue semaine */}
      {view === "week" && (
        <div className="overflow-x-auto">
          <div className="min-w-[1100px]">
            {/* Jours */}
            <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">
              <div className="text-xs text-gray-400 px-2"></div>
              {weekDays.map((d, i) => {
                const isToday = now.toDateString() === d.toDateString()
                return (
                  <div
                    key={i}
                    className={cn(
                      "text-center text-xs font-medium px-1 py-2 rounded-xl transition",
                      isToday
                        ? "bg-tahfidz-green text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {d.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { weekday: "short" })}
                    <div className="text-lg font-bold">{d.getDate()}</div>
                  </div>
                )
              })}
            </div>

            {/* Grille horaire */}
            <div className="grid grid-cols-8 relative" style={{ minHeight: "700px" }}>
              {/* Ligne "maintenant" */}
              {weekDays.some((d) => d.toDateString() === now.toDateString()) && (
                <div
                  className="absolute z-20 pointer-events-none"
                  style={{
                    top: `${(now.getHours() + now.getMinutes() / 60 - 6) * HOUR_HEIGHT}px`,
                    left: "12.5%",
                    right: 0,
                  }}
                >
                  <div className="flex items-center">
                    <span className="absolute left-0 -translate-x-full text-[11px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-l-md">
                      {formatTime(now)}
                    </span>
                    <div className="h-0.5 bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] w-full rounded-full" />
                  </div>
                </div>
              )}

              {/* Colonne heures */}
              <div className="text-xs text-gray-400">
                {hours.map((h) => (
                  <div key={h} className="h-[56px] flex items-start justify-end pr-2 -mt-2">
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="relative border-l border-gray-100 dark:border-gray-800">
                  {hours.map((h) => (
                    <div key={h} className="h-[56px] border-b border-gray-50 dark:border-gray-800/50"></div>
                  ))}
                  {(() => {
                    const daySessions = weekSessions.filter(
                      (s) => new Date(s.scheduledAt).toDateString() === day.toDateString()
                    )
                    const layout = computeOverlapLayout(daySessions)
                    return daySessions.map((s) => {
                      const start = new Date(s.scheduledAt)
                      const top = (start.getHours() + start.getMinutes() / 60 - 6) * HOUR_HEIGHT
                      const rawHeight = ((s.duration ?? 60) / 60) * HOUR_HEIGHT
                      const height = Math.max(rawHeight, 64)
                      const pos = layout.get(s.id) ?? { column: 0, total: 1 }
                      const width = 100 / pos.total
                      const left = pos.column * width
                      return (
                        <div
                          key={s.id}
                          className="absolute z-10 px-1"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          <SessionPill session={s} narrow={pos.total > 1} />
                        </div>
                      )
                    })
                  })()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Vue agenda */}
      {view === "agenda" && (
        <div className="space-y-6">
          {agendaDays.map(({ date, sessions: daySessions }) => {
            const isToday = now.toDateString() === date.toDateString()
            return (
              <div
                key={dateKey(date)}
                className={cn(
                  "rounded-2xl border p-4 transition",
                  isToday
                    ? "border-tahfidz-green bg-tahfidz-green/5"
                    : "border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900"
                )}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                      isToday
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
                        isToday ? "text-tahfidz-green" : "text-gray-900 dark:text-white"
                      )}
                    >
                      {date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { weekday: "long" })}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {date.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {daySessions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">Aucune séance</p>
                ) : (
                  <div className="space-y-2">
                    {daySessions.map((s) => {
                      const endTime = formatEndTime(s.scheduledAt, s.duration)
                      const dotColor = getSessionDotColor(s, colorBy)
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => onSessionClick?.(s)}
                          className="w-full flex items-start gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-md transition text-left"
                        >
                          <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {formatTime(s.scheduledAt)}
                                {endTime && <span className="text-gray-400 font-medium"> – {endTime}</span>}
                              </span>
                              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase", statusBadgeClasses(s.status))}>
                                {s.status}
                              </span>
                            </div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100 truncate mt-0.5">
                              {s.meetingName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                              {[s.teacher?.fullName, s.group?.name].filter(Boolean).join(" · ")}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Vue mois */}
      {view === "month" && (
        <div className="grid grid-cols-7 gap-1">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
              {d}
            </div>
          ))}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] bg-gray-50/50 dark:bg-gray-800/30 rounded-lg"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const daySessions = monthSessions.filter((s) => new Date(s.scheduledAt).getDate() === day)
            const isToday =
              new Date().getDate() === day &&
              new Date().getMonth() === currentDate.getMonth() &&
              new Date().getFullYear() === currentDate.getFullYear()

            return (
              <div
                key={day}
                className={cn(
                  "min-h-[100px] p-1.5 rounded-lg border transition",
                  isToday
                    ? "border-tahfidz-green bg-tahfidz-green/5"
                    : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}
              >
                <div className={cn("text-xs font-semibold mb-1", isToday ? "text-tahfidz-green" : "text-gray-600 dark:text-gray-400")}>
                  {day}
                </div>
                <div className="space-y-1">
                  {daySessions.map((s) => (
                    <SessionPill key={s.id} session={s} compact />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
