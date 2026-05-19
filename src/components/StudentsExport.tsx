"use client"
// src/components/StudentsExport.tsx — Download button with filter selectors

import { useState, useEffect } from "react"
import { Download, Loader2, FileSpreadsheet } from "lucide-react"

interface Group   { id: string; name: string; _count?: { students: number } }
interface Teacher { id: string; user: { fullName: string } }

interface Props {
  /** "admin" shows teacher + group filters · "teacher" hides them (auto-filtered server-side) */
  role: "admin" | "teacher"
}

export function StudentsExport({ role }: Props) {
  const [open,       setOpen]       = useState(false)
  const [groups,     setGroups]     = useState<Group[]>([])
  const [teachers,   setTeachers]   = useState<Teacher[]>([])
  const [groupId,    setGroupId]    = useState("")
  const [teacherId,  setTeacherId]  = useState("")
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!open || role !== "admin") return
    Promise.all([
      fetch("/api/groups").then(r => r.json()).catch(() => ({ groups: [] })),
      fetch("/api/teachers").then(r => r.json()).catch(() => ({ teachers: [] })),
    ]).then(([g, t]) => {
      setGroups(g.groups || [])
      setTeachers(t.teachers || [])
    })
  }, [open, role])

  const download = async () => {
    setDownloading(true)
    try {
      const params = new URLSearchParams()
      if (teacherId) params.set("teacherId", teacherId)
      if (groupId)   params.set("groupId", groupId)

      const res = await fetch(`/api/students/export?${params}`)
      if (!res.ok) throw new Error("Erreur de téléchargement")

      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href     = url
      a.download = res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ||
                   `eleves_${new Date().toISOString().split("T")[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      setOpen(false)
    } finally {
      setDownloading(false)
    }
  }

  // Teacher: simple direct download (no filters needed)
  if (role === "teacher") {
    return (
      <button onClick={download} disabled={downloading}
        className="flex items-center gap-2 px-4 py-2.5 border border-tahfidz-green text-tahfidz-green text-sm font-medium rounded-lg hover:bg-tahfidz-green-light transition disabled:opacity-60">
        {downloading ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
        {downloading ? "Génération…" : "Exporter mes élèves (CSV)"}
      </button>
    )
  }

  // Admin: button + popover with filters
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
        <Download size={15} />Exporter CSV
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-lg p-4 z-50 space-y-3">
            <div>
              <p className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                <FileSpreadsheet size={15} className="text-tahfidz-green" /> Exporter la liste
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Sélectionnez les filtres (optionnel)</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filtrer par enseignant</label>
              <select value={teacherId} onChange={e => setTeacherId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                <option value="">— Tous les enseignants —</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.user.fullName}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Filtrer par groupe</label>
              <select value={groupId} onChange={e => setGroupId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                <option value="">— Tous les groupes —</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}{g._count ? ` (${g._count.students})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-xs text-blue-700">
              📋 Le CSV contiendra : nom, email, téléphone, groupe, enseignant, étoiles, parent…
            </div>

            <div className="flex gap-2">
              <button onClick={() => setOpen(false)}
                className="flex-1 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={download} disabled={downloading}
                className="flex-1 py-2 gradient-tahfidz text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                {downloading ? "…" : "Télécharger"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
