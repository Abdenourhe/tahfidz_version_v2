"use client"
import { Fragment, useMemo } from "react"
import Image from "next/image"
import {
  Search, X, Download, Plus, RefreshCw, Check, Ban, Trash2,
  ChevronDown, ChevronRight, Pencil, ToggleLeft, ToggleRight,
  Copy, TrendingUp, Zap,
  MapPin, Phone, Mail, Building2, Users, UserCog, BookOpen, GraduationCap, KeyRound,
} from "lucide-react"
import { School, TimeRange } from "./types"
import { formatPhone } from "./types"

export function SchoolsTab({
  schools,
  filteredSchools,
  paginatedSchools,
  totalPages,
  search,
  setSearch,
  filterPlan,
  setFilterPlan,
  filterStatus,
  setFilterStatus,
  autoRefresh,
  setAutoRefresh,
  lastRefresh,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  setItemsPerPage,
  selectedSchools,
  showBulkActions,
  toggleSelectSchool,
  selectAll,
  bulkToggle,
  bulkDelete,
  expandedSchool,
  setExpandedSchool,
  timeRange,
  setTimeRange,
  copied,
  copyToClipboard,
  onToggle,
  onOpenEdit,
  onDeleteSchool,
  onExportCSV,
  onCreateClick,
}: {
  schools: School[]
  filteredSchools: School[]
  paginatedSchools: School[]
  totalPages: number
  search: string
  setSearch: (v: string) => void
  filterPlan: string
  setFilterPlan: (v: string) => void
  filterStatus: string
  setFilterStatus: (v: string) => void
  autoRefresh: boolean
  setAutoRefresh: (v: boolean) => void
  lastRefresh: Date
  currentPage: number
  setCurrentPage: (v: number) => void
  itemsPerPage: number
  setItemsPerPage: (v: number) => void
  selectedSchools: Set<string>
  showBulkActions: boolean
  toggleSelectSchool: (id: string) => void
  selectAll: () => void
  bulkToggle: (active: boolean) => void
  bulkDelete: () => void
  expandedSchool: string | null
  setExpandedSchool: (id: string | null) => void
  timeRange: TimeRange
  setTimeRange: (v: TimeRange) => void
  copied: string | null
  copyToClipboard: (text: string, key: string) => void
  onToggle: (id: string, current: boolean) => void
  onOpenEdit: (s: School) => void
  onDeleteSchool: (s: School) => void
  onExportCSV: () => void
  onCreateClick: () => void
}) {
  const growthData = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : timeRange === "90d" ? 90 : 365
    return Array.from({ length: days }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (days - 1 - i))
      const dateStr = d.toISOString().split("T")[0]
      const count = schools.filter(s => new Date(s.createdAt).toISOString().split("T")[0] === dateStr).length
      return { date: d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }), count }
    })
  }, [schools, timeRange])

  const topSchools = useMemo(() =>
    [...schools].sort((a, b) => b._count.users - a._count.users).slice(0, 5),
    [schools]
  )

  return (
    <>
      {/* Barre de filtres avancés */}
      <div className="p-4 border-b border-gray-50 dark:border-gray-800 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, slug, ville..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onExportCSV} className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition" title="Exporter CSV"><Download size={14} /> CSV</button>
            <button onClick={onCreateClick}
              className="flex items-center gap-1.5 px-4 py-2 gradient-tahfidz text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"><Plus size={14} /> Creer</button>
          </div>
        </div>

        {/* Filtres avancés */}
        <div className="flex flex-wrap items-center gap-2">
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <option value="ALL">Tous les plans</option>
            <option value="FREE">Free</option>
            <option value="STARTER">Starter</option>
            <option value="PRO">Pro</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actives</option>
            <option value="INACTIVE">Inactives</option>
          </select>
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg border transition ${autoRefresh ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "border-gray-200 dark:border-gray-700 text-gray-500"}`}>
            <RefreshCw size={12} className={autoRefresh ? "animate-spin" : ""} />
            Auto {autoRefresh ? "ON" : "OFF"}
          </button>
          {autoRefresh && <span className="text-[10px] text-gray-400">Refresh: {lastRefresh.toLocaleTimeString()}</span>}
          <span className="text-xs text-gray-400 ml-auto">{filteredSchools.length} ecole(s)</span>
        </div>
      </div>

      {/* Bulk actions bar */}
      {showBulkActions && (
        <div className="px-4 py-3 bg-tahfidz-green-light dark:bg-emerald-900/30 border-b border-tahfidz-green/20 flex items-center justify-between">
          <span className="text-sm text-tahfidz-green font-medium">{selectedSchools.size} selectionnee(s)</span>
          <div className="flex items-center gap-2">
            <button onClick={() => bulkToggle(true)} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition flex items-center gap-1"><Check size={12} /> Activer</button>
            <button onClick={() => bulkToggle(false)} className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition flex items-center gap-1"><Ban size={12} /> Desactiver</button>
            <button onClick={bulkDelete} className="px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"><Trash2 size={12} /> Supprimer</button>
            <button onClick={() => { selectAll(); }} className="px-3 py-1.5 text-gray-400 hover:text-gray-600 text-xs"><X size={12} /></button>
          </div>
        </div>
      )}

      {search.trim() && <div className="px-4 py-2 text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50">{filteredSchools.length} resultat{filteredSchools.length !== 1 ? "s" : ""} pour &laquo;{search}&raquo;</div>}

      {/* Growth chart */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5"><TrendingUp size={14} className="text-tahfidz-green" /> Croissance des inscriptions</h4>
          <div className="flex gap-1">
            {(["7d", "30d", "90d", "1y"] as const).map(r => (
              <button key={r} onClick={() => setTimeRange(r)} className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${timeRange === r ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200"}`}>
                {r === "7d" ? "7j" : r === "30d" ? "30j" : r === "90d" ? "90j" : "1an"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1 h-16">
          {growthData.map((d, i) => {
            const max = Math.max(...growthData.map(g => g.count), 1)
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div className="w-full bg-tahfidz-green/20 dark:bg-tahfidz-green/30 rounded-t-sm transition-all hover:bg-tahfidz-green/40" style={{ height: `${(d.count / max) * 100}%` }} />
                <span className="text-[8px] text-gray-400 rotate-45 origin-left translate-y-1">{d.date}</span>
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10">{d.count} ecole(s)</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top schools */}
      <div className="px-6 py-4 border-b border-gray-50 dark:border-gray-800">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-1.5"><Zap size={14} className="text-amber-500" /> Top ecoles par utilisateurs</h4>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {topSchools.map((s, i) => (
            <div key={s.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xs">#{i + 1}</span>
              </div>
              <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{s.name}</p>
              <p className="text-xs text-tahfidz-green font-bold">{s._count.users} users</p>
              <p className="text-[10px] text-gray-400">{s.plan}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <tr>
              <th className="w-8 px-3 py-3"><input type="checkbox" checked={selectedSchools.size === filteredSchools.length && filteredSchools.length > 0} onChange={selectAll} className="rounded border-gray-300" /></th>
              <th className="w-8 px-3 py-3"></th>
              {["Logo", "Ecole", "Slug", "Plan", "Users", "Creation", "Statut", "Actions"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedSchools.length === 0 ? (
              <tr><td colSpan={10} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500 text-sm">{search ? `Aucune ecole trouvee pour &laquo;${search}&raquo;` : "Aucune ecole"}</td></tr>
            ) : paginatedSchools.map(s => {
              const admin = s.users.find(u => u.role === "ADMIN" || u.role === "SUPERADMIN")
              const byRole = s.users.reduce<Record<string, number>>((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {})
              const isOpen = expandedSchool === s.id
              const isSelected = selectedSchools.has(s.id)
              return (
                <Fragment key={s.id}>
                  <tr
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/40 transition border-t border-gray-50 dark:border-gray-800 cursor-pointer select-none ${isSelected ? "bg-tahfidz-green-light/30 dark:bg-emerald-900/20" : ""}`}
                    onClick={() => setExpandedSchool(isOpen ? null : s.id)}
                  >
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}><input type="checkbox" checked={isSelected} onChange={() => toggleSelectSchool(s.id)} className="rounded border-gray-300" /></td>
                    <td className="px-3 py-3 text-gray-300">
                      {isOpen ? <ChevronDown size={14} className="text-tahfidz-green" /> : <ChevronRight size={14} />}
                    </td>
                    <td className="px-4 py-3"><div className="w-9 h-9 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">{s.logo ? (<Image src={s.logo} alt={s.name} width={36} height={36} className="w-full h-full object-contain p-0.5 bg-white" unoptimized />) : (<div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center"><span className="text-white font-bold text-sm">{s.name.charAt(0)}</span></div>)}</div></td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{s.name}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-1.5"><span className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{s.slug}</span><button onClick={() => copyToClipboard(s.slug, `slug-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `slug-${s.id}` ? <Check size={12} className="text-tahfidz-green" /> : <Copy size={12} />}</button></div></td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.plan === "ENTERPRISE" ? "bg-amber-100 text-amber-700" : s.plan === "PRO" ? "bg-tahfidz-purple-light text-tahfidz-purple" : s.plan === "STARTER" ? "bg-blue-50 text-blue-600" : "bg-gray-100 text-gray-500"}`}>{s.plan}</span></td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-center">{s._count.users}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{s.isActive ? "Active" : "Inactive"}</span></td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => onToggle(s.id, s.isActive)} title={s.isActive ? "Desactiver" : "Activer"} className={`p-1.5 rounded-lg transition ${s.isActive ? "hover:bg-red-50 text-red-400" : "hover:bg-green-50 text-gray-400 hover:text-green-600"}`}>{s.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}</button>
                        <button onClick={() => onOpenEdit(s)} title="Modifier" className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-300 hover:text-blue-500 transition"><Pencil size={15} /></button>
                        <button onClick={() => onDeleteSchool(s)} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-300 hover:text-red-500 transition"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan={10} className="bg-gradient-to-r from-tahfidz-green-light/30 to-white dark:from-emerald-900/20 dark:to-gray-900 px-6 py-5 border-b border-tahfidz-green/10 dark:border-emerald-900/30">
                        <div className="flex items-center gap-4 mb-5 pb-4 border-b border-tahfidz-green/10 dark:border-emerald-900/30">
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm flex-shrink-0">{s.logo ? (<Image src={s.logo} alt={s.name} width={56} height={56} className="w-full h-full object-contain p-1 bg-white" unoptimized />) : (<div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center"><span className="text-white font-bold text-xl">{s.name.charAt(0)}</span></div>)}</div>
                          <div><h3 className="font-bold text-gray-900 dark:text-gray-100 text-base">{s.name}</h3>{s.nameAr && <p className="arabic text-sm text-gray-500 dark:text-gray-400">{s.nameAr}</p>}<div className="flex items-center gap-2 mt-1"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{s.isActive ? "Active" : "Inactive"}</span><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.plan === "ENTERPRISE" ? "bg-amber-100 text-amber-700" : s.plan === "PRO" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>{s.plan}</span>{!s.logo && <span className="text-[10px] text-gray-300 italic">Aucun logo</span>}</div></div>
                        </div>
                        <div className="grid grid-cols-4 gap-5">
                          <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><MapPin size={11} /> Coordonnees</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">{s.address && <div className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-gray-300"><MapPin size={11} className="text-tahfidz-green mt-0.5 shrink-0" /><span>{s.address}</span></div>}<div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Building2 size={11} className="text-tahfidz-green shrink-0" /><span>{[s.city, s.country].filter(Boolean).join(", ") || <span className="italic text-gray-300">Non renseigne</span>}</span></div>{s.phone && <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300"><Phone size={11} className="text-tahfidz-green shrink-0" /><span className="font-mono">{formatPhone(s.phone)}</span></div>}{!s.address && !s.city && !s.phone && <p className="text-xs text-gray-300 italic">Aucune coordonnee</p>}</div></div>
                          <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><UserCog size={11} /> Administrateur</p>{admin ? (<div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-1.5"><p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{admin.fullName}</p><p className="text-xs text-gray-400 flex items-center gap-1.5"><Mail size={11} />{admin.email}</p><div className="flex items-center gap-2 pt-1"><span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${admin.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>{admin.isActive ? "Actif" : "Inactif"}</span><span className="text-[10px] text-gray-300">depuis {new Date(admin.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span></div></div>) : <p className="text-xs text-gray-300 italic">Aucun admin</p>}</div>
                          <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><Users size={11} /> Utilisateurs ({s._count.users})</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2">{[{ role: "ADMIN", label: "Admins", icon: <UserCog size={12} />, color: "text-tahfidz-purple" }, { role: "TEACHER", label: "Enseignants", icon: <BookOpen size={12} />, color: "text-blue-500" }, { role: "STUDENT", label: "Eleves", icon: <GraduationCap size={12} />, color: "text-tahfidz-green" }, { role: "PARENT", label: "Parents", icon: <Users size={12} />, color: "text-orange-400" }].map(({ role, label, icon, color }) => (<div key={role} className="flex items-center justify-between"><span className={`flex items-center gap-1.5 text-xs ${color}`}>{icon}{label}</span><span className="text-xs font-bold text-gray-700 dark:text-gray-300">{byRole[role] ?? 0}</span></div>))}</div></div>
                          <div className="space-y-2"><p className="text-[10px] font-bold uppercase text-gray-400 tracking-wider flex items-center gap-1"><KeyRound size={11} /> Identifiants</p><div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-3 space-y-2"><div className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400">Slug</span><div className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{s.slug}</span><button onClick={() => copyToClipboard(s.slug, `detail-slug-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `detail-slug-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}</button></div></div>{admin && (<div className="flex items-center justify-between gap-2"><span className="text-xs text-gray-400">Email</span><div className="flex items-center gap-1"><span className="font-mono text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 truncate max-w-[110px]">{admin.email}</span><button onClick={() => copyToClipboard(admin.email, `detail-email-${s.id}`)} className="text-gray-300 hover:text-tahfidz-green transition">{copied === `detail-email-${s.id}` ? <Check size={11} className="text-tahfidz-green" /> : <Copy size={11} />}</button></div></div>)}<div className="pt-1 border-t border-gray-50 dark:border-gray-700"><p className="text-[10px] text-gray-300">URL : /login → identifiant : {s.slug}</p></div></div></div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredSchools.length > itemsPerPage && (
        <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              Page {currentPage} sur {totalPages} ({filteredSchools.length} ecoles)
            </span>
            <select value={itemsPerPage} onChange={e => setItemsPerPage(Number(e.target.value))}
              className="text-xs border rounded-lg px-2 py-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100">
              <option value={10}>10/page</option>
              <option value={25}>25/page</option>
              <option value={50}>50/page</option>
            </select>
          </div>
          <div className="flex gap-1">
            <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}
              className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">←</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = Math.min(Math.max(i + 1, currentPage - 2), totalPages - 4) + i
              if (page < 1 || page > totalPages) return null
              return (
                <button key={page} onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 rounded-lg text-xs ${page === currentPage ? "bg-emerald-600 text-white" : "border dark:border-gray-700 dark:text-gray-300"}`}>
                  {page}
                </button>
              )
            })}
            <button onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}
              className="px-2 py-1 rounded-lg border text-xs disabled:opacity-50 dark:border-gray-700 dark:text-gray-300">→</button>
          </div>
        </div>
      )}
    </>
  )
}
