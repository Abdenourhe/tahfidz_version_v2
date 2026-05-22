"use client"
import { Fragment, useState } from "react"
import { CheckCircle2, X, ChevronDown, Check, Ban, Trash2, Loader2, Users, Phone, Mail, MapPin } from "lucide-react"
import { SchoolRequest } from "./types"
import { formatPhone } from "./types"

function RequestCard({
  r,
  processing,
  onApprove,
  onReject,
  onDelete,
}: {
  r: SchoolRequest
  processing: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete?: (id: string) => void
}) {
  return (
    <div className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${r.status !== "PENDING" ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{r.schoolName}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.status === "PENDING" ? "bg-orange-100 text-orange-600" : r.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
              {r.status === "PENDING" ? "En attente" : r.status === "APPROVED" ? "Approuvee" : "Rejetee"}
            </span>
            {r.slug && <span className="font-mono bg-tahfidz-green-light text-tahfidz-green px-2 py-0.5 rounded text-[10px]">🔑 {r.slug}</span>}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={11} />{r.city ? `${r.city}, ` : ""}{r.country}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-300"><Users size={13} className="text-tahfidz-green shrink-0" /><span className="font-medium">{r.adminName}</span></div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"><Phone size={13} className="text-tahfidz-green shrink-0" /><span className="font-mono tracking-wide">{formatPhone(r.adminPhone)}</span></div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 col-span-2"><Mail size={11} className="shrink-0" />{r.adminEmail}</div>
          </div>
          <p className="text-xs text-gray-400 mt-2">{r.classCount} classes x {r.studentsPerClass} eleves = <strong className="text-gray-600 dark:text-gray-300">{r.classCount * r.studentsPerClass}</strong> eleves — {r.teachersCount} enseignants</p>
          <p className="text-xs text-gray-300 mt-0.5">{new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}</p>
        </div>
        <div className="flex flex-col gap-2 shrink-0 items-end">
          {r.status === "PENDING" && (<>
            <button onClick={() => onApprove(r.id)} disabled={processing === r.id} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 disabled:opacity-50 transition">{processing === r.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={13} />}Approuver</button>
            <button onClick={() => onReject(r.id)} disabled={processing === r.id} className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"><Ban size={13} /> Rejeter</button>
          </>)}
          {r.status !== "PENDING" && onDelete && (
            <button onClick={() => onDelete(r.id)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-lg text-xs hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition"><Trash2 size={12} /> Supprimer</button>
          )}
        </div>
      </div>
    </div>
  )
}

export function RequestsTab({
  requests,
  processing,
  onApprove,
  onReject,
  onDelete,
  onClearHistory,
}: {
  requests: SchoolRequest[]
  processing: string | null
  onApprove: (id: string) => void
  onReject: (id: string) => void
  onDelete: (id: string) => void
  onClearHistory: () => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  const pending = requests.filter(r => r.status === "PENDING")
  const processed = requests.filter(r => r.status !== "PENDING")

  return (
    <div>
      {pending.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-green-400" />
          <p className="text-gray-400 dark:text-gray-500 text-sm">Aucune demande en attente</p>
          {processed.length > 0 && (
            <div className="flex items-center gap-3 justify-center mt-1">
              <button onClick={() => setShowHistory(v => !v)} className="text-xs text-tahfidz-green hover:underline">{showHistory ? "Masquer" : `Voir l'historique (${processed.length})`}</button>
              <button onClick={onClearHistory} className="text-xs text-red-400 hover:text-red-600 hover:underline flex items-center gap-1"><X size={11} /> Vider</button>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          <div className="px-5 py-2.5 bg-orange-50 dark:bg-orange-900/20 flex items-center">
            <span className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{pending.length} demande{pending.length > 1 ? "s" : ""} en attente</span>
          </div>
          {pending.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />)}
        </div>
      )}
      {processed.length > 0 && pending.length > 0 && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center">
            <button onClick={() => setShowHistory(v => !v)} className="flex-1 px-5 py-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <ChevronDown size={13} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />
              {showHistory ? "Masquer" : `Historique — ${processed.length} demande${processed.length > 1 ? "s" : ""} traitee${processed.length > 1 ? "s" : ""}`}
            </button>
            <button onClick={onClearHistory} className="px-4 py-3 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition flex items-center gap-1"><X size={13} /> Vider</button>
          </div>
          {showHistory && (
            <div className="divide-y divide-gray-50 dark:divide-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              {processed.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />)}
            </div>
          )}
        </div>
      )}
      {processed.length > 0 && pending.length === 0 && showHistory && (
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          {processed.map(r => <RequestCard key={r.id} r={r} processing={processing} onApprove={onApprove} onReject={onReject} onDelete={onDelete} />)}
        </div>
      )}
    </div>
  )
}
