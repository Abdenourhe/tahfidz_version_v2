"use client"
// src/components/admin/StudentGroupTransfer.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Loader2, CheckCircle2, X } from "lucide-react"

interface Group {
  id: string
  name: string
  level: string
  _count: { students: number }
  maxCapacity: number
  teacher: { id: string; user: { fullName: string } }
}

interface Props {
  studentId: string
  studentName: string
  currentGroupId?: string | null
  currentGroupName?: string | null
}

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé"
}

export function StudentGroupTransfer({ studentId, studentName, currentGroupId, currentGroupName }: Props) {
  const router = useRouter()
  const [open, setOpen]         = useState(false)
  const [groups, setGroups]     = useState<Group[]>([])
  const [targetGroup, setTargetGroup] = useState("")
  const [reason, setReason]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    fetch("/api/groups")
      .then(r => r.json())
      .then(d => setGroups((d.groups || []).filter((g: Group) => g.id !== currentGroupId)))
  }, [open, currentGroupId])

  const transfer = async () => {
    if (!targetGroup) { setError("Sélectionnez un groupe cible"); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/students/${studentId}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGroupId: targetGroup, reason }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erreur")
      setSuccess(true)
      setTimeout(() => { setOpen(false); setSuccess(false); setTargetGroup(""); setReason(""); router.refresh() }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setLoading(false) }
  }

  const selected = groups.find(g => g.id === targetGroup)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light transition font-medium"
      >
        <ArrowRight size={13} /> Changer de groupe
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition">
              <X size={16} className="text-gray-400" />
            </button>

            {success ? (
              <div className="text-center py-4">
                <CheckCircle2 size={48} className="text-tahfidz-green mx-auto mb-3" />
                <p className="font-bold text-gray-800">Transfert effectué !</p>
                <p className="text-sm text-gray-400 mt-1">Notifications envoyées aux parties concernées</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Changer de groupe</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Transférer <strong>{studentName}</strong> vers un autre groupe
                </p>

                {/* Visuel de/vers */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-4">
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Groupe actuel</p>
                    <p className="text-sm font-semibold text-gray-700">{currentGroupName || "Aucun"}</p>
                  </div>
                  <ArrowRight size={18} className="text-tahfidz-green flex-shrink-0" />
                  <div className="flex-1 text-center">
                    <p className="text-xs text-gray-400 mb-1">Nouveau groupe</p>
                    <p className="text-sm font-semibold text-tahfidz-green">{selected?.name || "—"}</p>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-3">{error}</p>}

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Groupe cible *</label>
                    <select
                      value={targetGroup}
                      onChange={e => setTargetGroup(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                    >
                      <option value="">— Sélectionner —</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} disabled={g._count.students >= g.maxCapacity}>
                          {g.name} · {LEVEL_LABEL[g.level] ?? g.level} · {g.teacher.user.fullName} ({g._count.students}/{g.maxCapacity})
                          {g._count.students >= g.maxCapacity ? " — Complet" : ""}
                        </option>
                      ))}
                    </select>
                    {selected && (
                      <p className="mt-1 text-xs text-gray-400">
                        Enseignant : <span className="font-medium text-gray-600">{selected.teacher.user.fullName}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Raison (optionnel)</label>
                    <input
                      type="text"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="ex: niveau avancé, changement d'horaire…"
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                    📢 Élève, parents, ancien et nouvel enseignant seront notifiés automatiquement.
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => setOpen(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">Annuler</button>
                  <button onClick={transfer} disabled={loading || !targetGroup}
                    className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    {loading ? "Transfert…" : "Transférer"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
