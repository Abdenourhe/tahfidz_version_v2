"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import {
  Save, Loader2, Check, Clock, BookOpen, X,
  CalendarCheck, AlertCircle, ChevronLeft, ChevronRight,
  ArrowLeft, CalendarDays
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

interface AttendanceRecord {
  id: string
  date: string
  status: string
  reason: string | null
  validatedBy: string | null
  validatedAt: string | null
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

function offsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function dateLabel(dateStr: string) {
  const d = new Date(`${dateStr}T12:00:00`)
  return {
    full: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    short: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }),
  }
}

function buildMonthGrid(activeDate: string, courseDayIndices: number[]) {
  const d = new Date(`${activeDate}T12:00:00`)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const todayStr = new Date().toISOString().split("T")[0]

  const cells: { dateStr?: string; dayNum?: number; isCourseDay: boolean; isToday: boolean; isFuture: boolean }[] = []

  for (let i = 0; i < startOffset; i++) cells.push({ isCourseDay: false, isToday: false, isFuture: false })

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    const weekday = new Date(year, month, day).getDay()
    cells.push({ dateStr, dayNum: day, isCourseDay: courseDayIndices.includes(weekday), isToday: dateStr === todayStr, isFuture: dateStr > todayStr })
  }

  return cells
}

const statusConfig: Record<string, { label: string; light: string; text: string; border: string; bg: string; icon: any }> = Object.fromEntries(
  STATUS_OPTIONS.map(o => [o.value, { label: o.label, light: o.light, text: o.text, border: o.border, bg: o.bg, icon: o.icon }])
)

/* ------------------------------------------------------------------ */

