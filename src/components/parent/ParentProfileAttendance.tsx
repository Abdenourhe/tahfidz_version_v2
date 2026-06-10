"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Save, Loader2, Check, Clock, BookOpen, X,
  CalendarCheck, AlertCircle, ChevronLeft, ChevronRight,
  Sparkles, Undo2
} from "lucide-react"

interface Child {
  id: string
  relation: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null }
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

function getCourseDayIndices(children: Child[]): number[] {
  const indices = new Set<number>()
  children.forEach(child => {
    const schedule = child.student.group?.schedule
    if (schedule) {
      Object.keys(schedule).forEach(day => {
        const idx = DAY_KEYS.indexOf(day.toLowerCase() as typeof DAY_KEYS[number])
        if (idx >= 0) indices.add(idx)
      })
    }
  })
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

export function ParentProfileAttendance({ children }: { children: Child[] }) {
  const todayStr = offsetDate(0)
  const tomorrow = offsetDate(1)

  const [activeDate,  setActiveDate]  = useState<string>(tomorrow)
  const [attendance,  setAttendance]  = useState<Record<string, Record<string, string>>>({})
  const [notes,       setNotes]       = useState<Record<string, Record<string, string>>>({})
  const [loading,     setLoading]     = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)
  const [animKey,     setAnimKey]     = useState(0)

  const isFuture = activeDate > todayStr
  const activeLabel = dateLabel(activeDate)

  const courseDayIndices = getCourseDayIndices(children)
  const quickDays = Array.from({ length: 90 }, (_, i) => offsetDate(i + 1))
    .filter(d => courseDayIndices.includes(new Date(`${d}T12:00:00`).getDay()))

  const activeIndex = quickDays.indexOf(activeDate)
  const canGoPrev = activeIndex > 0
  const canGoNext = activeIndex >= 0 && activeIndex < quickDays.length - 1

  const goPrev = () => { if (canGoPrev) changeDay(quickDays[activeIndex - 1]) }
  const goNext = () => { if (canGoNext) changeDay(quickDays[activeIndex + 1]) }

  function changeDay(d: string) {
    setActiveDate(d); setSaved(false); setError(null); setShowConfirm(false); setAnimKey(k => k + 1)
  }

  /* Swipe */
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.changedTouches[0].screenX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return
    const diff = touchStartX.current - e.changedTouches[0].screenX
    if (diff > 50) goNext()
    else if (diff < -50) goPrev()
    touchStartX.current = null
  }

  /* Load marked */
  const loadMarkedDates = useCallback(async () => {
    if (quickDays.length === 0) return
    try {
      const res = await fetch(`/api/attendance?dateFrom=${quickDays[0]}&dateTo=${quickDays[quickDays.length - 1]}`)
      const data = await res.json()
      const marked = new Set<string>()
      ;(data.attendances || []).forEach((a: any) => { marked.add(a.date.split("T")[0]) })
      setMarkedDates(marked)
    } catch { /* ignore */ }
  }, [quickDays])

  useEffect(() => { loadMarkedDates() }, [loadMarkedDates])

  /* Load active */
  const load = useCallback(async () => {
    if (!isFuture) { setAttendance({}); setNotes({}); return }
    setLoading(true)
    try {
      const att: Record<string, string> = {}
      const nts: Record<string, string> = {}
      const ids = children.filter(c => c.student.group).map(c => c.student.id)
      await Promise.all(ids.map(async id => {
        try {
          const res = await fetch(`/api/attendance?studentId=${id}&dateFrom=${activeDate}&dateTo=${activeDate}`)
          const data = await res.json()
          const rec = (data.attendances || [])[0]
          if (rec?.status) { att[id] = rec.status; nts[id] = rec.notes || "" }
        } catch { /* ignore */ }
      }))
      setAttendance(prev => ({ ...prev, [activeDate]: att }))
      setNotes(prev => ({ ...prev, [activeDate]: nts }))
    } finally { setLoading(false) }
  }, [activeDate, isFuture, children])

  useEffect(() => { load() }, [load])

  const selectStatus = (studentId: string, value: string) => {
    setSaved(false); setError(null); setShowConfirm(false)
    setAttendance(prev => ({ ...prev, [activeDate]: { ...(prev[activeDate] || {}), [studentId]: prev[activeDate]?.[studentId] === value ? "" : value } }))
  }

  const markAllPresent = () => {
    setSaved(false); setError(null)
    const next: Record<string, string> = {}
    dayChildren.forEach(c => { next[c.student.id] = "PRESENT" })
    setAttendance(prev => ({ ...prev, [activeDate]: next }))
  }

  const clearAll = () => {
    setSaved(false); setError(null); setShowConfirm(false)
    setAttendance(prev => ({ ...prev, [activeDate]: {} }))
    setNotes(prev => ({ ...prev, [activeDate]: {} }))
  }

  const summary = (() => {
    const dayAtt = attendance[activeDate] || {}
    const counts: Record<string, number> = {}
    STATUS_OPTIONS.forEach(o => counts[o.value] = 0)
    Object.values(dayAtt).forEach(s => { if (counts[s] !== undefined) counts[s]++ })
    return counts
  })()

  const totalMarked = Object.values(summary).reduce((a, b) => a + b, 0)

  const save = async () => {
    setError(null); setSaved(false); setShowConfirm(false)
    const records = children
      .filter(c => c.student.group && attendance[activeDate]?.[c.student.id])
      .map(c => ({ groupId: c.student.group!.id, studentId: c.student.id, status: attendance[activeDate][c.student.id], notes: notes[activeDate]?.[c.student.id] || "" }))

    if (records.length === 0) { setError("Sélectionnez au moins un statut."); return }

    setSaving(true)
    try {
      const byGroup = new Map<string, typeof records>()
      records.forEach(r => { if (!byGroup.has(r.groupId)) byGroup.set(r.groupId, []); byGroup.get(r.groupId)!.push(r) })

      const responses = await Promise.all(
        [...byGroup.entries()].map(([groupId, grpRecords]) =>
          fetch("/api/attendance", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ groupId, date: `${activeDate}T12:00:00.000Z`, studentIds: grpRecords.map(r => r.studentId), records: grpRecords.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes })) }),
          })
        )
      )

      const errs: string[] = []
      for (const res of responses) {
        if (!res.ok) {
          try { const j = await res.json(); errs.push(typeof j.error === "string" ? j.error : j.message || `Erreur ${res.status}`) }
          catch { errs.push(`Erreur ${res.status}`) }
        }
      }

      if (errs.length > 0) setError(errs.join(" · "))
      else { setSaved(true); setTimeout(() => setSaved(false), 5000); loadMarkedDates() }
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur réseau") }
    finally { setSaving(false) }
  }

  const dayChildren = children.filter(c => hasCourseOnDay(c, activeDate))
  const monthCells = buildMonthGrid(activeDate, courseDayIndices)
  const monthYear = new Date(`${activeDate}T12:00:00`)

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* Header */}
      <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          Présences
        </h2>
        <p className="text-[10px] text-gray-400 hidden sm:block">Glissez ← → sur mobile</p>
      </div>

      <div className="p-4 sm:p-5 space-y-4">

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
                <p className="text-[11px] text-gray-400">{dayChildren.length} enfant{dayChildren.length > 1 ? "s" : ""}</p>
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

        {/* Summary chips */}
        {isFuture && totalMarked > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => {
              const count = summary[opt.value]
              if (!count) return null
              return (
                <span key={opt.value} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${opt.light} ${opt.text} ${opt.border}`}>
                  <opt.icon size={11} /> {count} {opt.label.toLowerCase()}{count > 1 ? "s" : ""}
                </span>
              )
            })}
            <button onClick={clearAll} className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition active:scale-95">
              <Undo2 size={10} /> Effacer
            </button>
          </div>
        )}

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

        {/* Children cards */}
        {!isFuture ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-400">Sélectionnez un jour à venir.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={28} className="animate-spin text-tahfidz-green" />
          </div>
        ) : dayChildren.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-400">{courseDayIndices.length === 0 ? "Aucun horaire défini." : "Aucun enfant n'a cours ce jour."}</p>
          </div>
        ) : (
          <>
            {/* Quick actions */}
            <div className="flex gap-2">
              <button onClick={markAllPresent}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-50 hover:border-emerald-300 transition active:scale-95">
                <Sparkles size={13} /> Tous présents
              </button>
              <button onClick={clearAll}
                className="px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-xs font-bold hover:bg-gray-50 hover:border-gray-300 transition active:scale-95">
                <Undo2 size={13} />
              </button>
            </div>

            <div key={animKey} className="space-y-3">
              {dayChildren.map((child, idx) => {
                const status = attendance[activeDate]?.[child.student.id] || ""
                const opt = STATUS_OPTIONS.find(o => o.value === status)
                return (
                  <div key={child.id}
                    className={`rounded-xl border p-3 sm:p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-4 ${
                      status ? `${opt?.light} ${opt?.border}` : "border-gray-100 bg-white"
                    }`}
                    style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}>

                    {/* Child header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm ${
                        status ? opt?.bg : "gradient-tahfidz"
                      }`}>
                        {child.student.user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{child.student.user.fullName}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          <span className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded mr-1 font-semibold">{RELATION_LABELS[child.relation] ?? child.relation}</span>
                          {child.student.group?.name}
                        </p>
                      </div>
                      {status && opt && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${opt.light} ${opt.text} shrink-0`}>
                          <opt.icon size={10} className="inline mr-0.5" /> {opt.label}
                        </span>
                      )}
                    </div>

                    {/* Status buttons — icon-only on mobile, icon+text on sm+ */}
                    <div className="grid grid-cols-4 gap-2">
                      {STATUS_OPTIONS.map(opt => {
                        const isSelected = status === opt.value
                        return (
                          <button key={opt.value}
                            onClick={() => selectStatus(child.student.id, opt.value)}
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
                        value={notes[activeDate]?.[child.student.id] || ""}
                        onChange={e => setNotes(p => ({ ...p, [activeDate]: { ...(p[activeDate] || {}), [child.student.id]: e.target.value } }))}
                        placeholder="Motif (maladie, voyage…)"
                        className="w-full mt-2.5 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green transition" />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Sticky save bar */}
        {isFuture && !loading && dayChildren.length > 0 && (
          <div className="sticky bottom-0 -mx-4 sm:-mx-5 -mb-4 sm:-mb-5 px-4 sm:px-5 pb-4 sm:pb-5 pt-3 bg-white/95 backdrop-blur-sm border-t border-gray-100 space-y-2">
            {showConfirm && totalMarked > 0 && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-700">Récapitulatif :</p>
                {STATUS_OPTIONS.map(opt => {
                  const count = summary[opt.value]
                  if (!count) return null
                  return (
                    <div key={opt.value} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${opt.bg}`} />
                      <span>{count} {opt.label.toLowerCase()}{count > 1 ? "s" : ""}</span>
                    </div>
                  )
                })}
              </div>
            )}

            <button
              onClick={() => { if (!showConfirm && totalMarked > 0) { setShowConfirm(true); setError(null) } else { save() } }}
              disabled={saving || totalMarked === 0}
              className="w-full flex items-center justify-center gap-2 py-3.5 gradient-tahfidz text-white text-sm font-bold rounded-xl hover:opacity-90 disabled:opacity-40 transition shadow-lg active:scale-[0.98]">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Enregistrement…" : !showConfirm ? `Enregistrer (${totalMarked})` : "Confirmer"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
