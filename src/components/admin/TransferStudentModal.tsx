"use client"
// src/components/admin/TransferStudentModal.tsx

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, X, CheckCircle2 } from "lucide-react"

interface Group   { id: string; name: string; _count: { students: number }; maxCapacity: number }
interface Student { id: string; user: { fullName: string }; group: { name: string } | null }

interface Props {
  student: Student
  currentGroupId: string
  onClose: () => void
}

export function TransferStudentModal({ student, currentGroupId, onClose }: Props) {
  const router = useRouter()
  const [groups, setGroups]     = useState<Group[]>([])
  const [targetGroup, setTargetGroup] = useState("")
  const [reason, setReason]     = useState("")
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/groups").then(r => r.json()).then(d => {
      setGroups((d.groups || []).filter((g: Group) => g.id !== currentGroupId))
    })
  }, [currentGroupId])

  const transfer = async () => {
    if (!targetGroup) { setError("Sélectionnez un groupe cible"); return }
    setLoading(true); setError(null)
    try {
      const selectedGroup = groups.find(g => g.id === targetGroup)
      const newTeacherId  = undefined // Will be resolved server-side

      const res = await fetch(`/api/students/${student.id}/transfer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newGroupId: targetGroup, reason }),
      })
      if (!res.ok) throw new Error((await res.json()).error || "Erreur")
      setSuccess(true)
      setTimeout(() => { onClose(); router.refresh() }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition">
          <X size={16} className="text-gray-400" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <CheckCircle2 size={48} className="text-tahfidz-green mx-auto mb-3" />
            <p className="font-bold text-gray-800">Transfert effectué !</p>
            <p className="text-sm text-gray-400 mt-1">Élève et parties concernées notifiés</p>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Transférer un élève</h3>
            <p className="text-sm text-gray-500 mb-5">
              Déplacer <strong>{student.user.fullName}</strong> vers un autre groupe
            </p>

            {/* De → vers */}
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-5">
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1">Groupe actuel</p>
                <p className="text-sm font-semibold text-gray-700">{student.group?.name || "Aucun"}</p>
              </div>
              <ArrowRight size={18} className="text-tahfidz-green flex-shrink-0" />
              <div className="flex-1 text-center">
                <p className="text-xs text-gray-400 mb-1">Nouveau groupe</p>
                <p className="text-sm font-semibold text-tahfidz-green">
                  {groups.find(g => g.id === targetGroup)?.name || "—"}
                </p>
              </div>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Groupe cible *</label>
                <select value={targetGroup} onChange={e => setTargetGroup(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
                  <option value="">— Sélectionner un groupe —</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id} disabled={g._count.students >= g.maxCapacity}>
                      {g.name} ({g._count.students}/{g.maxCapacity})
                      {g._count.students >= g.maxCapacity ? " — Complet" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Raison du transfert (optionnel)</label>
                <input type="text" value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="ex: niveau avancé, changement d'horaire…"
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                <p className="text-xs text-blue-700 font-medium mb-1">📢 Notifications automatiques</p>
                <p className="text-xs text-blue-600">L'élève, les parents, l'ancien enseignant et le nouvel enseignant seront notifiés du transfert.</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
                Annuler
              </button>
              <button onClick={transfer} disabled={loading || !targetGroup}
                className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
                {loading ? <Loader2 size={15} className="animate-spin" /> : <ArrowRight size={15} />}
                {loading ? "Transfert…" : "Transférer"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