export function ParentProfileAttendance({ children }: { children: Child[] }) {
  const todayStr = offsetDate(0)
  const tomorrow = offsetDate(1)

  const [mode, setMode] = useState<"list" | "child">("list")
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)

  // Child mode states
  const [activeDate, setActiveDate] = useState<string>(tomorrow)
  const [status, setStatus] = useState<string>("")
  const [note, setNote] = useState<string>("")
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set())
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: string; reason?: string }>>({})
  const [history, setHistory] = useState<AttendanceRecord[]>([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [animKey, setAnimKey] = useState(0)

  // Touch swipe
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  // List mode: recent status per child
  const [childRecentStatus, setChildRecentStatus] = useState<Record<string, { status: string; date: string }>>({})

  /* Load recent statuses for list mode */
  useEffect(() => {
    async function loadRecent() {
      try {
        const res = await fetch("/api/parent-attendance")
        const data = await res.json()
        const attendances = data.attendances || []
        const map: Record<string, { status: string; date: string }> = {}
        attendances.forEach((a: any) => {
          const dateStr = new Date(a.date).toISOString().split("T")[0]
          if (!map[a.studentId] || dateStr > map[a.studentId].date) {
            map[a.studentId] = { status: a.status, date: dateStr }
          }
        })
        setChildRecentStatus(map)
      } catch (e) {
        console.error(e)
      }
    }
    loadRecent()
  }, [mode])

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
      const historyList: AttendanceRecord[] = []

      attRecords.forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        map[dateStr] = { status: a.status, reason: a.notes }
        marked.add(dateStr)
        historyList.push({
          id: `att-${a.id}`,
          date: dateStr,
          status: a.status,
          reason: a.notes,
          validatedBy: a.recordedBy ? "system" : null,
          validatedAt: a.createdAt,
        })
      })

      paRecords.forEach((a: any) => {
        const dateStr = new Date(a.date).toISOString().split("T")[0]
        map[dateStr] = { status: a.status, reason: a.reason || undefined }
        marked.add(dateStr)
        historyList.push({
          id: a.id,
          date: dateStr,
          status: a.status,
          reason: a.reason,
          validatedBy: a.validatedBy,
          validatedAt: a.validatedAt,
        })
      })

      setAttendanceMap(map)
      setMarkedDates(marked)
      setHistory(historyList.sort((a, b) => +new Date(b.date) - +new Date(a.date)))

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
  const monthCells = buildMonthGrid(activeDate, childCourseDayIndices)
  const monthYear = new Date(`${activeDate}T12:00:00`)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Header */}
      <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          {mode === "list" ? "Présences" : selectedChild?.student.user.fullName}
        </h2>
        {mode === "child" && (
          <button onClick={() => { setMode("list"); setSelectedChild(null) }}
            className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 transition">
            <ArrowLeft size={14} /> Retour
          </button>
        )}
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        {mode === "list" ? (
          /* ═══════════════════ LIST MODE ═══════════════════ */
          <div className="grid gap-3">
            {children.map(child => {
              const recent = childRecentStatus[child.student.id]
              const cfg = recent ? statusConfig[recent.status] : null
              return (
                <button key={child.id}
                  onClick={() => enterChildMode(child)}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-tahfidz-green/30 hover:shadow-sm transition text-left w-full">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-lg shadow-sm overflow-hidden gradient-tahfidz">
                    {child.student.user.avatar ? (
                      <Image src={child.student.user.avatar} alt={child.student.user.fullName} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      child.student.user.fullName.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{child.student.user.fullName}</p>
                    <p className="text-[11px] text-gray-400 truncate">
                      <span className="bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded mr-1 font-semibold">{RELATION_LABELS[child.relation] ?? child.relation}</span>
                      {child.student.group?.name}
                    </p>
                  </div>
                  {cfg ? (
                    <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg ${cfg.light} ${cfg.text} ${cfg.border} border shrink-0`}>
                      <cfg.icon size={11} className="inline mr-0.5" /> {cfg.label}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-100 shrink-0 flex items-center gap-1">
                      <CalendarDays size={11} /> Marquer
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : selectedChild ? (
          /* ═══════════════════ CHILD MODE ═══════════════════ */
          <>
            {/* Mini calendar */}
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                  {MONTH_NAMES[monthYear.getMonth()]} {monthYear.getFullYear()}
                </p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Marqué</span>
                  <span className="flex items-center gap-1 text-[9px] text-gray-400"><span className="w-2 h-2 rounded-full bg-tahfidz-green" /> Actif</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["D", "L", "M", "M", "J", "V", "S"].map((h, i) => (
                  <div key={i} className="text-center text-[9px] font-bold text-gray-300 py-1">{h}</div>
                ))}
                {monthCells.map((cell, i) => (
                  <button key={i}
                    disabled={!cell.isCourseDay || !cell.isFuture}
                    onClick={() => cell.dateStr && cell.isCourseDay && cell.isFuture && changeDay(cell.dateStr)}
                    className={`h-9 sm:h-8 rounded-lg text-xs sm:text-[10px] font-bold flex items-center justify-center transition active:scale-90 ${
                      cell.dateStr === activeDate
                        ? "bg-tahfidz-green text-white shadow-sm"
                        : cell.isToday
                          ? "bg-orange-100 text-orange-600"
                          : cell.isFuture && cell.isCourseDay
                            ? markedDates.has(cell.dateStr!)
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "hover:bg-gray-200 text-gray-600"
                            : "text-gray-200 cursor-default"
                    }`}>
                    {cell.dayNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Active day bar */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={goPrev} disabled={!canGoPrev}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95">
                <ChevronLeft size={16} />
              </button>

              <div className="flex-1 bg-gray-50 rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{activeLabel.full}</p>
                    <p className="text-[11px] text-gray-400">{selectedChild.student.group?.name}</p>
                  </div>
                  {markedDates.has(activeDate) && (
                    <span className="flex items-center gap-1 text-[10px] px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold shrink-0">
                      <Check size={10} /> Marqué
                    </span>
                  )}
                </div>
              </div>

              <button onClick={goNext} disabled={!canGoNext}
                className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95">
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
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Sélectionnez un jour à venir.</p>
              </div>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={28} className="animate-spin text-tahfidz-green" />
              </div>
            ) : !hasCourseOnDay(selectedChild, activeDate) ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-400">Pas de cours ce jour.</p>
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
                    <p className="text-sm font-bold text-gray-900 truncate">{selectedChild.student.user.fullName}</p>
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
                            : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 bg-white"
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
                    className="w-full mt-2.5 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green transition" />
                )}

                {/* Save button */}
                <button
                  onClick={saveAttendance}
                  disabled={saving || !status || !isFuture}
                  className="w-full mt-3 flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition shadow-lg active:scale-[0.98]">
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Historique</h3>
                {history.slice(0, 10).map(r => {
                  const cfg = statusConfig[r.status] || statusConfig.PRESENT
                  return (
                    <div key={r.id} className={`flex items-center justify-between p-2.5 rounded-lg border ${cfg.light} ${cfg.border}`}>
                      <div className="flex items-center gap-2">
                        <cfg.icon size={12} className={cfg.text} />
                        <div>
                          <p className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</p>
                          <p className="text-[10px] text-gray-400">{new Date(r.date).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</p>
                          {r.reason && <p className="text-[10px] text-gray-500">{r.reason}</p>}
                        </div>
                      </div>
                      {r.validatedBy ? (
                        <span className="text-[9px] px-1.5 py-0.5 bg-white rounded-full text-gray-400 border border-gray-100">Validé</span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 bg-white rounded-full text-amber-500 border border-amber-100">En attente</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
