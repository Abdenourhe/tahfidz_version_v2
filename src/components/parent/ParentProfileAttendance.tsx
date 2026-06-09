"use client"
// ParentProfileAttendance.tsx — Un jour actif à la fois, affichage immédiat

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Check, Clock, BookOpen, X, CalendarCheck, AlertCircle, Info } from "lucide-react"

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
  { value: "PRESENT", label: "Présent", icon: Check,    active: "bg-emerald-500 text-white border-emerald-500 shadow-sm",   inactive: "border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600 bg-white" },
  { value: "LATE",    label: "Retard",  icon: Clock,    active: "bg-amber-500 text-white border-amber-500 shadow-sm", inactive: "border-gray-200 text-gray-500 hover:border-amber-300 hover:text-amber-600 bg-white" },
  { value: "EXCUSED", label: "Excusé",  icon: BookOpen, active: "bg-blue-500 text-white border-blue-500 shadow-sm",     inactive: "border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600 bg-white" },
  { value: "ABSENT",  label: "Absent",  icon: X,        active: "bg-red-500 text-white border-red-500 shadow-sm",       inactive: "border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600 bg-white" },
]

const RELATION_LABELS: Record<string, string> = { father: "Père", mother: "Mère", guardian: "Tuteur" }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
const MONTH_NAMES: Record<string, string> = {
  "0": "Janvier", "1": "Février", "2": "Mars", "3": "Avril", "4": "Mai", "5": "Juin",
  "6": "Juillet", "7": "Août", "8": "Septembre", "9": "Octobre", "10": "Novembre", "11": "Décembre",
}

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

function formatShortDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })
}

function formatFullDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
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
  const today    = offsetDate(0)
  const tomorrow = offsetDate(1)

  const [activeDate,   setActiveDate]   = useState<string>(tomorrow)
  const [attendance,   setAttendance]   = useState<Record<string, Record<string, string>>>({})
  const [notes,        setNotes]        = useState<Record<string, Record<string, string>>>({})
  const [loading,      setLoading]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [saved,        setSaved]        = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [dayWindow,    setDayWindow]    = useState(30)
  const [markedDates,  setMarkedDates]  = useState<Set<string>>(new Set())

  const isFuture = activeDate > today

  // ── Course days ──
  const courseDayIndices = getCourseDayIndices(children)
  const quickDays = Array.from({ length: dayWindow }, (_, i) => offsetDate(i + 1))
    .filter(d => {
      const dayIdx = new Date(`${d}T12:00:00`).getDay()
      return courseDayIndices.includes(dayIdx)
    })

  // ── Load marked dates (all visible) ──
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

  // ── Load active date ──
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
    setSaved(false); setError(null)
    setAttendance(prev => ({
      ...prev,
      [activeDate]: {
        ...(prev[activeDate] || {}),
        [studentId]: prev[activeDate]?.[studentId] === value ? "" : value
      }
    }))
  }

  const save = async () => {
    setError(null); setSaved(false)

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

  const daysByMonth = groupByMonth(quickDays)
  const selectionCount = Object.values(attendance[activeDate] || {}).filter(v => !!v).length
  const dayChildren = children.filter(c => hasCourseOnDay(c, activeDate))

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          Présences
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Cliquez sur un jour de cours pour afficher les enfants et marquer leur présence.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Date selector grouped by month */}
        <div className="space-y-3">
          {Object.entries(daysByMonth).map(([month, days]) => (
            <div key={month}>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{month}</p>
              <div className="flex gap-1.5 flex-wrap">
                {days.map(d => {
                  const isActive = d === activeDate
                  const isMarked = markedDates.has(d)
                  const [dayName, dayNum] = formatShortDate(d).split(" ")
                  return (
                    <button key={d}
                      onClick={() => { setActiveDate(d); setSaved(false); setError(null) }}
                      className={`relative flex flex-col items-center px-3 py-2 rounded-xl border-2 transition min-w-[52px] ${
                        isActive
                          ? "border-tahfidz-green bg-tahfidz-green-light"
                          : isMarked
                            ? "border-emerald-200 bg-emerald-50/40 text-gray-600 hover:border-emerald-300"
                            : "border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                      {isMarked && !isActive && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                      )}
                      <span className={`text-xs font-medium capitalize ${isActive ? "text-tahfidz-green" : ""}`}>{dayName}</span>
                      <span className={`text-base font-bold ${isActive ? "text-tahfidz-green" : "text-gray-700"}`}>{dayNum}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {quickDays.length > 0 && dayWindow < 90 && (
            <button onClick={() => setDayWindow(w => Math.min(w + 30, 90))}
              className="text-xs text-gray-500 hover:text-tahfidz-green font-medium transition">
              + Voir plus de dates
            </button>
          )}
        </div>

        {/* Active day info */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-800">
            {formatFullDate(activeDate)}
          </p>
          {markedDates.has(activeDate) && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">
              Déjà marqué
            </span>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CalendarCheck size={14} /> Enregistré pour le {formatFullDate(activeDate)}
          </div>
        )}

        {/* Children for active day */}
        {!isFuture ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">Sélectionnez un jour à venir.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-tahfidz-green" />
          </div>
        ) : dayChildren.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">
              {courseDayIndices.length === 0
                ? "Aucun horaire de cours défini."
                : "Aucun enfant n'a cours ce jour-là."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayChildren.map(child => {
              const status = attendance[activeDate]?.[child.student.id] || ""
              return (
                <div key={child.id} className="rounded-xl border border-gray-100 p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">{child.student.user.fullName.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{child.student.user.fullName}</p>
                      <p className="text-[10px] text-gray-400">
                        <span className="bg-orange-50 text-orange-600 px-1 py-0.5 rounded mr-1">
                          {RELATION_LABELS[child.relation] ?? child.relation}
                        </span>
                        {child.student.group?.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {STATUS_OPTIONS.map(opt => {
                      const isSelected = status === opt.value
                      return (
                        <button key={opt.value}
                          onClick={() => selectStatus(child.student.id, opt.value)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border-2 transition ${
                            isSelected ? opt.active : opt.inactive
                          }`}>
                          <opt.icon size={12} />
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
                      className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-tahfidz-green" />
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Save button */}
        {isFuture && !loading && dayChildren.length > 0 && (
          <button onClick={save} disabled={saving || selectionCount === 0}
            className="w-full flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition shadow-lg">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving
              ? "Enregistrement…"
              : selectionCount > 0
                ? `Enregistrer (${selectionCount})`
                : "Choisir un statut"}
          </button>
        )}
      </div>
    </div>
  )
}
