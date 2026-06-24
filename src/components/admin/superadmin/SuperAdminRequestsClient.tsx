"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { Check, Ban, Trash2, Loader2, CheckCircle2, Users, Phone, Mail, MapPin, Clock, CalendarDays, Timer } from "lucide-react"
import { formatPhone } from "./types"

interface SchoolRequest {
  id: string
  schoolName: string
  adminName: string
  adminEmail: string
  adminPhone: string | null
  city: string | null
  country: string
  plan: string
  billingCycle: string
  halaqaSessionDuration: number | null
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string | Date
}

const planLabels: Record<string, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  ECONOMIQUE: "Économique",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
}

const cycleLabels: Record<string, string> = {
  MONTHLY: "Mensuel",
  YEARLY: "Annuel",
}

interface Props {
  requests: SchoolRequest[]
}

export function SuperAdminRequestsClient({ requests }: Props) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const pending = requests.filter((r) => r.status === "PENDING")
  const processed = requests.filter((r) => r.status !== "PENDING")
  const [showHistory, setShowHistory] = useState(false)

  const handleAction = async (id: string, type: "approve" | "reject") => {
    setProcessingId(id)
    await fetch("/api/admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, requestId: id }),
    })
    router.refresh()
    setProcessingId(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette demande définitivement ?")) return
    setProcessingId(id)
    await fetch(`/api/admin/schools?type=request&id=${id}`, { method: "DELETE" })
    router.refresh()
    setProcessingId(null)
  }

  const displayRequests = showHistory ? processed : pending

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Demandes d&apos;inscription</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{pending.length} en attente · {processed.length} traitée(s)</p>
        </div>
        {processed.length > 0 && (
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="text-sm text-red-600 hover:underline"
          >
            {showHistory ? "Voir les demandes en attente" : "Voir l'historique"}
          </button>
        )}
      </div>

      {displayRequests.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <CheckCircle2 size={32} className="mx-auto mb-3 text-green-400" />
          <p className="text-gray-400">{showHistory ? "Aucune demande traitée" : "Aucune demande en attente"}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {displayRequests.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.schoolName}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${r.status === "PENDING" ? "bg-orange-100 text-orange-600" : r.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                      {r.status === "PENDING" ? "En attente" : r.status === "APPROVED" ? "Approuvée" : "Rejetée"}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-tahfidz-green-light text-tahfidz-green font-semibold">
                      {planLabels[r.plan] ?? r.plan}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-medium flex items-center gap-1">
                      <CalendarDays size={10} /> {cycleLabels[r.billingCycle] ?? r.billingCycle}
                    </span>
                    {r.halaqaSessionDuration && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 font-medium flex items-center gap-1">
                        <Timer size={10} /> {r.halaqaSessionDuration} min
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} />{r.city ? `${r.city}, ` : ""}{r.country}</p>
                  <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                    <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"><Users size={13} className="text-tahfidz-green shrink-0" /><span className="font-medium">{r.adminName}</span></div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Phone size={13} className="text-tahfidz-green shrink-0" /><span className="font-mono tracking-wide">{formatPhone(r.adminPhone)}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 col-span-1 sm:col-span-2"><Mail size={11} className="shrink-0" />{r.adminEmail}</div>
                  </div>
                  <p className="text-xs text-gray-300 mt-2 flex items-center gap-1"><Clock size={11} />{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex flex-col gap-2 shrink-0 items-end">
                  {r.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleAction(r.id, "approve")}
                        disabled={processingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 disabled:opacity-50 transition"
                      >
                        {processingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}Approuver
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "reject")}
                        disabled={processingId === r.id}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                      >
                        <Ban size={13} /> Rejeter
                      </button>
                    </>
                  )}
                  {r.status !== "PENDING" && (
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={processingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition disabled:opacity-50"
                    >
                      {processingId === r.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Supprimer
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
