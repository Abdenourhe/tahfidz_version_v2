"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Search, Building2, Check, Ban, Trash2, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface School {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  city?: string | null
  country?: string | null
  createdAt: string | Date
  _count?: { users: number }
}

interface Props {
  schools: School[]
}

export function SuperAdminSchoolsClient({ schools }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = filterStatus ? (filterStatus === "active" ? s.isActive : !s.isActive) : true
      return matchesSearch && matchesStatus
    })
  }, [schools, search, filterStatus])

  const toggleSchool = async (id: string, current: boolean) => {
    setLoadingId(id)
    await fetch("/api/admin/schools", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "toggle", schoolId: id, isActive: !current }),
    })
    router.refresh()
    setLoadingId(null)
  }

  const deleteSchool = async (id: string) => {
    setLoadingId(id)
    await fetch(`/api/admin/schools?type=school&id=${id}`, { method: "DELETE" })
    router.refresh()
    setLoadingId(null)
    setDeleteId(null)
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Écoles</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filteredSchools.length} école(s)</p>
        </div>
        <button onClick={() => router.refresh()} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
          <RefreshCw size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une école..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
          />
        </div>
        <div className="flex gap-3">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>
        </div>
      </div>

      {filteredSchools.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">Aucune école trouvée</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
          {filteredSchools.map((school, i) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.03 }}
              className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{school.name}</h3>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    school.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {school.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {school.slug} · {school.plan} · {school.city ? `${school.city}, ` : ""}{school.country} · {new Date(school.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => toggleSchool(school.id, school.isActive)}
                  disabled={loadingId === school.id}
                  className={cn(
                    "p-2 rounded-lg transition",
                    school.isActive ? "text-amber-500 hover:bg-amber-50" : "text-emerald-500 hover:bg-emerald-50"
                  )}
                  title={school.isActive ? "Désactiver" : "Activer"}
                >
                  {loadingId === school.id ? <Loader2 size={16} className="animate-spin" /> : school.isActive ? <Ban size={16} /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => setDeleteId(school.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"><AlertTriangle size={28} className="text-red-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Supprimer l&apos;école ?</h3>
            <p className="text-sm text-gray-500 mb-4">Cette action est irréversible et supprimera tous les utilisateurs de cette école.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Annuler</button>
              <button onClick={() => deleteSchool(deleteId)} disabled={loadingId === deleteId} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">{loadingId === deleteId ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Supprimer"}</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
