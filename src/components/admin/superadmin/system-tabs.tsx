"use client"
import { useMemo, useState } from "react"
import {
  Loader2, Activity, AlertTriangle, Search, RefreshCw, Eye, Inbox,
} from "lucide-react"
import { SystemHealth, AuditLog, FeedbackItem } from "./types"
import { formatDate, getActionColor, getActionLabel, getTargetIcon, getFeedbackTypeColor, getFeedbackTypeLabel, getStatusColor, getStatusLabel, getPriorityColor, getPriorityLabel } from "./types"

// ─── MiniBarChart ─────────────────────────────────────────────────
function MiniBarChart({ data, color = "bg-tahfidz-green" }: { data: number[]; color?: string }) {
  const max = Math.max(...data, 1)
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div key={i} className={`w-1.5 rounded-sm ${color}`} style={{ height: `${(v / max) * 100}%`, opacity: 0.3 + (i / data.length) * 0.7 }} />
      ))}
    </div>
  )
}

// ─── Health Tab ───────────────────────────────────────────────────
export function HealthTab({ health, loading }: { health: SystemHealth | null; loading: boolean }) {
  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-tahfidz-green" /></div>
  }
  if (!health) {
    return <div className="text-center py-12 text-gray-400"><p>Impossible de charger les donnees de sante</p></div>
  }
  return (
    <div className="p-6 space-y-6">
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${health.status === "healthy" ? "bg-green-50 border-green-200 text-green-700" : health.status === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-700" : "bg-red-50 border-red-200 text-red-700"}`}>
        <Activity size={24} />
        <div><p className="font-semibold">Systeme {health.status === "healthy" ? "Sain" : health.status === "warning" ? "Attention" : "Critique"}</p><p className="text-xs">Dernier check : {formatDate(new Date())}</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Latence API</p>
          <p className={`text-2xl font-bold ${health.apiLatency < 200 ? "text-green-600" : health.apiLatency < 500 ? "text-yellow-600" : "text-red-600"}`}>{health.apiLatency}ms</p>
          <MiniBarChart data={[health.apiLatency * 0.8, health.apiLatency * 0.9, health.apiLatency, health.apiLatency * 1.1, health.apiLatency * 0.95]} color={health.apiLatency < 200 ? "bg-green-500" : health.apiLatency < 500 ? "bg-yellow-500" : "bg-red-500"} />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Base de donnees</p>
          <p className={`text-lg font-bold ${health.dbStatus === "connected" ? "text-green-600" : "text-red-600"}`}>{health.dbStatus === "connected" ? "Connectee" : "Deconnectee"}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs text-gray-400 mb-1">Erreurs 24h</p>
          <p className={`text-2xl font-bold ${health.errorCount24h === 0 ? "text-green-600" : health.errorCount24h < 10 ? "text-yellow-600" : "text-red-600"}`}>{health.errorCount24h}</p>
        </div>
      </div>
      {health.lastError && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-red-600 flex items-center gap-1.5 mb-2"><AlertTriangle size={12} /> Derniere erreur</p>
          <p className="text-xs text-red-700 font-mono bg-red-100 dark:bg-red-900/40 p-2 rounded">{health.lastError}</p>
        </div>
      )}
    </div>
  )
}

