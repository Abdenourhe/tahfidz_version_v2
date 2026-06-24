// src/components/halaqa/HalaqaCalendarView.tsx
// Vue calendrier simple (semaine / mois) pour les séances Halaqa

"use client"

import { useState, useMemo, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Users } from "lucide-react"
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
  SCHEDULED: "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700 shadow-blue-100 dark:shadow-none",
  LIVE: "bg-red-50 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700 animate-pulse shadow-red-100 dark:shadow-none",
  ENDED: "bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 shadow-gray-100 dark:shadow-none",
  CANCELLED: "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700 line-through opacity-60 shadow-orange-100 dark:shadow-none",
}

const accentPalette = [
  "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700",
  "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
  "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
  "bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700",
  "bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700",
  "bg-orange-50 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-700",
  "bg-cyan-50 text-cyan-800 border-cyan-300 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700",
  "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-300 dark:bg-fuchsia-900/40 dark:text-fuchsia-200 dark:border-fuchsia-700",
  "bg-lime-50 text-lime-800 border-lime-300 dark:bg-lime-900/40 dark:text-lime-200 dark:border-lime-700",
  "bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-900/40 dark:text-indigo-200 dark:border-indigo-700",
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
  const [view, setView] = useState<"week" | "month">("week")
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

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(weekStart.getDate() + i)
      return d
    })
  }, [weekStart])

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

  const formatEndTime = (d: Date, durationMinutes?: number | null) => {
    if (!durationMinutes) return ""
    const end = new Date(d.getTime() + durationMinutes * 60 * 1000)
    return formatTime(end)
  }

  const SessionPill = ({
    session,
    compact = false,
  }: {
    session: Session & { scheduledAt: Date }
    compact?: boolean
  }) => {
    const endTime = formatEndTime(session.scheduledAt, session.duration)
    const colorClasses = getSessionColor(session, colorBy)
    const titleParts = [
      session.meetingName,
      `${formatTime(session.scheduledAt)}${endTime ? ` → ${endTime}` : ""}`,
      session.teacher?.fullName,
      session.group?.name,
      session.status,
    ].filter(Boolean)

    return (
      <button
        type="button"
        onClick={() => onSessionClick?.(session)}
        className={cn(
          "w-full h-full text-left rounded-lg border shadow-sm transition hover:shadow-md hover:scale-[1.02] overflow-hidden flex flex-col",
          compact ? "px-1.5 py-0.5 text-[10px] gap-0.5" : "px-2 py-1.5 text-[11px] leading-tight gap-0.5",
          colorClasses
        )}
        title={titleParts.join(" · ")}
      >
        <div className="font-bold flex items-center gap-1">
          <Clock size={compact ? 9 : 10} />
          {formatTime(session.scheduledAt)}
          {endTime && <span className="opacity-75 font-medium">→ {endTime}</span>}
        </div>
        <div className={cn("font-semibold", compact ? "truncate" : "line-clamp-2 whitespace-normal break-words")}>
          {session.meetingName}
        </div>
        {!compact && (
          <div className="mt-auto space-y-0.5">
            {session.teacher?.fullName && (
              <div className="flex items-center gap-1 text-[10px] opacity-80 truncate">
                <User size={10} />
                {session.teacher.fullName}
              </div>
            )}
            {session.group?.name && (
              <div className="flex items-center gap-1 text-[10px] opacity-80 truncate">
                <Users size={10} />
                {session.group.name}
              </div>
            )}
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
          <div className="min-w-[900px]">
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
                    <span className="absolute -left-1.5 -translate-x-full text-[10px] font-bold text-red-500 bg-white dark:bg-gray-900 px-1 rounded">
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
                          className="absolute z-10 px-0.5"
                          style={{
                            top: `${top}px`,
                            height: `${height}px`,
                            left: `${left}%`,
                            width: `${width}%`,
                          }}
                        >
                          <SessionPill session={s} />
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
