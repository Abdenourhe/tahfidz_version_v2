"use client"
// src/components/parent/ParentProfileAttendance.tsx
// Parent sélectionne librement le statut de chaque enfant pour les jours à venir

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Check, Clock, BookOpen, X, ChevronLeft, ChevronRight, CalendarCheck, AlertCircle, Calendar, Info } from "lucide-react"

interface Child {
  id: string
  relation: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null }
    group: { id: string; name: string } | null
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

// Returns date string YYYY-MM-DD offset from today
function offsetDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split("T")[0]
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  const tomorrow = offsetDate(1)
  const prefix = dateStr === tomorrow ? "Demain · " : ""
  return prefix + d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
}

export function ParentProfileAttendance({ children }: { children: Child[] }) {
  const today    = offsetDate(0)
  const tomorrow = offsetDate(1)

  // State
  const [date,       setDate]       = useState(tomorrow)
  const [attendance, setAttendance] = useState<Record<string, string>>({})   // "" = no selection
  const [notes,      setNotes]      = useState<Record<string, string>>({})
  const [loading,    setLoading]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  const isFuture = date > today

  // ── Load existing records for this date (so we can restore what was saved) ──
  const load = useCallback(async () => {
    if (!isFuture) { setAttendance({}); setNotes({}); return }
    setLoading(true)
    try {
      // Reset first — no defaults
      const att: Record<string, string> = {}
      const nts: Record<string, string> = {}
      children.forEach(c => { att[c.student.id] = ""; nts[c.student.id] = "" })

      // Fetch saved records for this date — use simple date to avoid timezone bugs
      const ids = children.filter(c => c.student.group).map(c => c.student.id)
      await Promise.all(ids.map(async id => {
        try {
          const res  = await fetch(`/api/attendance?studentId=${id}&dateFrom=${date}&dateTo=${date}`)
          const data = await res.json()
          const rec  = (data.attendances || [])[0]
          if (rec?.status) {
            att[id] = rec.status   // Restore saved status
            nts[id] = rec.notes || ""
          }
          // If no record found → stays "" (no selection)
        } catch { /* ignore individual fetch errors */ }
      }))

      setAttendance(att)
      setNotes(nts)
    } finally {
      setLoading(false)
    }
  }, [date, isFuture, children])

  useEffect(() => { load() }, [load])

  // ── Select / deselect a status ──
  const select = (studentId: string, value: string) => {
    setSaved(false); setError(null)
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === value ? "" : value  // toggle off if same
    }))
  }

  // ── Navigate days (only future) ──
  const navigate = (dir: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + dir)
    const next = d.toISOString().split("T")[0]
    if (next >= tomorrow) {
      setDate(next); setSaved(false); setError(null)
    }
  }

  // ── Save ──
  const save = async () => {
    setError(null); setSaved(false)

    // Collect only children with a selection
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
      // Group records by groupId
      const byGroup = new Map<string, typeof records>()
      records.forEach(r => {
        if (!byGroup.has(r.groupId)) byGroup.set(r.groupId, [])
        byGroup.get(r.groupId)!.push(r)
      })

      // Send one request per group
      const responses = await Promise.all(
        [...byGroup.entries()].map(([groupId, grpRecords]) =>
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId,
              date:       `${date}T12:00:00.000Z`,
              studentIds: grpRecords.map(r => r.studentId),
              records:    grpRecords.map(r => ({ studentId: r.studentId, status: r.status, notes: r.notes })),
            }),
          })
        )
      )

      // Check errors
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
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  // ── Quick day buttons (tomorrow to tomorrow+6) ──
  const quickDays = Array.from({ length: 7 }, (_, i) => offsetDate(i + 1))

  // How many selections made
  const selectionCount = Object.values(attendance).filter(v => !!v).length

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          Signaler la présence de mes enfants
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Choisissez un jour <strong>à venir</strong> et indiquez le statut de chaque enfant
        </p>
      </div>

      <div className="p-5 space-y-5">
        {/* Info */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-xs">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            Cliquez sur un statut pour le sélectionner. Cliquez à nouveau pour le désélectionner.
            Les enregistrements passés sont restaurés automatiquement.
          </span>
        </div>

        {/* Date selector */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-600">Choisir le jour</label>

          {/* Quick buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {quickDays.map(d => {
              const dayDate   = new Date(`${d}T12:00:00`)
              const dayName   = dayDate.toLocaleDateString("fr-FR", { weekday: "short" })
              const dayNum    = dayDate.getDate()
              const isActive  = d === date
              // Count how many children have a selection for this date (shown as dot)
              return (
                <button key={d}
                  onClick={() => { setDate(d); setSaved(false); setError(null) }}
                  className={`flex flex-col items-center px-3 py-2 rounded-xl border-2 transition min-w-[52px] ${
                    isActive
                      ? "border-tahfidz-green bg-tahfidz-green-light"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  <span className={`text-xs font-medium capitalize ${isActive ? "text-tahfidz-green" : ""}`}>{dayName}</span>
                  <span className={`text-base font-bold ${isActive ? "text-tahfidz-green" : "text-gray-700"}`}>{dayNum}</span>
                </button>
              )
            })}
          </div>

          {/* Arrows + date input */}
          <div className="flex gap-1.5">
            <button onClick={() => navigate(-1)} disabled={date <= tomorrow}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
              <ChevronLeft size={14} className="text-gray-500" />
            </button>
            <input type="date" value={date} min={tomorrow}
              onChange={e => {
                if (e.target.value >= tomorrow) { setDate(e.target.value); setSaved(false); setError(null) }
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            <button onClick={() => navigate(1)}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>

          <p className="text-xs text-tahfidz-green font-medium flex items-center gap-1.5">
            <Calendar size={11} /> <span className="capitalize">{formatDateLabel(date)}</span>
          </p>
        </div>

        {/* Messages */}
        {!isFuture && (
          <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
            <AlertCircle size={14} /> Sélectionnez un jour à venir (demain ou après)
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            <AlertCircle size={14} /> {error}
          </div>
        )}
        {saved && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm font-medium">
            <CalendarCheck size={14} /> Enregistré pour le {formatDateLabel(date)} · Enseignant et admin notifiés
          </div>
        )}

        {/* Children list */}
        {!isFuture ? null : loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-tahfidz-green" />
          </div>
        ) : (
          <div className="space-y-3">
            {children.map(child => {
              const hasGroup  = !!child.student.group
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

                  {hasGroup ? (
                    <>
                      {/* Status buttons — no default selection */}
                      <div className="flex gap-2 flex-wrap mb-2.5">
                        {STATUS_OPTIONS.map(opt => {
                          const isSelected = selected === opt.value
                          return (
                            <button key={opt.value}
                              onClick={() => select(child.student.id, opt.value)}
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
                    </>
                  ) : (
                    <p className="text-xs text-orange-600 bg-orange-100 px-3 py-2 rounded-lg">
                      ⚠️ Aucun groupe assigné — contactez l'administrateur
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Save button */}
        {isFuture && !loading && children.some(c => c.student.group) && (
          <div className="space-y-2">
            <button onClick={save} disabled={saving || selectionCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-40 transition">
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              {saving
                ? "Enregistrement…"
                : selectionCount > 0
                  ? `Enregistrer (${selectionCount})`
                  : "Choisir un statut"}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
