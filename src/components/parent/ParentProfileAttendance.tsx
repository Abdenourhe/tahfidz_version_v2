"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Save, Loader2, Check, Clock, BookOpen, X,
  CalendarCheck, AlertCircle, ChevronLeft, ChevronRight,
  Users, Sparkles
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
  { value: "PRESENT", label: "Présent",  icon: Check,    color: "emerald", bg: "bg-emerald-500",  light: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200",  ring: "ring-emerald-200" },
  { value: "LATE",    label: "Retard",   icon: Clock,    color: "amber",   bg: "bg-amber-500",    light: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200",    ring: "ring-amber-200" },
  { value: "EXCUSED", label: "Excusé",   icon: BookOpen, color: "blue",    bg: "bg-blue-500",     light: "bg-blue-50",     text: "text-blue-700",     border: "border-blue-200",     ring: "ring-blue-200" },
  { value: "ABSENT",  label: "Absent",   icon: X,        color: "red",     bg: "bg-red-500",      light: "bg-red-50",      text: "text-red-700",      border: "border-red-200",      ring: "ring-red-200" },
]

const RELATION_LABELS: Record<string, string> = { father: "Père", mother: "Mère", guardian: "Tuteur" }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
const DAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"] as const
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

function dateLabel(dateStr: string): { day: string; num: number; month: string; full: string } {
  const d = new Date(`${dateStr}T12:00:00`)
  return {
    day: DAY_SHORT[d.getDay()],
    num: d.getDate(),
    month: MONTH_NAMES[d.getMonth()],
    full: d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }),
  }
}

