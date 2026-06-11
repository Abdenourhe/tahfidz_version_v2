"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, ArrowLeft, Building2, Clock, User, MapPin, Phone } from "lucide-react"

interface UpdateRequest {
  id: string
  schoolId: string
  requestedBy: string
  name: string | null
  nameAr: string | null
  address: string | null
  city: string | null
  country: string | null
  phone: string | null
  status: string
  rejectionReason: string | null
  createdAt: string
  processedAt: string | null
  school: { name: string; slug: string }
  requester: { fullName: string; email: string }
}

export default function SchoolUpdatesPage() {
  const router = useRouter()
  const [requests, setRequests] = useState<UpdateRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/school-updates")
      const data = await res.json()
      setRequests(data.requests || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    setProcessingId(id)
    try {
      const res = await fetch("/api/admin/school-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approved: true }),
      })
      if (!res.ok) throw new Error()
      load()
    } catch (e) {
      console.error(e)
      alert("Erreur lors de l'approbation")
    } finally {
      setProcessingId(null)
    }
  }

  const openReject = (id: string) => {
    setRejectingId(id)
    setRejectReason("")
    setRejectModalOpen(true)
  }

  const handleReject = async () => {
    if (!rejectingId || !rejectReason.trim()) return
    setProcessingId(rejectingId)
    try {
      const res = await fetch("/api/admin/school-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: rejectingId, approved: false, rejectionReason: rejectReason.trim() }),
      })
      if (!res.ok) throw new Error()
      setRejectModalOpen(false)
      setRejectingId(null)
      setRejectReason("")
      load()
    } catch (e) {
      console.error(e)
      alert("Erreur lors du rejet")
    } finally {
      setProcessingId(null)
    }
  }

  const changedFields = (r: UpdateRequest) => {
    const fields: { label: string; value: string | null }[] = []
    if (r.name) fields.push({ label: "Nom", value: r.name })
    if (r.nameAr) fields.push({ label: "Nom (ar)", value: r.nameAr })
    if (r.address) fields.push({ label: "Adresse", value: r.address })
    if (r.city) fields.push({ label: "Ville", value: r.city })
    if (r.country) fields.push({ label: "Pays", value: r.country })
    if (r.phone) fields.push({ label: "Téléphone", value: r.phone })
    return fields
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push("/admin/super")}
          className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mises à jour d&apos;écoles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Validez ou rejetez les modifications demandées par les admins</p>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Building2 size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(r => {
            const fields = changedFields(r)
            return (
              <div key={r.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 transition hover:shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 size={16} className="text-tahfidz-green" />
                      <p className="font-semibold text-gray-900 dark:text-white">{r.school.name}</p>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-medium">En attente</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <User size={13} />
                      <span>{r.requester.fullName} ({r.requester.email})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={12} />
                      <span>{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                      {fields.map(f => (
                        <div key={f.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{f.label}</p>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{f.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={processingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition">
                      {processingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                      Valider
                    </button>
                    <button
                      onClick={() => openReject(r.id)}
                      disabled={processingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 disabled:opacity-50 transition">
                      <XCircle size={12} />
                      Rejeter
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">Rejeter la modification</h4>
            <p className="text-sm text-gray-500">Veuillez indiquer le motif du rejet. L&apos;admin sera notifié.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Motif du rejet..."
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              rows={3}
            />
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setRejectModalOpen(false); setRejectingId(null) }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                Annuler
              </button>
              <button onClick={handleReject} disabled={!rejectReason.trim() || processingId === rejectingId}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
                {processingId === rejectingId ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
