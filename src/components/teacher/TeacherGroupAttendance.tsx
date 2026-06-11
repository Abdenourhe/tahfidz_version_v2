"use client"
// src/components/teacher/TeacherGroupAttendance.tsx
// Compact attendance for group detail page

import { useState, useEffect } from "react"
import { Save, Loader2, Check, X, Clock, BookOpen } from "lucide-react"

interface Student { id: string; user: { fullName: string } }
interface Props { groupId: string; students: Student[] }

const OPTS = [
  { value: "PRESENT", icon: Check,    cls: "bg-green-500 text-white",   off: "text-gray-300 hover:text-green-500" },
  { value: "LATE",    icon: Clock,    cls: "bg-yellow-500 text-white",  off: "text-gray-300 hover:text-yellow-500" },
  { value: "EXCUSED", icon: BookOpen, cls: "bg-blue-500 text-white",    off: "text-gray-300 hover:text-blue-500" },
  { value: "ABSENT",  icon: X,        cls: "bg-red-500 text-white",     off: "text-gray-300 hover:text-red-500" },
]

export function TeacherGroupAttendance({ groupId, students }: Props) {
  const today = new Date().toISOString().split("T")[0]
  const [att, setAtt]     = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)

  useEffect(() => {
    if (!students.length) return
    fetch(`/api/attendance?groupId=${groupId}&dateFrom=${today}T00:00:00Z&dateTo=${today}T23:59:59Z`)
      .then(r => r.json())
      .then(d => {
        const m: Record<string, string> = {}
        students.forEach(s => {
          const a = (d.attendances || []).find((x: any) => x.studentId === s.id)
          m[s.id] = a?.status || "PRESENT"
        })
        setAtt(m)
      })
  }, [groupId, students, today])

  const save = async () => {
    setSaving(true)
    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          date: new Date(`${today}T12:00:00Z`).toISOString(),
          studentIds: students.map(s => s.id),
          records: students.map(s => ({ studentId: s.id, status: att[s.id] || "PRESENT" })),
        }),
      })
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } finally { setSaving(false) }
  }

  if (!students.length) return <p className="text-xs text-gray-400">Aucun élève</p>

  return (
    <div className="space-y-2">
      {students.slice(0, 8).map(s => {
        const cur = att[s.id] || "PRESENT"
        return (
          <div key={s.id} className="flex items-center gap-2">
            <p className="text-xs text-gray-700 flex-1 truncate">{s.user.fullName}</p>
            <div className="flex gap-1">
              {OPTS.map(o => (
                <button key={o.value} onClick={() => setAtt(prev => ({ ...prev, [s.id]: o.value }))}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition ${cur === o.value ? o.cls : o.off}`}>
                  <o.icon size={12} />
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {students.length > 8 && <p className="text-xs text-gray-400 text-center">+{students.length - 8} autres</p>}
      <button onClick={save} disabled={saving}
        className="w-full flex items-center justify-center gap-1.5 py-2 gradient-tahfidz text-white text-xs font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition mt-2">
        {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
        {saved ? "Enregistré ✓" : saving ? "…" : "Enregistrer"}
      </button>
    </div>
  )
}