function groupByMonth(days: string[]): Record<string, string[]> {
  return days.reduce((acc, d) => {
    const date = new Date(`${d}T12:00:00`)
    const key = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {} as Record<string, string[]>)
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
  const [dayWindow,   setDayWindow]   = useState(30)
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  const isFuture = activeDate > todayStr
  const activeLabel = dateLabel(activeDate)

  /* ── Course days ── */
  const courseDayIndices = getCourseDayIndices(children)
  const quickDays = Array.from({ length: dayWindow }, (_, i) => offsetDate(i + 1))
    .filter(d => {
      const dayIdx = new Date(`${d}T12:00:00`).getDay()
      return courseDayIndices.includes(dayIdx)
    })

  /* ── Load marked dates ── */
  const loadMarkedDates = useCallback(async () => {
    if (quickDays.length === 0) return
    const start = quickDays[0]
    const end = quickDays[quickDays.length - 1]
    try {
      const res = await fetch(`/api/attendance?dateFrom=${start}&dateTo=${end}`)
      const data = await res.json()
      const marked = new Set<string>()
      ;(data.attendances || []).forEach((a: any) => {
        marked.add(a.date.split("T")[0])
      })
      setMarkedDates(marked)
    } catch { /* ignore */ }
  }, [quickDays])

  useEffect(() => { loadMarkedDates() }, [loadMarkedDates])

  /* ── Load active date ── */
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
          if (rec?.status) {
            att[id] = rec.status
            nts[id] = rec.notes || ""
          }
        } catch { /* ignore */ }
      }))
      setAttendance(prev => ({ ...prev, [activeDate]: att }))
      setNotes(prev => ({ ...prev, [activeDate]: nts }))
    } finally {
      setLoading(false)
    }
  }, [activeDate, isFuture, children])

  useEffect(() => { load() }, [load])

  const selectStatus = (studentId: string, value: string) => {
    setSaved(false); setError(null); setShowConfirm(false)
    setAttendance(prev => ({
      ...prev,
      [activeDate]: {
        ...(prev[activeDate] || {}),
        [studentId]: prev[activeDate]?.[studentId] === value ? "" : value
      }
    }))
  }

  const markAllPresent = () => {
    setSaved(false); setError(null)
    const next: Record<string, string> = {}
    dayChildren.forEach(c => { next[c.student.id] = "PRESENT" })
    setAttendance(prev => ({ ...prev, [activeDate]: next }))
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
      .map(c => ({
        groupId:   c.student.group!.id,
        studentId: c.student.id,
        status:    attendance[activeDate][c.student.id],
        notes:     notes[activeDate]?.[c.student.id] || "",
      }))

    if (records.length === 0) {
      setError("Sélectionnez au moins un statut pour enregistrer.")
      return
    }

    setSaving(true)
    try {
      const byGroup = new Map<string, typeof records>()
      records.forEach(r => {
        if (!byGroup.has(r.groupId)) byGroup.set(r.groupId, [])
        byGroup.get(r.groupId)!.push(r)
      })

      const responses = await Promise.all(
        [...byGroup.entries()].map(([groupId, grpRecords]) =>
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              date:       `${activeDate}T12:00:00.000Z`,
              studentIds: grpRecords.map(r => r.studentId),
              records:    grpRecords.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes })),
            }),
          })
        )
      )

      const errs: string[] = []
      for (const res of responses) {
        if (!res.ok) {
          try {
            const j = await res.json()
            if (typeof j.error === "string") errs.push(j.error)
            else if (j.error) errs.push(JSON.stringify(j.error))
            else if (j.message) errs.push(j.message)
            else errs.push(`Erreur ${res.status}`)
          } catch { errs.push(`Erreur ${res.status}`) }
        }
      }

      if (errs.length > 0) {
        setError(errs.join(" · "))
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 5000)
        loadMarkedDates()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  const dayChildren = children.filter(c => hasCourseOnDay(c, activeDate))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* ── Header ── */}
      <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <CalendarCheck size={18} className="text-tahfidz-green" />
            Présences
          </h2>
          <p className="text-xs text-gray-400">Cliquez un jour → marquez les enfants</p>
        </div>
      </div>

      <div className="p-5 space-y-5">

        {/* ── Date selector ── */}
        <div className="space-y-3">
          {Object.entries(groupByMonth(quickDays)).map(([month, days]) => (
            <div key={month}>
              <p className="text-[11px] font-bold text-gray-300 uppercase tracking-wider mb-2">{month}</p>
              <div className="flex gap-2 flex-wrap">
                {days.map(d => {
                  const isActive = d === activeDate
                  const isMarked = markedDates.has(d)
                  const label = dateLabel(d)
                  return (
                    <button key={d}
                      onClick={() => { setActiveDate(d); setSaved(false); setError(null); setShowConfirm(false) }}
                      className={`relative flex flex-col items-center px-3 py-2 rounded-xl border-2 transition-all duration-150 min-w-[60px] active:scale-95 ${
                        isActive
                          ? "border-tahfidz-green bg-tahfidz-green-light shadow-sm"
                          : isMarked
                            ? "border-emerald-200 bg-emerald-50/50 text-gray-600 hover:border-emerald-300"
                            : "border-gray-100 bg-white text-gray-400 hover:border-gray-300 hover:bg-gray-50"
                      }`}>
                      {isMarked && !isActive && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                      )}
                      <span className={`text-[10px] font-semibold uppercase tracking-wide ${isActive ? "text-tahfidz-green" : isMarked ? "text-emerald-600" : "text-gray-400"}`}>
                        {label.day}
                      </span>
                      <span className={`text-lg font-bold leading-tight ${isActive ? "text-tahfidz-green" : "text-gray-700"}`}>
                        {label.num}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {quickDays.length > 0 && dayWindow < 90 && (
            <button onClick={() => setDayWindow(w => Math.min(w + 30, 90))}
              className="text-xs font-semibold text-tahfidz-green hover:text-tahfidz-green-dark transition flex items-center gap-1">
              <ChevronRight size={12} /> Voir plus de dates
            </button>
          )}
        </div>

        {/* ── Active day bar ── */}
        <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
          <div>
            <p className="text-sm font-bold text-gray-800">{activeLabel.full}</p>
            <p className="text-[11px] text-gray-400">
              {dayChildren.length} enfant{dayChildren.length > 1 ? "s" : ""} inscrit{dayChildren.length > 1 ? "s" : ""}
            </p>
          </div>
          {markedDates.has(activeDate) && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full font-bold">
              <Check size={10} /> Déjà marqué
            </span>
          )}
        </div>

        {/* ── Live summary chips ── */}
        {isFuture && totalMarked > 0 && (
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(opt => {
              const count = summary[opt.value]
              if (!count) return null
              return (
                <span key={opt.value}
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${opt.light} ${opt.text} ${opt.border}`}>
                  <opt.icon size={11} />
                  {count} {opt.label.toLowerCase()}{count > 1 ? "s" : ""}
                </span>
              )
            })}
          </div>
        )}

        {/* ── Messages ── */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-semibold animate-in fade-in slide-in-from-top-1 duration-300">
            <CalendarCheck size={14} /> Présence enregistrée pour le {activeLabel.full}
          </div>
        )}

        {/* ── Children cards ── */}
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
            <p className="text-sm text-gray-400">
              {courseDayIndices.length === 0
                ? "Aucun horaire de cours défini."
                : "Aucun enfant n'a cours ce jour-là."}
            </p>
          </div>
        ) : (
          <>
            {/* Quick action */}
            <button onClick={markAllPresent}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-emerald-200 text-emerald-600 text-xs font-bold hover:bg-emerald-50 hover:border-emerald-300 transition">
              <Sparkles size={13} /> Tous présents ({dayChildren.length} enfants)
            </button>

            <div className="space-y-3">
              {dayChildren.map(child => {
                const status = attendance[activeDate]?.[child.student.id] || ""
                const opt = STATUS_OPTIONS.find(o => o.value === status)
                return (
                  <div key={child.id}
                    className={`rounded-xl border p-4 transition-all duration-200 ${
                      status ? `${opt?.light} ${opt?.border}` : "border-gray-100 bg-white"
                    }`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm shadow-sm ${
                        status ? opt?.bg : "gradient-tahfidz"
                      }`}>
                        {child.student.user.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{child.student.user.fullName}</p>
                        <p className="text-[10px] text-gray-400 truncate">
                          <span className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded mr-1 font-semibold">
                            {RELATION_LABELS[child.relation] ?? child.relation}
                          </span>
                          {child.student.group?.name}
                        </p>
                      </div>
                      {status && opt && (
                        <span className={`ml-auto text-[10px] font-bold px-2 py-1 rounded-lg ${opt.light} ${opt.text}`}>
                          <opt.icon size={10} className="inline mr-0.5" />
                          {opt.label}
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {STATUS_OPTIONS.map(opt => {
                        const isSelected = status === opt.value
                        return (
                          <button key={opt.value}
                            onClick={() => selectStatus(child.student.id, opt.value)}
                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all duration-150 active:scale-95 ${
                              isSelected
                                ? `${opt.bg} text-white border-transparent shadow-sm`
                                : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 bg-white"
                            }`}>
                            <opt.icon size={13} />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {(status === "ABSENT" || status === "EXCUSED") && (
                      <input type="text"
                        value={notes[activeDate]?.[child.student.id] || ""}
                        onChange={e => setNotes(p => ({
                          ...p,
                          [activeDate]: { ...(p[activeDate] || {}), [child.student.id]: e.target.value }
                        }))}
                        placeholder="Motif (maladie, voyage, rendez-vous…)"
                        className="w-full mt-2.5 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 focus:border-tahfidz-green transition" />
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── Save ── */}
        {isFuture && !loading && dayChildren.length > 0 && (
          <div className="space-y-2 pt-2">
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
              {saving
                ? "Enregistrement…"
                : !showConfirm
                  ? `Enregistrer les présences (${totalMarked})`
                  : "Confirmer l'enregistrement"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
