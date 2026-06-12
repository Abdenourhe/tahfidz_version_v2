"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  Save, Loader2, Check, Clock, BookOpen, X,
  CalendarCheck, AlertCircle, ChevronLeft, ChevronRight,
  ArrowLeft, Info
} from "lucide-react"

interface Child {
  id: string
  relation: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null; avatar?: string | null }
    group: { id: string; name: string; schedule?: Record<string, string> | null } | null
    teacher: { user: { fullName: string } } | null
  }
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Présent", short: "Prés", icon: Check,    color: "emerald", bg: "bg-emerald-500",  light: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200" },
  { value: "LATE",    label: "Retard",  short: "Ret",  icon: Clock,    color: "amber",   bg: "bg-amber-500",    light: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200" },
  { value: "EXCUSED", label: "Excusé",  short: "Exc",  icon: BookOpen, color: "blue",    bg: "bg-blue-500",     light: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200" },
  { value: "ABSENT",  label: "Absent",  short: "Abs",  icon: X,        color: "red",     bg: "bg-red-500",      light: "bg-red-50",      text: "text-red-700",      border: "border-red-200" },
]

const RELATION_LABELS: Record<string, string> = { father: "Père", mother: "Mère", guardian: "Tuteur" }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function getCourseDayIndicesForChild(child: Child): number[] {
  const indices = new Set<number>()
  const schedule = child.student.group?.schedule
  if (schedule) {
    Object.keys(schedule).forEach(day => {
      const idx = DAY_KEYS.indexOf(day.toLowerCase() as typeof DAY_KEYS[number])
      if (idx >= 0) indices.add(idx)
    })
  }
  return Array.from(indices).sort((a, b) => a - b)
}

function hasCourseOnDay(child: Child, dateStr: string): boolean {
  const schedule = child.student.group?.schedule
  if (!schedule) return false
  const dayIndex = new Date(`${dateStr}T12:00:00`).getDay()
  const dayKey = DAY_KEYS[dayIndex]
  return !!schedule[dayKey] || !!schedule[dayKey.toUpperCase()]
}

function getChildrenForDay(children: Child[], dateStr: string): Child[] {
  return children.filter(child => hasCourseOnDay(child, dateStr))
}

function offsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function getWeekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay() // 0 = dimanche, 1 = lundi...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  return monday.toISOString().split("T")[0]
}

