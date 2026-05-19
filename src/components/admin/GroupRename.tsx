"use client"
// src/components/admin/GroupRename.tsx — Inline rename for groups

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Check, X, Loader2 } from "lucide-react"

interface Props {
  groupId:    string
  initialName: string
  initialNameAr?: string | null
}

export function GroupRename({ groupId, initialName, initialNameAr }: Props) {
  const router  = useRouter()
  const [editing, setEditing] = useState(false)
  const [name,    setName]    = useState(initialName)
  const [nameAr,  setNameAr]  = useState(initialNameAr || "")
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  const save = async () => {
    if (!name.trim()) { setError("Nom requis"); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/groups/${groupId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), nameAr: nameAr.trim() || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setEditing(false)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setSaving(false)
    }
  }

  const cancel = () => {
    setName(initialName)
    setNameAr(initialNameAr || "")
    setError(null)
    setEditing(false)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition">
        <Pencil size={11} /> Renommer
      </button>
    )
  }

  return (
    <div className="bg-tahfidz-green-light border border-tahfidz-green/30 rounded-xl p-4 space-y-3 mt-3">
      {error && <p className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom du groupe *</label>
          <input value={name} onChange={e => setName(e.target.value)} autoFocus
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nom (arabe)</label>
          <input value={nameAr} onChange={e => setNameAr(e.target.value)} dir="rtl"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white arabic focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={cancel} disabled={saving}
          className="flex-1 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-white transition flex items-center justify-center gap-1">
          <X size={12} /> Annuler
        </button>
        <button onClick={save} disabled={saving || !name.trim()}
          className="flex-1 py-2 bg-tahfidz-green text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-1">
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          {saving ? "…" : "Enregistrer"}
        </button>
      </div>
    </div>
  )
}
