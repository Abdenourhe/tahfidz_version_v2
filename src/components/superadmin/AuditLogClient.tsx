"use client"
// src/components/superadmin/AuditLogClient.tsx
// Interface riche pour les logs d'audit — filtres, pagination, détails

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Shield, Search, Filter, ChevronDown, ChevronUp,
  Eye, Calendar, User, Server, AlertTriangle, Info,
  AlertCircle, Download, RefreshCw, X, Activity,
  ArrowLeft, ArrowRight, Clock, MapPin, FileJson,
  CheckCircle2, XCircle, School,
  Users, GraduationCap, Bell, Settings, Database
} from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { AuditLogItem } from "@/app/superadmin/audit/page"

// ── Types ──────────────────────────────────────────────────────────

interface Props {
  logs: AuditLogItem[]
  totalCount: number
  currentPage: number
  pageSize: number
  stats: {
    topActions: { action: string; count: number }[]
    severityBreakdown: { severity: string; count: number }[]
  }
  filters: {
    action: string
    severity: string
    actorRole: string
    targetType: string
    dateFrom: string
    dateTo: string
    search: string
  }
}

// ── Mapping des icônes ─────────────────────────────────────────────

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <CheckCircle2 className="w-4 h-4" />,
  UPDATE: <Settings className="w-4 h-4" />,
  DELETE: <XCircle className="w-4 h-4" />,
  LOGIN: <User className="w-4 h-4" />,
  LOGOUT: <User className="w-4 h-4" />,
  BROADCAST: <Bell className="w-4 h-4" />,
  SCHOOL_APPROVE: <School className="w-4 h-4" />,
  SCHOOL_REJECT: <XCircle className="w-4 h-4" />,
  SCHOOL_SUSPEND: <AlertTriangle className="w-4 h-4" />,
  USER_CREATE: <Users className="w-4 h-4" />,
  USER_DELETE: <XCircle className="w-4 h-4" />,
  STUDENT_ENROLL: <GraduationCap className="w-4 h-4" />,
  EVALUATION_GRADE: <Activity className="w-4 h-4" />,
  BADGE_AWARD: <Shield className="w-4 h-4" />,
  FEEDBACK_RESOLVE: <CheckCircle2 className="w-4 h-4" />,
  EXPORT: <Download className="w-4 h-4" />,
  IMPORT: <Database className="w-4 h-4" />,
  BACKUP: <Database className="w-4 h-4" />,
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  UPDATE: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  LOGIN: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  LOGOUT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  BROADCAST: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  SCHOOL_APPROVE: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  SCHOOL_REJECT: "bg-red-500/10 text-red-400 border-red-500/20",
  SCHOOL_SUSPEND: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  USER_DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  EXPORT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  IMPORT: "bg-violet-500/10 text-violet-400 border-violet-500/20",
}