// ─── Audit Tab ────────────────────────────────────────────────────
export function AuditTab({ logs, loading, error, onReload }: { logs: AuditLog[]; loading: boolean; error: string | null; onReload: () => void }) {
  const [filter, setFilter] = useState("")
  const filtered = useMemo(() => {
    if (!filter.trim()) return logs
    const q = filter.toLowerCase()
    return logs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      (l.actor || "").toLowerCase().includes(q) ||
      (l.target || "").toLowerCase().includes(q) ||
      (l.targetType || "").toLowerCase().includes(q)
    )
  }, [logs, filter])

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrer par action, acteur ou cible..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
        </div>
        <button onClick={onReload} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-tahfidz-green hover:border-tahfidz-green transition"><RefreshCw size={14} /></button>
      </div>
      {error && (
        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-tahfidz-green" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Eye size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">{filter ? "Aucun log ne correspond au filtre" : "Aucun log d'audit trouvé"}</p>
              <p className="text-xs text-gray-300 mt-1">Les logs apparaissent lorsque des actions sont effectuées sur la plateforme</p>
            </div>
          ) : filtered.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition">
              <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${getActionColor(log.action)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{getActionLabel(log.action)}</span>
                  <span className="text-[10px] text-gray-400">par</span>
                  <span className="text-[11px] font-medium text-tahfidz-green">{log.actor || "Système"}</span>
                  {log.targetType && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{getTargetIcon(log.targetType)} {log.targetType}</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                  <span className="text-gray-400">Cible :</span> <span className="font-medium">{log.target || "—"}</span>
                  {log.targetId && log.targetId !== "—" && (
                    <span className="text-[10px] text-gray-400 ml-1">({log.targetId.slice(0, 8)}...)</span>
                  )}
                </p>
                {log.details && (
                  <p className="text-[10px] text-gray-400 mt-1 font-mono bg-gray-100 dark:bg-gray-700/50 p-1.5 rounded">{log.details}</p>
                )}
                {log.ipAddress && (
                  <p className="text-[10px] text-gray-400 mt-1">IP: {log.ipAddress}</p>
                )}
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{formatDate(log.createdAt)}</span>
            </div>
          ))}
          {filtered.length > 0 && (
            <p className="text-[10px] text-gray-400 text-center pt-2">{filtered.length} log(s) affiché(s)</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Feedback Tab ─────────────────────────────────────────────────
export function FeedbackTab({
  items,
  loading,
  error,
  onReload,
  onSelect,
}: {
  items: FeedbackItem[]
  loading: boolean
  error: string | null
  onReload: () => void
  onSelect: (fb: FeedbackItem) => void
}) {
  const [filter, setFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [priorityFilter, setPriorityFilter] = useState("ALL")

  const filtered = useMemo(() => {
    let result = [...items]
    if (filter.trim()) {
      const q = filter.toLowerCase()
      result = result.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q) ||
        f.user.fullName.toLowerCase().includes(q) ||
        f.user.email.toLowerCase().includes(q) ||
        f.school.name.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "ALL") result = result.filter(f => f.status === statusFilter)
    if (priorityFilter !== "ALL") result = result.filter(f => f.priority === priorityFilter)
    return result
  }, [items, filter, statusFilter, priorityFilter])

  return (
    <div className="p-6">
      {/* Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrer par titre, message ou auteur..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
        </div>
        <div className="flex gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="IN_PROGRESS">En cours</option>
            <option value="RESOLVED">Résolu</option>
            <option value="CLOSED">Fermé</option>
          </select>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            className="text-xs px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <option value="ALL">Toutes priorités</option>
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
            <option value="CRITICAL">Critique</option>
          </select>
          <button onClick={onReload} className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-tahfidz-green hover:border-tahfidz-green transition"><RefreshCw size={14} /></button>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: "Total", value: items.length, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800" },
          { label: "En attente", value: items.filter(f => f.status === "PENDING").length, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/20" },
          { label: "En cours", value: items.filter(f => f.status === "IN_PROGRESS").length, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Résolus", value: items.filter(f => f.status === "RESOLVED").length, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-lg p-3 text-center`}>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-3 mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-tahfidz-green" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Inbox size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">{filter ? "Aucun feedback ne correspond au filtre" : "Aucun feedback reçu"}</p>
              <p className="text-xs text-gray-300 mt-1">Les messages apparaissent quand un utilisateur envoie un signalement</p>
            </div>
          ) : filtered.map(fb => (
            <div key={fb.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition cursor-pointer"
              onClick={() => onSelect(fb)}>
              <div className={`w-2.5 h-2.5 rounded-full mt-2 shrink-0 ${fb.status === "PENDING" ? "bg-orange-500" : fb.status === "IN_PROGRESS" ? "bg-blue-500" : fb.status === "RESOLVED" ? "bg-green-500" : "bg-gray-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${getFeedbackTypeColor(fb.type)}`}>{getFeedbackTypeLabel(fb.type)}</span>
                  <span className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{fb.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(fb.status)}`}>{getStatusLabel(fb.status)}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${getPriorityColor(fb.priority)}`}>{getPriorityLabel(fb.priority)}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{fb.message}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className="text-[10px] text-tahfidz-green font-medium">{fb.user.fullName}</span>
                  <span className="text-[10px] text-gray-400">{fb.user.email}</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">{fb.user.role}</span>
                  <span className="text-[10px] text-gray-400">🏫 {fb.school.name}</span>
                  {fb.screenshot && <span className="text-[10px] text-blue-500">📎 Pièce jointe</span>}
                  <span className="text-[10px] text-gray-400 ml-auto">{formatDate(fb.createdAt)}</span>
                </div>
              </div>
            </div>
          ))}
          {items.length > 0 && (
            <p className="text-[10px] text-gray-400 text-center pt-2">{items.length} feedback(s)</p>
          )}
        </div>
      )}
    </div>
  )
}
