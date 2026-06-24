// src/components/halaqa/HalaqaCalendarView.tsx
// Vue calendrier simple (semaine / mois) pour les séances Halaqa

"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface Session {
  id: string
  meetingName: string
  status: string
  scheduledAt: string | Date
  duration?: number | null
  teacher?: { fullName?: string | null } | null
}

interface HalaqaCalendarViewProps {
  sessions: Session[]
  locale: string
  isRTL?: boolean
  onSessionClick?: (session: Session) => void
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  LIVE: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800 animate-pulse",
  ENDED: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
  CANCELLED: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800 line-through opacity-60",
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

  const SessionPill = ({ session, compact = false }: { session: Session & { scheduledAt: Date }; compact?: boolean }) => {
    const endTime = formatEndTime(session.scheduledAt, session.duration)
    return (
      <button
        type="button"
        onClick={() => onSessionClick?.(session)}
        className={cn(
          "w-full text-left rounded-md border px-2 transition hover:opacity-90 hover:shadow-sm",
          compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1.5 text-[11px] leading-tight",
          statusColors[session.status] || statusColors.SCHEDULED
        )}
        title={`${session.meetingName} — ${formatTime(session.scheduledAt)}${endTime ? ` → ${endTime}` : ""}`}
      >
        <div className="font-semibold">
          {formatTime(session.scheduledAt)}
          {endTime && <span className="opacity-75"> → {endTime}</span>}
        </div>
        <div className={cn("font-medium", compact ? "truncate" : "line-clamp-2 whitespace-normal break-words")}>
          {session.meetingName}
        </div>
        {!compact && session.teacher?.fullName && (
          <div className="mt-0.5 text-[10px] opacity-75 truncate">{session.teacher.fullName}</div>
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
        <div className="flex items-center gap-2">
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
          <div className="min-w-[700px]">
            {/* Jours */}
            <div className="grid grid-cols-8 border-b border-gray-100 dark:border-gray-800 pb-2 mb-2">
                <div className="text-xs text-gray-400 px-2"></div>
                {weekDays.map((d, i) => (
                  <div
                    key={i}
                    className={cn(
                      "text-center text-xs font-medium px-1 py-2 rounded-lg",
                      new Date().toDateString() === d.toDateString()
                        ? "bg-tahfidz-green/10 text-tahfidz-green"
                        : "text-gray-600 dark:text-gray-400"
                    )}
                  >
                    {d.toLocaleDateString(locale === "ar" ? "ar-DZ" : locale === "en" ? "en-US" : "fr-FR", { weekday: "short" })}
                    <div className="text-lg font-bold">{d.getDate()}</div>
                  </div>
                ))}
              </div>

            {/* Grille horaire */}
            <div className="grid grid-cols-8 relative" style={{ minHeight: "600px" }}>
              {/* Colonne heures */}
              <div className="text-xs text-gray-400">
                {hours.map((h) => (
                  <div key={h} className="h-12 flex items-start justify-end pr-2 -mt-2">
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Colonnes jours */}
              {weekDays.map((day, dayIndex) => (
                <div key={dayIndex} className="relative border-l border-gray-100 dark:border-gray-800">
                  {hours.map((h) => (
                    <div key={h} className="h-12 border-b border-gray-50 dark:border-gray-800/50"></div>
                  ))}
                  {(() => {
                    const daySessions = weekSessions.filter(
                      (s) => new Date(s.scheduledAt).toDateString() === day.toDateString()
                    )
                    const layout = computeOverlapLayout(daySessions)
                    return daySessions.map((s) => {
                      const start = new Date(s.scheduledAt)
                      const top = (start.getHours() + start.getMinutes() / 60 - 6) * 48
                      const rawHeight = ((s.duration ?? 60) / 60) * 48
                      const height = Math.max(rawHeight, 56)
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
