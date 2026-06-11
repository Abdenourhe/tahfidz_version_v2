"use client"

import { useState } from "react"
import { Loader2, RefreshCw, Building2, MapPin, Phone, User, CheckCircle2, XCircle, Clock } from "lucide-react"

interface SchoolUpdateRequest {
  id: string
  schoolId: string
  school: { name: string; slug: string }
  requester: { fullName: string | null; email: string }
  newValues: Record<string, any>
  status: "PENDING" | "APPROVED" | "REJECTED"
  rejectionReason?: string | null
  createdAt: string
  processedAt?: string | null
}

interface UpdatesTabProps {
  requests: SchoolUpdateRequest[]
  loading: boolean
  onReload: () => void
}

export function UpdatesTab({ requests, loading, onReload }: UpdatesTabProps) {
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: "" })
  const [rejectReason, setRejectReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const pending = requests.filter(r => r.status === "PENDING")

  async function handleApprove(id: string) {
    setProcessingId(id)
    setError(null)
    try {
      const res = await fetch("/api/admin/school-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approved: true }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors de l'approbation")
      }
      onReload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  async function handleReject(id: string, reason: string) {
    setProcessingId(id)
    setError(null)
    try {
      const res = await fetch("/api/admin/school-updates", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, approved: false, rejectionReason: reason }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Erreur lors du rejet")
      }
      setRejectModal({ open: false, id: "" })
      setRejectReason("")
      onReload()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setProcessingId(null)
    }
  }

  function formatField(key: string, value: any) {
    if (value === null || value === undefined) return null
    const labels: Record<string, string> = {
      name: "Nom",
      nameAr: "Nom (Arabe)",
      address: "Adresse",
      city: "Ville",
      country: "Pays",
      phone: "Téléphone",
    }
    const icons: Record<string, React.ReactNode> = {
      name: <Building2 size={14} />,
      nameAr: <Building2 size={14} />,
      address: <MapPin size={14} />,
      city: <MapPin size={14} />,
      country: <MapPin size={14} />,
      phone: <Phone size={14} />,
    }
    return (
      <div key={key} className="flex items-center gap-2 text-sm">
        <span className="text-gray-400">{icons[key] || <User size={14} />}</span>
        <span className="text-gray-500">{labels[key] || key}:</span>
        <span className="font-medium text-gray-800 dark:text-gray-100">{String(value)}</span>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Demandes de mise à jour d&apos;école</h3>
        <button onClick={onReload} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {pending.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Clock size={32} className="mx-auto mb-3 opacity-50" />
          <p>Aucune demande en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map(req => (
            <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-tahfidz-green" />
                  <span className="font-semibold text-gray-800 dark:text-gray-100">{req.school.name}</span>
                  <span className="text-xs text-gray-400">({req.school.slug})</span>
                </div>
                <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString("fr-FR")}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User size={14} />
                <span>Par {req.requester.fullName || req.requester.email}</span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-1">
                <p className="text-xs font-medium text-gray-400 uppercase mb-1">Champs modifiés</p>
                {Object.entries(req.newValues || {}).map(([k, v]) => formatField(k, v))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => handleApprove(req.id)}
                  disabled={processingId === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 text-sm font-medium disabled:opacity-50"
                >
                  {processingId === req.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Approuver
                </button>
                <button
                  onClick={() => { setRejectModal({ open: true, id: req.id }); setRejectReason("") }}
                  disabled={processingId === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-sm font-medium disabled:opacity-50"
                >
                  <XCircle size={14} />
                  Rejeter
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 w-full max-w-md space-y-4">
            <h4 className="text-lg font-semibold">Rejeter la demande</h4>
            <p className="text-sm text-gray-500">Veuillez indiquer la raison du rejet. L&apos;administrateur sera notifié.</p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Raison du rejet..."
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => { setRejectModal({ open: false, id: "" }); setRejectReason("") }}
                className="px-4 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(rejectModal.id, rejectReason)}
                disabled={!rejectReason.trim() || processingId === rejectModal.id}
                className="px-4 py-2 rounded-lg text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {processingId === rejectModal.id ? <Loader2 size={14} className="animate-spin inline mr-1" /> : null}
                Rejeter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