const SEVERITY_CONFIG = {
  INFO: { icon: <Info className="w-4 h-4" />, color: "text-blue-400 bg-blue-500/10", label: "Info" },
  WARNING: { icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-400 bg-amber-500/10", label: "Avertissement" },
  CRITICAL: { icon: <AlertCircle className="w-4 h-4" />, color: "text-red-400 bg-red-500/10", label: "Critique" },
}

// ── Composant principal ────────────────────────────────────────────

export function AuditLogClient({ logs, totalCount, currentPage, pageSize, stats, filters }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams() ?? new URLSearchParams()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  // ── Helpers ──────────────────────────────────────────────────────

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "all") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set("page", "1")
    router.push(`/superadmin/audit?${params.toString()}`)
  }

  function clearFilters() {
    router.push("/superadmin/audit")
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`/superadmin/audit?${params.toString()}`)
  }

  function toggleExpand(id: string) {
    setExpandedId(expandedId === id ? null : id)
  }

  function parseDetails(details: string | null): Record<string, any> | null {
    if (!details) return null
    try {
      return JSON.parse(details)
    } catch {
      return { raw: details }
    }
  }

  const hasActiveFilters =
    filters.action !== "all" ||
    filters.severity !== "all" ||
    filters.actorRole !== "all" ||
    filters.targetType !== "all" ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.search

  // ── Render ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Shield className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Journal d&apos;Audit</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  {totalCount.toLocaleString("fr-FR")} événement{totalCount > 1 ? "s" : ""} enregistré{totalCount > 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700"
              >
                <RefreshCw className="w-4 h-4" />
                Actualiser
              </button>
              <button
                onClick={() => alert("Export CSV — à implémenter")}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.severityBreakdown.map((item) => {
            const config = SEVERITY_CONFIG[item.severity as keyof typeof SEVERITY_CONFIG]
            return (
              <div
                key={item.severity}
                className={`p-4 rounded-xl border ${config?.color.replace("text-", "border-").split(" ")[1]} bg-gray-900/50`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {config?.icon}
                  <span className={`text-sm font-medium ${config?.color.split(" ")[0]}`}>
                    {config?.label || item.severity}
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{item.count}</p>
              </div>
            )
          })}
          <div className="p-4 rounded-xl border border-gray-700 bg-gray-900/50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-400">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{totalCount}</p>
          </div>
        </div>

        {/* Barre de recherche + filtres */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Rechercher par action, email, nom ou cible..."
                defaultValue={filters.search}
                onChange={(e) => {
                  const val = e.target.value
                  const params = new URLSearchParams(searchParams.toString())
                  if (val) params.set("search", val)
                  else params.delete("search")
                  params.set("page", "1")
                  router.push(`/superadmin/audit?${params.toString()}`)
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border ${
                showFilters || hasActiveFilters
                  ? "bg-indigo-600 border-indigo-500 text-white"
                  : "bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded text-xs">
                  {[filters.action, filters.severity, filters.actorRole, filters.targetType, filters.dateFrom, filters.dateTo]
                    .filter(Boolean)
                    .filter((v) => v !== "all").length}
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-sm text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 border-t border-gray-800">
              <select
                value={filters.action}
                onChange={(e) => updateFilter("action", e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">Toutes les actions</option>
                <option value="CREATE">Création</option>
                <option value="UPDATE">Modification</option>
                <option value="DELETE">Suppression</option>
                <option value="LOGIN">Connexion</option>
                <option value="LOGOUT">Déconnexion</option>
                <option value="BROADCAST">Broadcast</option>
                <option value="SCHOOL_APPROVE">École approuvée</option>
                <option value="SCHOOL_REJECT">École rejetée</option>
                <option value="SCHOOL_SUSPEND">École suspendue</option>
                <option value="EXPORT">Export</option>
                <option value="IMPORT">Import</option>
              </select>

              <select
                value={filters.severity}
                onChange={(e) => updateFilter("severity", e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">Toutes sévérités</option>
                <option value="INFO">Info</option>
                <option value="WARNING">Avertissement</option>
                <option value="CRITICAL">Critique</option>
              </select>

              <select
                value={filters.actorRole}
                onChange={(e) => updateFilter("actorRole", e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">Tous les rôles</option>
                <option value="SUPERADMIN">SuperAdmin</option>
                <option value="ADMIN">Admin</option>
                <option value="TEACHER">Enseignant</option>
                <option value="PARENT">Parent</option>
                <option value="STUDENT">Élève</option>
                <option value="SYSTEM">Système</option>
              </select>

              <select
                value={filters.targetType}
                onChange={(e) => updateFilter("targetType", e.target.value)}
                className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="all">Toutes les cibles</option>
                <option value="School">École</option>
                <option value="User">Utilisateur</option>
                <option value="Student">Élève</option>
                <option value="Teacher">Enseignant</option>
                <option value="Parent">Parent</option>
                <option value="Group">Groupe</option>
                <option value="Evaluation">Évaluation</option>
                <option value="Broadcast">Broadcast</option>
                <option value="Feedback">Feedback</option>
              </select>

              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => updateFilter("dateFrom", e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                  placeholder="Du"
                />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => updateFilter("dateTo", e.target.value)}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 w-full"
                  placeholder="Au"
                />
              </div>
            </div>
          )}
        </div>

        {/* Liste des logs */}
        <div className="space-y-3">
          {logs.length === 0 ? (
            <div className="text-center py-16 bg-gray-900/30 border border-gray-800 rounded-xl">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg font-medium">Aucun log trouvé</p>
              <p className="text-gray-500 text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedId === log.id
              const details = parseDetails(log.details)
              const actionColor = ACTION_COLORS[log.action] || "bg-gray-500/10 text-gray-400 border-gray-500/20"
              const severityConfig = SEVERITY_CONFIG[log.severity as keyof typeof SEVERITY_CONFIG]

              return (
                <div
                  key={log.id}
                  className={`bg-gray-900/50 border rounded-xl transition-all duration-200 ${
                    isExpanded ? "border-indigo-500/30 ring-1 ring-indigo-500/10" : "border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {/* Ligne principale */}
                  <div
                    onClick={() => toggleExpand(log.id)}
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                  >
                    {/* Icône action */}
                    <div className={`p-2 rounded-lg border ${actionColor}`}>
                      {ACTION_ICONS[log.action] || <Activity className="w-4 h-4" />}
                    </div>

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${actionColor}`}>
                          {log.action}
                        </span>
                        {severityConfig && (
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${severityConfig.color.replace("text-", "border-").split(" ")[1]}`}>
                            {severityConfig.label}
                          </span>
                        )}
                        {log.targetType && (
                          <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-400 border border-gray-700">
                            {log.targetType}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-gray-300 font-medium">{log.actorName || log.actorEmail}</span>
                          <span className="text-gray-500">({log.actorRole})</span>
                        </span>
                        {log.targetName && (
                          <>
                            <span className="text-gray-600">→</span>
                            <span className="text-gray-300">{log.targetName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Date + flèche */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: fr })}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </div>

                  {/* Détails expandables */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 border-t border-gray-800/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Informations de l'acteur */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-3.5 h-3.5" />
                            Acteur
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID</span>
                              <span className="text-gray-300 font-mono text-xs">{log.actorId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Email</span>
                              <span className="text-gray-300">{log.actorEmail}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nom</span>
                              <span className="text-gray-300">{log.actorName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Rôle</span>
                              <span className="text-gray-300">{log.actorRole}</span>
                            </div>
                          </div>
                        </div>

                        {/* Informations de la cible */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Eye className="w-3.5 h-3.5" />
                            Cible
                          </h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Type</span>
                              <span className="text-gray-300">{log.targetType || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">ID</span>
                              <span className="text-gray-300 font-mono text-xs">{log.targetId || "—"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Nom</span>
                              <span className="text-gray-300">{log.targetName || "—"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Informations techniques */}
                        <div className="space-y-3 md:col-span-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Server className="w-3.5 h-3.5" />
                            Informations techniques
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                            <div className="flex items-center gap-2 bg-gray-800/50 p-2.5 rounded-lg border border-gray-700/50">
                              <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                              <div>
                                <p className="text-gray-500 text-xs">IP Address</p>
                                <p className="text-gray-300 font-mono">{log.ipAddress || "—"}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 p-2.5 rounded-lg border border-gray-700/50">
                              <Calendar className="w-4 h-4 text-gray-500 shrink-0" />
                              <div>
                                <p className="text-gray-500 text-xs">Horodatage</p>
                                <p className="text-gray-300 font-mono text-xs">{log.createdAt}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 bg-gray-800/50 p-2.5 rounded-lg border border-gray-700/50">
                              <FileJson className="w-4 h-4 text-gray-500 shrink-0" />
                              <div>
                                <p className="text-gray-500 text-xs">Log ID</p>
                                <p className="text-gray-300 font-mono text-xs">{log.id}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Détails JSON */}
                        {details && (
                          <div className="md:col-span-2 space-y-3">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                              <FileJson className="w-3.5 h-3.5" />
                              Détails de l&apos;action
                            </h4>
                            <pre className="bg-gray-950 border border-gray-800 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto font-mono">
                              {JSON.stringify(details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-800">
            <p className="text-sm text-gray-500">
              Affichage de <span className="text-gray-300">{(currentPage - 1) * pageSize + 1}</span> à{" "}
              <span className="text-gray-300">{Math.min(currentPage * pageSize, totalCount)}</span> sur{" "}
              <span className="text-gray-300">{totalCount}</span> résultats
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Précédent
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logique pour afficher les pages autour de la page courante
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        pageNum === currentPage
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700"
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Suivant
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}