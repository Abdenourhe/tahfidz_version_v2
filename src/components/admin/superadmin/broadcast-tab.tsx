"use client"
import { useState } from "react"
import { Send, Loader2, Bell } from "lucide-react"

export function BroadcastTab({
  schoolCount,
  activeCount,
  inactiveCount,
  sending,
  onSubmit,
}: {
  schoolCount: number
  activeCount: number
  inactiveCount: number
  sending: boolean
  onSubmit: (message: string, target: "all" | "active" | "inactive") => Promise<void>
}) {
  const [message, setMessage] = useState("")
  const [target, setTarget] = useState<"all" | "active" | "inactive">("all")

  const count = target === "all" ? schoolCount : target === "active" ? activeCount : inactiveCount

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return
    await onSubmit(message, target)
    setMessage("")
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2"><Send size={18} className="text-blue-500" /><h3 className="font-semibold text-gray-900 dark:text-gray-100">Message broadcast</h3></div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Destinataires</label>
            <div className="flex gap-2">
              {(["all", "active", "inactive"] as const).map(t => (
                <button key={t} type="button" onClick={() => setTarget(t)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition ${target === t ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"}`}>
                  {t === "all" ? "Toutes" : t === "active" ? "Actives" : "Inactives"}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">{count} ecole(s) concernee(s)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Message</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4} placeholder="Entrez votre message ici..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-[10px] text-gray-400 mt-1 text-right">{message.length} / 500</p>
          </div>
          <button type="submit" disabled={sending || !message.trim()}
            className="w-full py-2.5 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {sending ? <><Loader2 size={14} className="animate-spin" />Envoi...</> : <><Send size={14} /> Envoyer le message</>}
          </button>
        </form>
      </div>

      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><Bell size={14} className="text-amber-500" /> Derniers messages envoyes</h4>
        <div className="space-y-2">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Maintenance planifiee</span><span className="text-[10px] text-gray-400">il y a 2 jours</span></div>
            <p className="text-xs text-gray-500 mt-1">Intervention serveur prevue le 20 mai a 02h00 UTC.</p>
            <span className="text-[10px] text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Toutes les ecoles</span>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between"><span className="text-xs font-medium text-gray-700 dark:text-gray-300">Nouvelle fonctionnalite</span><span className="text-[10px] text-gray-400">il y a 5 jours</span></div>
            <p className="text-xs text-gray-500 mt-1">Export PDF des certificats maintenant disponible !</p>
            <span className="text-[10px] text-green-500 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full mt-1 inline-block">Ecoles actives</span>
          </div>
        </div>
      </div>
    </div>
  )
}
