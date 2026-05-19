"use client"
// src/components/teacher/TeacherProfileAttendance.tsx
// Composant de présences pour le profil enseignant et parent

import { useState, useEffect, useCallback } from "react"
import { Save, Loader2, Check, Clock, BookOpen, X, ChevronLeft, ChevronRight, CalendarCheck } from "lucide-react"

interface Student {
  id: string
  user: { fullName: string; fullNameAr?: string | null }
}
interface Group {
  id: string
  name: string
  students: Student[]
}

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Présent", icon: Check,    active: "bg-green-500 text-white border-green-500",   inactive: "border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600" },
  { value: "LATE",    label: "Retard",  icon: Clock,    active: "bg-yellow-500 text-white border-yellow-500", inactive: "border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-600" },
  { value: "EXCUSED", label: "Excusé",  icon: BookOpen, active: "bg-blue-500 text-white border-blue-500",     inactive: "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600" },
  { value: "ABSENT",  label: "Absent",  icon: X,        active: "bg-red-500 text-white border-red-500",       inactive: "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-600" },
]

export function TeacherProfileAttendance({ groups }: { groups: Group[] }) {
  const [selectedGroup, setSelectedGroup] = useState(groups[0]?.id || "")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentGroup = groups.find(g => g.id === selectedGroup)
  const students = currentGroup?.students || []

  const loadAttendance = useCallback(async () => {
    if (!selectedGroup || !students.length) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?groupId=${selectedGroup}&dateFrom=${date}T00:00:00Z&dateTo=${date}T23:59:59Z`)
      const data = await res.json()
      const attList = data.attendances || []
      const att: Record<string, string> = {}
      const nts: Record<string, string> = {}
      students.forEach(s => {
        const a = attList.find((x: any) => x.studentId === s.id)
        att[s.id] = a?.status || "PRESENT"
        nts[s.id] = a?.notes || ""
      })
      setAttendance(att)
      setNotes(nts)
    } finally {
      setLoading(false)
    }
  }, [selectedGroup, date, students.length])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  // Init par défaut si pas encore chargé
  useEffect(() => {
    if (!loading && students.length > 0 && Object.keys(attendance).length === 0) {
      const att: Record<string, string> = {}
      students.forEach(s => { att[s.id] = "PRESENT" })
      setAttendance(att)
    }
  }, [students, loading])

  const markAll = (status: string) => {
    const all: Record<string, string> = {}
    students.forEach(s => { all[s.id] = status })
    setAttendance(all)
  }

  const navigate = (dir: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + dir)
    if (d <= new Date()) setDate(d.toISOString().split("T")[0])
  }

  const save = async () => {
    if (!selectedGroup || students.length === 0) return
    setSaving(true)
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id] || "PRESENT",
        notes: notes[s.id] || "",
      }))
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup,
          date: new Date(`${date}T12:00:00Z`).toISOString(),
          studentIds: students.map(s => s.id),
          records,
        }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } finally {
      setSaving(false)
    }
  }

  const presentCount = students.filter(s => attendance[s.id] === "PRESENT").length
  const absentCount  = students.filter(s => attendance[s.id] === "ABSENT").length
  const today = new Date().toISOString().split("T")[0]

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" />
          Gestion des présences
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">Marquez la présence de vos élèves</p>
      </div>

      <div className="p-5 space-y-4">
        {/* Groupe + Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Groupe</label>
            <select value={selectedGroup} onChange={e => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <div className="flex gap-1.5">
              <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                <ChevronLeft size={14} className="text-gray-500" />
              </button>
              <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
                className="flex-1 px-2 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              <button onClick={() => navigate(1)} disabled={date >= today}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition disabled:opacity-40">
                <ChevronRight size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats + marquage rapide */}
        {students.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-tahfidz-green">{presentCount}</p>
                <p className="text-xs text-gray-400">Présents</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-red-500">{absentCount}</p>
                <p className="text-xs text-gray-400">Absents</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-gray-700">{students.length}</p>
                <p className="text-xs text-gray-400">Total</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => markAll("PRESENT")} className="text-xs px-2.5 py-1.5 bg-green-100 text-green-700 border border-green-200 rounded-lg font-medium hover:bg-green-200 transition">✓ Tous présents</button>
              <button onClick={() => markAll("ABSENT")}  className="text-xs px-2.5 py-1.5 bg-red-100 text-red-700 border border-red-200 rounded-lg font-medium hover:bg-red-200 transition">✗ Tous absents</button>
            </div>
          </div>
        )}

        {saved && (
          <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            <CalendarCheck size={15} /> Présences enregistrées !
          </div>
        )}

        {/* Liste élèves */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="animate-spin text-tahfidz-green" />
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Aucun élève dans ce groupe</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {students.map(student => {
              const cur = attendance[student.id] || "PRESENT"
              return (
                <div key={student.id} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-8 h-8 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{student.user.fullName.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{student.user.fullName}</p>
                        {student.user.fullNameAr && <p className="arabic text-xs text-gray-400">{student.user.fullNameAr}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {STATUS_OPTIONS.map(opt => {
                        const isActive = cur === opt.value
                        return (
                          <button key={opt.value}
                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: opt.value }))}
                            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition ${isActive ? opt.active : opt.inactive}`}>
                            <opt.icon size={11} />
                            {opt.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <input type="text"
                    value={notes[student.id] || ""}
                    onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                    placeholder="Note (optionnel)…"
                    className="mt-2 w-full px-2.5 py-1 text-xs rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-1 focus:ring-tahfidz-green text-gray-600 placeholder-gray-300"
                  />
                </div>
              )
            })}
          </div>
        )}

        {students.length > 0 && (
          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Enregistrement…" : "Enregistrer les présences"}
          </button>
        )}
      </div>
    </div>
  )
}
