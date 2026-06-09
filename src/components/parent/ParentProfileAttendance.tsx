"use client"
// src/components/parent/ParentProfileAttendance.tsx
// Parent sélectionne librement le statut de chaque enfant pour les jours à venir
// Supporte la multisélection de jours et le filtrage par jours de cours du groupe

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Check, Clock, BookOpen, X, CalendarCheck, AlertCircle, Calendar, Info, Trash2 } from "lucide-react"

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
  { value: "PRESENT", label: "Présent", icon: Check,    active: "bg-green-500 text-white border-green-500",   inactive: "border-gray-200 text-gray-500 hover:border-green-400 hover:text-green-600" },
  { value: "LATE",    label: "Retard",  icon: Clock,    active: "bg-yellow-500 text-white border-yellow-500", inactive: "border-gray-200 text-gray-500 hover:border-yellow-400 hover:text-yellow-600" },
  { value: "EXCUSED", label: "Excusé",  icon: BookOpen, active: "bg-blue-500 text-white border-blue-500",     inactive: "border-gray-200 text-gray-500 hover:border-blue-400 hover:text-blue-600" },
  { value: "ABSENT",  label: "Absent",  icon: X,        active: "bg-red-500 text-white border-red-500",       inactive: "border-gray-200 text-gray-500 hover:border-red-400 hover:text-red-600" },
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
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
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

  // State
  const [selectedDates, setSelectedDates] = useState<string[]>([tomorrow])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [notes,      setNotes]      = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [dayWindow,  setDayWindow]  = useState(30)
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set())

  const activeDate = selectedDates[0] ?? tomorrow
  const isFuture   = activeDate > today

  // ── Course days ──
  const courseDayIndices = getCourseDayIndices(children)
  const quickDays = Array.from({ length: dayWindow }, (_, i) => offsetDate(i + 1))
    .filter(d => {
      const dayIdx = new Date(`${d}T12:00:00`).getDay()
      return courseDayIndices.includes(dayIdx)
    })

  // ── Load which days already have attendances (for all visible days) ──
  const loadMarkedDates = useCallback(async () => {
    if (quickDays.length === 0) return
    const start = quickDays[0]
    const end = quickDays[quickDays.length - 1]
    try {
      const res = await fetch(`/api/attendance?dateFrom=${start}&dateTo=${end}`)
      const data = await res.json()
      const marked = new Set<string>()
      ;(data.attendances || []).forEach((a: any) => {
        const dateKey = a.date.split("T")[0]
        marked.add(dateKey)
      })
      setMarkedDates(marked)
    } catch { /* ignore */ }
  }, [quickDays])

  useEffect(() => { loadMarkedDates() }, [loadMarkedDates])

  // ── Load existing records for the first selected date ──
  const load = useCallback(async () => {
    if (!isFuture) { setAttendance({}); setNotes({}); return }
    setLoading(true)
    try {
      const att: Record<string, string> = {}
      const nts: Record<string, string> = {}
      children.forEach(c => { att[c.student.id] = ""; nts[c.student.id] = "" })

      const ids = children.filter(c => c.student.group).map(c => c.student.id)
      await Promise.all(ids.map(async id => {
        try {
          const res  = await fetch(`/api/attendance?studentId=${id}&dateFrom=${activeDate}&dateTo=${activeDate}`)
          const data = await res.json()
          const rec  = (data.attendances || [])[0]
          if (rec?.status) {
            att[id] = rec.status
            nts[id] = rec.notes || ""
          }
        } catch { /* ignore */ }
      }))

      setAttendance(att)
      setNotes(nts)
    } finally {
      setLoading(false)
    }
  }, [activeDate, isFuture, children])

  useEffect(() => { load() }, [load])

  const toggleDate = (d: string) => {
    setSaved(false); setError(null)
    setSelectedDates(prev => {
      if (prev.includes(d)) {
        const next = prev.filter(x => x !== d)
        return next.length > 0 ? next : [d] // keep at least one
      }
      return [...prev, d].sort()
    })
  }

  const clearDates = () => {
    setSaved(false); setError(null)
    setSelectedDates([tomorrow])
  }

  const selectStatus = (studentId: string, value: string) => {
    setSaved(false); setError(null)
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === value ? "" : value
    }))
  }

  const save = async () => {
    setError(null); setSaved(false)

    const records = children
      .filter(c => c.student.group && attendance[c.student.id])
      .map(c => ({
        groupId:   c.student.group!.id,
        studentId: c.student.id,
        status:    attendance[c.student.id],
        notes:     notes[c.student.id] || "",
      }))

    if (records.length === 0) {
      setError("Sélectionnez au moins un statut pour enregistrer.")
      return
    }

    setSaving(true)
    try {
      const errs: string[] = []

      for (const dateStr of selectedDates) {
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
                date:       `${dateStr}T12:00:00.000Z`,
                studentIds: grpRecords.map(r => r.studentId),
                records:    grpRecords.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes })),
              }),
            })
          )
        )

        for (const res of responses) {
          if (!res.ok) {
            try {
              const j = await res.json()
              if (typeof j.error === "string") errs.push(`${dateStr}: ${j.error}`)
              else if (j.error) errs.push(`${dateStr}: ${JSON.stringify(j.error)}`)
              else if (j.message) errs.push(`${dateStr}: ${j.message}`)
              else errs.push(`${dateStr}: Erreur ${res.status}`)
            } catch { errs.push(`${dateStr}: Erreur ${res.status}`) }
          }
        }
      }

      if (errs.length > 0) {
        setError(errs.join(" · "))
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 5000)
        // Refresh marked dates after save
        loadMarkedDates()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau")
    } finally {
      setSaving(false)
    }
  }



  const daysByMonth = groupByMonth(quickDays)
  const selectionCount = Object.values(attendance).filter(v => !!v).length
  const multiMode = selectedDates.length > 1

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          Signaler la présence de mes enfants
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Sélectionnez un ou plusieurs jours de cours, puis le statut de chaque enfant.
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Cliquez sur un jour pour le sélectionner. Cliquez à nouveau pour le désélectionner.
            Vous pouvez sélectionner plusieurs jours à la fois.
          </span>
        </div>

        {/* Date selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-gray-600">Choisir le(s) jour(s)</label>
            {multiMode && (
              <button onClick={clearDates} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition">
                <Trash2 size={12} /> Tout désélectionner
              </button>
            )}
          </div>

          {/* Grouped by month */}
          <div className="space-y-3">
            {Object.entries(daysByMonth).map(([month, days]) => (
              <div key={month}>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{month}</p>
                <div className="flex gap-1.5 flex-wrap">
                  {days.map(d => {
                    const isSelected = selectedDates.includes(d)
                    const isMarked = markedDates.has(d)
                    const [dayName, dayNum] = formatShortDate(d).split(" ")
                    return (
                      <button key={d}
                        onClick={() => toggleDate(d)}
                        className={`relative flex flex-col items-center px-3 py-2 rounded-xl border-2 transition min-w-[52px] ${
                          isSelected
                            ? "border-tahfidz-green bg-tahfidz-green-light"
                            : isMarked
                              ? "border-emerald-200 bg-emerald-50/40 text-gray-600 hover:border-emerald-300"
                              : "border-gray-200 text-gray-500 hover:border-gray-300"
                        }`}>
                        {isMarked && !isSelected && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                        )}
                        <span className={`text-xs font-medium capitalize ${isSelected ? "text-tahfidz-green" : ""}`}>{dayName}</span>
                        <span className={`text-base font-bold ${isSelected ? "text-tahfidz-green" : "text-gray-700"}`}>{dayNum}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {quickDays.length > 0 && dayWindow < 90 && (
            <button
              onClick={() => setDayWindow(w => Math.min(w + 30, 90))}
              className="text-xs text-gray-500 hover:text-tahfidz-green font-medium transition"
            >
              + Voir plus de dates
            </button>
          )}

          {/* Selected dates summary */}
          <div className="flex items-center gap-2">
            <Calendar size={12} className="text-tahfidz-green" />
            <p className="text-xs text-tahfidz-green font-medium">
              {multiMode
                ? `${selectedDates.length} jours sélectionnés`
                : formatFullDate(activeDate)}
            </p>
          </div>
          {multiMode && (
            <p className="text-[10px] text-gray-400">
              {selectedDates.map(formatFullDate).join(" · ")}
            </p>
          )}
        </div>

        {/* Messages */}
        {!isFuture && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
            <AlertCircle size={14} /> Sélectionnez un jour à venir
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CalendarCheck size={14} />
            {multiMode
              ? `Enregistré pour ${selectedDates.length} jours · Enseignant et admin notifiés`
              : `Enregistré pour le ${formatFullDate(activeDate)} · Enseignant et admin notifiés`}
          </div>
        )}

        {/* Children list */}
        {!isFuture ? null : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-tahfidz-green" />
          </div>
        ) : (
          <div className="space-y-3">
            {children
              .filter(child => selectedDates.some(d => hasCourseOnDay(child, d)))
              .map(child => {
                const selected  = attendance[child.student.id] || ""
                const hasChoice = !!selected

                return (
                  <div key={child.id}
                    className={`rounded-xl border p-4 transition ${
                      hasChoice ? "border-tahfidz-green/40 bg-tahfidz-green-light/20" : "border-gray-100 bg-gray-50"
                    }`}>
                    {/* Child header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{child.student.user.fullName.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900 text-sm">{child.student.user.fullName}</p>
                          {hasChoice && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              selected === "PRESENT" ? "bg-green-100 text-green-700" :
                              selected === "LATE"    ? "bg-yellow-100 text-yellow-700" :
                              selected === "EXCUSED" ? "bg-blue-100 text-blue-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {STATUS_OPTIONS.find(o => o.value === selected)?.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1.5">
                            {RELATION_LABELS[child.relation] ?? child.relation}
                          </span>
                          {child.student.group?.name ?? <span className="text-orange-500">Sans groupe</span>}
                        </p>
                      </div>
                    </div>

                    {/* Status buttons */}
                    <div className="flex gap-2 flex-wrap mb-2.5">
                      {STATUS_OPTIONS.map(opt => {
                        const isSelected = selected === opt.value
                        return (
                          <button key={opt.value}
                            onClick={() => selectStatus(child.student.id, opt.value)}
                            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border-2 transition ${
                              isSelected ? opt.active : opt.inactive
                            }`}>
                            <opt.icon size={12} />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>

                    {(selected === "ABSENT" || selected === "EXCUSED") && (
                      <input type="text"
                        value={notes[child.student.id] || ""}
                        onChange={e => setNotes(p => ({ ...p, [child.student.id]: e.target.value }))}
                        placeholder="Motif (maladie, voyage, rendez-vous…)"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-tahfidz-green" />
                    )}
                  </div>
                )
              })}

            {children.filter(c => selectedDates.some(d => hasCourseOnDay(c, d))).length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400">
                  {courseDayIndices.length === 0
                    ? "Aucun horaire de cours défini pour vos enfants."
                    : "Aucun enfant n'a cours aux jours sélectionnés."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save button */}
        {isFuture && !loading && children.some(c => selectedDates.some(d => hasCourseOnDay(c, d))) && (
          <div className="space-y-2">
            <button onClick={save} disabled={saving || selectionCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving
                ? "Enregistrement…"
                : selectionCount > 0
                  ? `Enregistrer pour ${selectedDates.length} jour${selectedDates.length > 1 ? "s" : ""} (${selectionCount})`
                  : "Choisir un statut"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