function getWeekDays(weekStart: string): string[] {
  const start = new Date(`${weekStart}T12:00:00`)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d.toISOString().split("T")[0]
  })
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(`${weekStart}T12:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const startStr = start.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
  const endStr = end.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  return `${startStr} – ${endStr}`
}

function dateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return {
    full: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    short: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
  }
}

interface CalendarCell {
  dateStr?: string
  dayNum?: number
  isCourseDay: boolean
  isToday: boolean
  isFuture: boolean
  status?: string
  reason?: string
}

function buildMonthGrid(
  activeDate: string,
  courseDayIndices: number[],
  attendanceMap: Record<string, { status: string; reason?: string }>
): CalendarCell[] {
  const d = new Date(`${activeDate}T12:00:00`)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const todayStr = new Date().toISOString().split("T")[0]

  const cells: CalendarCell[] = []

  for (let i = 0; i < startOffset; i++) cells.push({ isCourseDay: false, isToday: false, isFuture: false })

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    const weekday = new Date(year, month, day).getDay()
    const record = attendanceMap[dateStr]
    cells.push({
      dateStr,
      dayNum: day,
      isCourseDay: courseDayIndices.includes(weekday),
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
      status: record?.status,
      reason: record?.reason,
    })
  }

  return cells
}

function buildMonthGridForChildren(
  activeDate: string,
  children: Child[]
): CalendarCell[] {
  const d = new Date(`${activeDate}T12:00:00`)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const todayStr = new Date().toISOString().split("T")[0]

  const cells: CalendarCell[] = []

  for (let i = 0; i < startOffset; i++) cells.push({ isCourseDay: false, isToday: false, isFuture: false })

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    const hasCourse = getChildrenForDay(children, dateStr).length > 0
    cells.push({
      dateStr,
      dayNum: day,
      isCourseDay: hasCourse,
      isToday: dateStr === todayStr,
      isFuture: dateStr > todayStr,
    })
  }

  return cells
}

function CalendarDayTooltip({ children, content }: { children: React.ReactNode; content: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative flex h-full" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      {open && content && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-max max-w-[180px] px-2 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[10px] font-medium shadow-lg pointer-events-none">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100" />
        </div>
      )}
    </div>
  )
}

const statusConfig: Record<string, { label: string; light: string; text: string; border: string; bg: string; icon: any }> = Object.fromEntries(
  STATUS_OPTIONS.map(o => [o.value, { label: o.label, light: o.light, text: o.text, border: o.border, bg: o.bg, icon: o.icon }])
)

/* ------------------------------------------------------------------ */

export function ParentProfileAttendance({ children }: { children: Child[] }) {
  const todayStr = offsetDate(0)
  const tomorrow = offsetDate(1)

  const [mode, setMode] = useState<"week" | "child">("week")
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  // Child mode states
  const [activeDate, setActiveDate] = useState<string>(tomorrow)
  const [status, setStatus] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set())
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; reason?: string }>>({})

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  // Touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // Week mode states
  const [calendarView, setCalendarView] = useState<"week" | "month">("week")
  const [weekStart, setWeekStart] = useState<string>(getWeekStart(todayStr))
  const [monthDate, setMonthDate] = useState<string>(todayStr)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [weekAttendanceMap, setWeekAttendanceMap] = useState<Record<string, Record<string, { status: string; reason?: string }>>>({})
  const [draftStatuses, setDraftStatuses] = useState<Record<string, string>>({})
  const [draftReason, setDraftReason] = useState<string>("")
  const [weekSaving, setWeekSaving] = useState(false)
  const [weekSaved, setWeekSaved] = useState(false)

  /* Load attendance data for current calendar range */
  const loadCalendarData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let dateFrom: string
      let dateTo: string
      let datesToInit: string[]

      if (calendarView === "week") {
        const days = getWeekDays(weekStart)
        dateFrom = weekStart
        dateTo = days[6]
        datesToInit = days
      } else {
        const d = new Date(`${monthDate}T12:00:00`)
        const year = d.getFullYear()
        const month = d.getMonth()
        dateFrom = new Date(year, month, 1).toISOString().split("T")[0]
        dateTo = new Date(year, month + 1, 0).toISOString().split("T")[0]
        datesToInit = buildMonthGridForChildren(monthDate, children)
          .filter(c => c.dateStr)
          .map(c => c.dateStr as string)
      }

      const [paRes, attRes] = await Promise.all([
        fetch("/api/parent-attendance"),
        fetch(`/api/attendance?dateFrom=${dateFrom}&dateTo=${dateTo}`),
      ])
      const paData = await paRes.json()
      const attData = await attRes.json()

      const map: Record<string, Record<string, { status: string; reason?: string }>> = {}
      datesToInit.forEach(dateStr => { map[dateStr] = {} })

      ;(attData.attendances || []).forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        if (!map[dateStr]) map[dateStr] = {}
        map[dateStr][a.studentId] = { status: a.status, reason: a.notes || undefined }
      })

      ;(paData.attendances || []).forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        if (!map[dateStr]) map[dateStr] = {}
        map[dateStr][a.studentId] = { status: a.status, reason: a.reason || undefined }
      })

      setWeekAttendanceMap(map)
    } catch (e) {
      console.error(e)
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [calendarView, weekStart, monthDate, children])

  const weekDays = getWeekDays(weekStart)
  const selectedDayChildren = selectedDay ? getChildrenForDay(children, selectedDay) : []
  const dayHasChanges = selectedDayChildren.some(child => {
    const loaded = selectedDay ? weekAttendanceMap[selectedDay]?.[child.student.id]?.status : undefined
    return draftStatuses[child.student.id] !== (loaded || "PRESENT")
  })

  useEffect(() => {
    if (mode === "week") {
      loadCalendarData()
    }
  }, [mode, loadCalendarData])

  /* Load full data when entering child mode */
  const loadChildData = useCallback(async (child: Child) => {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const [paRes, attRes] = await Promise.all([
        fetch("/api/parent-attendance"),
        fetch(`/api/attendance?studentId=${child.student.id}&dateFrom=2024-01-01&dateTo=2099-12-31`),
      ])
      const paData = await paRes.json()
      const attData = await attRes.json()

      const paRecords = (paData.attendances || []).filter((a: any) => a.studentId === child.student.id)
      const attRecords = (attData.attendances || []).filter((a: any) => a.studentId === child.student.id)

      const map: Record<string, { status: string; reason?: string }> = {}
      const marked = new Set<string>()

      attRecords.forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        map[dateStr] = { status: a.status, reason: a.notes }
        marked.add(dateStr)
      })

      paRecords.forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        map[dateStr] = { status: a.status, reason: a.reason || undefined }
        marked.add(dateStr)
      })

      setAttendanceMap(map)
      setMarkedDates(marked)

      const current = map[activeDate]
      if (current) {
        setStatus(current.status)
        setNote(current.reason || "")
      } else {
        setStatus("")
        setNote("")
      }
    } catch (e) {
      console.error(e)
      setError("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }, [activeDate])

  const enterChildMode = (child: Child) => {
    setSelectedChild(child)
    setMode("child")
    const indices = getCourseDayIndicesForChild(child)
    const days = Array.from({ length: 90 }, (_, i) => offsetDate(i + 1))
      .filter(d => indices.includes(new Date(`${d}T12:00:00`).getDay()))
    const nextDay = days.length > 0 ? days[0] : tomorrow
    setActiveDate(nextDay)
    setStatus("")
    setNote("")
    setSaved(false)
    setError(null)
    setAnimKey(k => k + 1)
  }

  /* Week mode helpers */
  useEffect(() => {
    if (!selectedDay) return
    const dayChildren = getChildrenForDay(children, selectedDay)
    const initial: Record<string, string> = {}
    dayChildren.forEach(child => {
      const record = weekAttendanceMap[selectedDay]?.[child.student.id]
      initial[child.student.id] = record?.status || "PRESENT"
    })
    setDraftStatuses(initial)
    setDraftReason("")
    setWeekSaved(false)
    setError(null)
  }, [selectedDay, weekAttendanceMap, children])

  const goToPrevWeek = () => {
    const d = new Date(`${weekStart}T12:00:00`)
    d.setDate(d.getDate() - 7)
    const newStart = d.toISOString().split("T")[0]
    setWeekStart(newStart)
    setMonthDate(newStart)
    setSelectedDay(null)
  }

  const goToNextWeek = () => {
    const d = new Date(`${weekStart}T12:00:00`)
    d.setDate(d.getDate() + 7)
    const newStart = d.toISOString().split("T")[0]
    setWeekStart(newStart)
    setMonthDate(newStart)
    setSelectedDay(null)
  }

  const goToCurrentWeek = () => {
    const start = getWeekStart(todayStr)
    setWeekStart(start)
    setMonthDate(start)
    setSelectedDay(null)
  }

  const goToPrevMonth = () => {
    const d = new Date(`${monthDate}T12:00:00`)
    d.setMonth(d.getMonth() - 1)
    const newDate = d.toISOString().split("T")[0]
    setMonthDate(newDate)
    setWeekStart(getWeekStart(newDate))
    setSelectedDay(null)
  }

  const goToNextMonth = () => {
    const d = new Date(`${monthDate}T12:00:00`)
    d.setMonth(d.getMonth() + 1)
    const newDate = d.toISOString().split("T")[0]
    setMonthDate(newDate)
    setWeekStart(getWeekStart(newDate))
    setSelectedDay(null)
  }

  const goToCurrentMonth = () => {
    setMonthDate(todayStr)
    setWeekStart(getWeekStart(todayStr))
    setSelectedDay(null)
  }

  const applyStatusToAll = (statusValue: string) => {
    if (!selectedDay) return
    const dayChildren = getChildrenForDay(children, selectedDay)
    const updated: Record<string, string> = {}
    dayChildren.forEach(child => {
      updated[child.student.id] = statusValue
    })
    setDraftStatuses(updated)
    setWeekSaved(false)
  }

  const setDraftStatus = (studentId: string, statusValue: string) => {
    setDraftStatuses(prev => ({ ...prev, [studentId]: statusValue }))
    setWeekSaved(false)
  }

  async function saveBulkAttendance() {
    if (!selectedDay) return
    const dayChildren = getChildrenForDay(children, selectedDay)
    const records = dayChildren
      .filter(child => {
        const loaded = weekAttendanceMap[selectedDay]?.[child.student.id]?.status || "PRESENT"
        return draftStatuses[child.student.id] !== loaded
      })
      .map(child => {
        const status = draftStatuses[child.student.id]
        const reason = (status === "ABSENT" || status === "EXCUSED" || status === "LATE") ? draftReason : undefined
        return {
          studentId: child.student.id,
          date: selectedDay,
          status,
          reason,
        }
      })

    if (records.length === 0) return

    const missingReason = records.find(r => (r.status === "ABSENT" || r.status === "EXCUSED" || r.status === "LATE") && !r.reason?.trim())
    if (missingReason) {
      setError("Le motif est obligatoire pour Retard / Absent / Excusé.")
      return
    }

    setWeekSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/parent-attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || "Erreur lors de l'enregistrement")
        return
      }
      setWeekSaved(true)
      loadCalendarData()
    } catch (e) {
      console.error(e)
      setError("Erreur réseau")
    } finally {
      setWeekSaving(false)
    }
  }

  useEffect(() => {
    if (mode === "child" && selectedChild) {
      loadChildData(selectedChild)
    }
  }, [mode, selectedChild, loadChildData])

  useEffect(() => {
    if (mode !== "child") return
    const current = attendanceMap[activeDate]
    if (current) {
      setStatus(current.status)
      setNote(current.reason || "")
    } else {
      setStatus("")
      setNote("")
    }
    setSaved(false)
    setError(null)
  }, [activeDate, attendanceMap, mode])

  /* Calendar & navigation */
  const childCourseDayIndices = selectedChild ? getCourseDayIndicesForChild(selectedChild) : []
  const childQuickDays = Array.from({ length: 90 }, (_, i) => offsetDate(i + 1))
    .filter(d => childCourseDayIndices.includes(new Date(`${d}T12:00:00`).getDay()))

  const activeIndex = childQuickDays.indexOf(activeDate)
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < childQuickDays.length - 1

  const goPrev = () => { if (canGoPrev) changeDay(childQuickDays[activeIndex - 1]) }
  const goNext = () => { if (canGoNext) changeDay(childQuickDays[activeIndex + 1]) }

  function changeDay(d: string) {
    setActiveDate(d)
    setSaved(false)
    setError(null)
    setAnimKey(k => k + 1)
  }

  /* Save */
  async function saveAttendance() {
    if (!selectedChild || !activeDate || !status) return
    if ((status === "ABSENT" || status === "EXCUSED") && !note.trim()) {
      setError("Le motif est obligatoire pour ce statut.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/parent-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedChild.student.id,
          date: activeDate,
          status,
          reason: note || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error || "Erreur lors de l'enregistrement")
        return
      }
      setSaved(true)
      setMarkedDates(prev => new Set(prev).add(activeDate))
      setAttendanceMap(prev => ({ ...prev, [activeDate]: { status, reason: note } }))
      if (selectedChild) loadChildData(selectedChild)
    } catch (e) {
      console.error(e)
      setError("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  /* Touch handlers */
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.changedTouches[0].screenX)
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].screenX
    if (diff > 50) goNext()
    else if (diff < -50) goPrev()
    setTouchStartX(null)
  }

  const selectedOpt = STATUS_OPTIONS.find(o => o.value === status)
  const isFuture = activeDate > todayStr
  const activeLabel = dateLabel(activeDate)
  const monthCells = buildMonthGrid(activeDate, childCourseDayIndices, attendanceMap)
  const monthYear = new Date(`${activeDate}T12:00:00`)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Header */}
      <div className="px-5 py-4 bg-gray-50/60 dark:bg-gray-700/60 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          {mode === "week" ? `Présences — ${calendarView === "week" ? "Semaine" : "Mois"}` : selectedChild?.student.user.fullName}
        </h2>
        {mode === "child" && (
          <button onClick={() => { setMode("week"); setSelectedChild(null) }}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition">
            <ArrowLeft size={14} /> Retour
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {mode === "week" ? (
          /* ═══════════════════ WEEK MODE ═══════════════════ */
          <div className="space-y-4">
            {/* Calendar navigation */}
            <div className="flex items-center justify-between gap-2">
              <button onClick={calendarView === "week" ? goToPrevWeek : goToPrevMonth}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95">
                <ChevronLeft size={18} />
              </button>
              <div className="text-center">
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                  {calendarView === "week"
                    ? formatWeekRange(weekStart)
                    : new Date(`${monthDate}T12:00:00`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </p>
                <button onClick={calendarView === "week" ? goToCurrentWeek : goToCurrentMonth} className="text-[10px] text-tahfidz-green hover:underline">
                  {calendarView === "week" ? "Semaine actuelle" : "Mois actuel"}
                </button>
              </div>
              <button onClick={calendarView === "week" ? goToNextWeek : goToNextMonth}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95">
                <ChevronRight size={18} />
              </button>
            </div>

            {/* View toggle */}
            <div className="flex items-center justify-center">
              <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 p-0.5 bg-gray-50 dark:bg-gray-700/50">
                <button
                  onClick={() => setCalendarView("week")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition",
                    calendarView === "week"
                      ? "bg-tahfidz-green text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  )}>
                  Semaine
                </button>
                <button
                  onClick={() => setCalendarView("month")}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-bold transition",
                    calendarView === "month"
                      ? "bg-tahfidz-green text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  )}>
                  Mois
                </button>
              </div>
            </div>

            {/* Info label */}
            <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p>
                Par défaut, vos enfants sont considérés <strong>présents</strong>. L’administration et l’enseignant ne seront informés qu’en cas de retard, d’absence ou d’absence excusée enregistrée.
              </p>
            </div>

            {/* Messages */}
            {error && mode === "week" && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {weekSaved && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-300">
                <CalendarCheck size={14} /> Présences enregistrées
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-tahfidz-green" />
              </div>
            ) : (
              <>
                {calendarView === "week" ? (
                  /* ═══════════════════ WEEK GRID ═══════════════════ */
                  <div className="grid grid-cols-7 gap-1">
                    {weekDays.map(dateStr => {
                    const d = new Date(`${dateStr}T12:00:00`)
                    const label = d.toLocaleDateString("fr-FR", { weekday: "narrow" })
                    const dayNum = d.getDate()
                    const isToday = dateStr === todayStr
                    const isSelected = selectedDay === dateStr
                    const dayChildren = getChildrenForDay(children, dateStr)
                    const hasCourses = dayChildren.length > 0

                    return (
                      <button
                        key={dateStr}
                        onClick={() => hasCourses && setSelectedDay(dateStr)}
                        disabled={!hasCourses}
                        className={cn(
                          "relative flex flex-col items-center rounded-xl p-1.5 min-h-[76px] sm:min-h-[90px] transition text-left",
                          isSelected
                            ? "ring-2 ring-tahfidz-green ring-offset-1 dark:ring-offset-gray-800 z-10"
                            : "",
                          isToday
                            ? "bg-orange-50 dark:bg-orange-900/20"
                            : hasCourses
                              ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                              : "opacity-50 cursor-default bg-gray-100/50 dark:bg-gray-800/50"
                        )}
                      >
                        <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-gray-500">{label}</span>
                        <span className={cn(
                          "w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold mt-0.5",
                          isToday ? "bg-orange-500 text-white" : "text-gray-800 dark:text-gray-100"
                        )}>
                          {dayNum}
                        </span>

                        {hasCourses && (
                          <div className="mt-auto flex flex-col items-center gap-1 w-full">
                            <div className="flex -space-x-1.5">
                              {dayChildren.slice(0, 3).map(child => (
                                <div key={child.student.id}
                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full gradient-tahfidz text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white dark:border-gray-700 overflow-hidden">
                                  {child.student.user.avatar ? (
                                    <Image src={child.student.user.avatar} alt={child.student.user.fullName} width={24} height={24} className="w-full h-full object-cover" />
                                  ) : (
                                    child.student.user.fullName.charAt(0)
                                  )}
                                </div>
                              ))}
                              {dayChildren.length > 3 && (
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white dark:border-gray-700">
                                  +{dayChildren.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                ) : (
                  /* ═══════════════════ MONTH GRID ═══════════════════ */
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                    <div className="grid grid-cols-7 gap-1">
                      {["D", "L", "M", "M", "J", "V", "S"].map((h, i) => (
                        <div key={i} className="text-center text-[9px] font-bold text-gray-400 dark:text-gray-500 py-1">{h}</div>
                      ))}
                      {buildMonthGridForChildren(monthDate, children).map((cell, i) => {
                        const dateStr = cell.dateStr
                        if (!dateStr) return <div key={i} className="min-h-[72px] sm:min-h-[88px]" />
                        const dayChildren = getChildrenForDay(children, dateStr)
                        const hasCourses = dayChildren.length > 0
                        const isSelected = selectedDay === dateStr

                        return (
                          <button
                            key={i}
                            onClick={() => hasCourses && setSelectedDay(dateStr)}
                            disabled={!hasCourses}
                            className={cn(
                              "relative w-full h-full min-h-[72px] sm:min-h-[88px] rounded-lg text-xs flex flex-col items-start p-1.5 transition active:scale-95 overflow-hidden text-left",
                              isSelected
                                ? "ring-2 ring-tahfidz-green ring-offset-1 dark:ring-offset-gray-700 z-10"
                                : "",
                              cell.isToday
                                ? "bg-orange-50 dark:bg-orange-900/20"
                                : hasCourses
                                  ? "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  : "bg-gray-100/50 dark:bg-gray-800/50 opacity-50 cursor-default"
                            )}
                          >
                            <span className={cn(
                              "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                              isSelected ? "bg-tahfidz-green text-white" : cell.isToday ? "bg-orange-500 text-white" : "text-gray-700 dark:text-gray-300"
                            )}>
                              {cell.dayNum}
                            </span>

                            {hasCourses && (
                              <div className="mt-auto w-full">
                                <div className="flex -space-x-1.5">
                                  {dayChildren.slice(0, 4).map(child => (
                                    <div key={child.student.id}
                                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-full gradient-tahfidz text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white dark:border-gray-700 overflow-hidden"
                                      title={child.student.user.fullName}>
                                      {child.student.user.avatar ? (
                                        <Image src={child.student.user.avatar} alt={child.student.user.fullName} width={24} height={24} className="w-full h-full object-cover" />
                                      ) : (
                                        child.student.user.fullName.charAt(0)
                                      )}
                                    </div>
                                  ))}
                                  {dayChildren.length > 4 && (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[8px] sm:text-[9px] font-bold flex items-center justify-center border border-white dark:border-gray-700">
                                      +{dayChildren.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Selected day sheet */}
                {selectedDay && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 sm:p-4 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
                          {new Date(`${selectedDay}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {getChildrenForDay(children, selectedDay).length} enfant(s) avec cours
                        </p>
                      </div>
                      <button onClick={() => setSelectedDay(null)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition">
                        <X size={16} />
                      </button>
                    </div>

                    {/* Apply to all */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Appliquer à tous :</span>
                      {STATUS_OPTIONS.map(opt => (
                        <button key={opt.value}
                          onClick={() => applyStatusToAll(opt.value)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border transition",
                            "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          )}>
                          <opt.icon size={10} /> {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Children list */}
                    <div className="space-y-2">
                      {getChildrenForDay(children, selectedDay).map(child => {
                        const status = draftStatuses[child.student.id]
                        return (
                          <div key={child.student.id}
                            className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-700/50">
                            <button onClick={() => enterChildMode(child)}
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full gradient-tahfidz text-white font-bold text-sm flex items-center justify-center overflow-hidden shrink-0">
                              {child.student.user.avatar ? (
                                <Image src={child.student.user.avatar} alt={child.student.user.fullName} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                child.student.user.fullName.charAt(0)
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{child.student.user.fullName}</p>
                              <p className="text-[10px] text-gray-400 truncate">{child.student.group?.name}</p>
                            </div>
                            <div className="flex gap-1">
                              {STATUS_OPTIONS.map(opt => {
                                const isSelected = status === opt.value
                                return (
                                  <button key={opt.value}
                                    onClick={() => setDraftStatus(child.student.id, opt.value)}
                                    className={cn(
                                      "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition active:scale-95",
                                      isSelected
                                        ? opt.value === "PRESENT"
                                          ? "bg-gray-300 dark:bg-gray-500 text-white shadow-sm"
                                          : `${opt.bg} text-white shadow-sm`
                                        : "bg-white dark:bg-gray-600 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500"
                                    )}>
                                    <opt.icon size={14} />
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Reason input */}
                    {Object.values(draftStatuses).some(s => s === "ABSENT" || s === "EXCUSED" || s === "LATE") && (
                      <input
                        type="text"
                        value={draftReason}
                        onChange={e => setDraftReason(e.target.value)}
                        placeholder="Motif commun (maladie, voyage…)"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green transition"
                      />
                    )}

                    {/* Save */}
                    {dayHasChanges && (
                      <button
                        onClick={saveBulkAttendance}
                        disabled={weekSaving}
                        className="w-full flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition shadow-lg active:scale-[0.98]">
                        {weekSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {weekSaving ? "Enregistrement…" : "Enregistrer"}
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ) : selectedChild ? (
          /* ═══════════════════ CHILD MODE ═══════════════════ */
          <>
            {/* Month calendar with status bars */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide">
                  {MONTH_NAMES[monthYear.getMonth()]} {monthYear.getFullYear()}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  {STATUS_OPTIONS.map(opt => (
                    <span key={opt.value} className="flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400">
                      <span className={cn("w-2 h-2 rounded-full", opt.bg)} />
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["D", "L", "M", "M", "J", "V", "S"].map((h, i) => (
                  <div key={i} className="text-center text-[9px] font-bold text-gray-400 dark:text-gray-500 py-1">{h}</div>
                ))}
                {monthCells.map((cell, i) => {
                  const cfg = cell.status ? statusConfig[cell.status] : null
                  const isSelected = cell.dateStr === activeDate
                  const clickable = cell.isCourseDay && cell.isFuture

                  const cellBase = cn(
                    "relative w-full h-full min-h-[64px] sm:min-h-[84px] rounded-lg text-xs flex flex-col items-start p-1.5 transition active:scale-95 overflow-hidden text-left",
                    isSelected
                      ? "ring-2 ring-tahfidz-green ring-offset-1 dark:ring-offset-gray-700 z-10"
                      : "",
                    !cell.dateStr
                      ? "bg-transparent"
                      : cell.isToday
                        ? "bg-orange-50 dark:bg-orange-900/20"
                        : clickable
                          ? "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                          : "bg-gray-100/50 dark:bg-gray-800/50"
                  )

                  const tooltipContent = cfg && (
                    <div className="space-y-0.5">
                      <p className="font-bold">{cfg.label}</p>
                      <p>{new Date((cell.dateStr || "") + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}</p>
                      {cell.reason && <p className="italic opacity-90">Motif : {cell.reason}</p>}
                    </div>
                  )

                  const dayContent = (
                    <button
                      key={i}
                      disabled={!clickable}
                      onClick={() => cell.dateStr && clickable && changeDay(cell.dateStr)}
                      className={cellBase}
                    >
                      <span className={cn(
                        "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                        isSelected ? "bg-tahfidz-green text-white" : "text-gray-700 dark:text-gray-300"
                      )}>
                        {cell.dayNum}
                      </span>

                      {cfg && (
                        <div className={cn(
                          "mt-auto w-full rounded-md px-1.5 py-1 text-[10px] font-semibold leading-tight border",
                          cfg.light, cfg.text, cfg.border
                        )}>
                          <div className="flex items-center gap-1">
                            <cfg.icon size={10} className="shrink-0" />
                            <span className="truncate">{cfg.label}</span>
                          </div>
                          {cell.reason && (
                            <div className="truncate opacity-80 text-[9px] mt-0.5">{cell.reason}</div>
                          )}
                        </div>
                      )}
                    </button>
                  )

                  return cfg ? (
                    <CalendarDayTooltip key={i} content={tooltipContent}>
                      {dayContent}
                    </CalendarDayTooltip>
                  ) : (
                    <div key={i} className="h-full">{dayContent}</div>
                  )
                })}
              </div>
            </div>

            {/* Active day bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={goPrev} disabled={!canGoPrev}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95">
                <ChevronLeft size={16} />
              </button>

              <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{activeLabel.full}</p>
                    <p className="text-[11px] text-gray-400">{selectedChild.student.group?.name}</p>
                  </div>
                  {markedDates.has(activeDate) && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-bold shrink-0">
                      <Check size={10} /> Marqué
                    </span>
                  )}
                </div>
              </div>

              <button onClick={goNext} disabled={!canGoNext}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {saved && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-300">
                <CalendarCheck size={14} /> Présence enregistrée
              </div>
            )}

            {/* Status selector */}
            {!isFuture ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-400 dark:text-gray-400">Sélectionnez un jour à venir.</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-tahfidz-green" />
              </div>
            ) : !hasCourseOnDay(selectedChild, activeDate) ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <p className="text-sm text-gray-400 dark:text-gray-400">Pas de cours ce jour.</p>
              </div>
            ) : (
              <div key={animKey} className="rounded-xl border p-3 sm:p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4"
                style={{ animationFillMode: "both" }}>

                {/* Child header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm overflow-hidden ${
                    status ? selectedOpt?.bg : "gradient-tahfidz"
                  }`}>
                    {selectedChild.student.user.avatar ? (
                      <Image src={selectedChild.student.user.avatar} alt={selectedChild.student.user.fullName} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      selectedChild.student.user.fullName.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{selectedChild.student.user.fullName}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      <span className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded mr-1 font-semibold">{RELATION_LABELS[selectedChild.relation] ?? selectedChild.relation}</span>
                      {selectedChild.student.group?.name}
                    </p>
                  </div>
                  {status && selectedOpt && (
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${selectedOpt.light} ${selectedOpt.text} shrink-0`}>
                      <selectedOpt.icon size={10} className="inline mr-0.5" /> {selectedOpt.label}
                    </span>
                  )}
                </div>

                {/* Status buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {STATUS_OPTIONS.map(opt => {
                    const isSelected = status === opt.value
                    return (
                      <button key={opt.value}
                        onClick={() => setStatus(opt.value)}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 py-2.5 sm:py-2 rounded-xl text-xs font-bold border-2 transition-all duration-150 active:scale-95 ${
                          isSelected
                            ? `${opt.bg} text-white border-transparent shadow-sm`
                            : "border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 bg-white dark:bg-gray-800"
                        }`}>
                        <opt.icon size={15} className="sm:size-[13px]" />
                        <span className="hidden sm:inline">{opt.label}</span>
                        <span className="sm:hidden text-[9px]">{opt.short}</span>
                      </button>
                    )
                  })}
                </div>

                {(status === "ABSENT" || status === "EXCUSED") && (
                  <input type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Motif (maladie, voyage…)"
                    className="w-full mt-2.5 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green transition" />
                )}

                {/* Save button */}
                <button
                  onClick={saveAttendance}
                  disabled={saving || !status || !isFuture || ((status === "ABSENT" || status === "EXCUSED") && !note.trim())}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition shadow-lg active:scale-[0.98]">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            )}


          </>
        ) : null}
      </div>
    </div>
  )
}
