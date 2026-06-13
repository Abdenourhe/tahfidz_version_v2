"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { motion } from "framer-motion"
import { Plus, BookOpen, Pencil, Trash2, AlertTriangle, Loader2, FileText, Video, Headphones, Search } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  color?: string | null
}

interface Collection {
  id: string
  name: string
}

interface Content {
  id: string
  title: string
  type: string
  status: string
  visibility: string
  thumbnail?: string | null
  category: Category
  collection?: { id: string; name: string } | null
  _count: { episodes: number }
  createdAt: string | Date
}

interface Props {
  contents: Content[]
  categories: Category[]
  collections: Collection[]
}

export function ContentListClient({ contents, categories, collections }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("")
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterVisibility, setFilterVisibility] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterCollection, setFilterCollection] = useState<string>("")

  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = filterType ? c.type === filterType : true
      const matchesStatus = filterStatus ? c.status === filterStatus : true
      const matchesVisibility = filterVisibility ? c.visibility === filterVisibility : true
      const matchesCategory = filterCategory ? c.category.id === filterCategory : true
      const matchesCollection = filterCollection ? c.collection?.id === filterCollection : true
      return matchesSearch && matchesType && matchesStatus && matchesVisibility && matchesCategory && matchesCollection
    })
  }, [contents, search, filterType, filterStatus, filterVisibility, filterCategory, filterCollection])

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/library/contents/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }

  const typeIcon: Record<string, React.ReactNode> = {
    PDF: <FileText size={18} />,
    VIDEO_SINGLE: <Video size={18} />,
    VIDEO_SERIES: <Video size={18} />,
    AUDIO: <Headphones size={18} />,
  }

  const typeLabel: Record<string, string> = {
    PDF: t("typePdf"),
    VIDEO_SINGLE: t("typeVideoSingle"),
    VIDEO_SERIES: t("typeVideoSeries"),
    AUDIO: t("typeAudio"),
  }

  const statusStyle: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    PUBLISHED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    ARCHIVED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  const visibilityStyle: Record<string, string> = {
    GLOBAL: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
    SCHOOL: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    CLASS: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("contents")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{filteredContents.length} {t("contents").toLowerCase()}</p>
        </div>
        <Link href="/admin/library/contents/new" className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("newContent")}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{t("allTypes")}</option>
            <option value="PDF">{t("typePdf")}</option>
            <option value="VIDEO_SINGLE">{t("typeVideoSingle")}</option>
            <option value="VIDEO_SERIES">{t("typeVideoSeries")}</option>
            <option value="AUDIO">{t("typeAudio")}</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{t("status")}</option>
            <option value="DRAFT">{t("statusDraft")}</option>
            <option value="PUBLISHED">{t("statusPublished")}</option>
            <option value="ARCHIVED">{t("statusArchived")}</option>
          </select>
          <select value={filterVisibility} onChange={(e) => setFilterVisibility(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{t("visibility")}</option>
            <option value="GLOBAL">{t("visibilityGlobal")}</option>
            <option value="SCHOOL">{t("visibilitySchool")}</option>
            <option value="CLASS">{t("visibilityClass")}</option>
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{t("category")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterCollection} onChange={(e) => setFilterCollection(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            <option value="">{t("collection")}</option>
            {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {filteredContents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noContents")}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredContents.map((content, i) => (
              <motion.div
                key={content.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                  {content.thumbnail ? (
                    <img
                      src={content.thumbnail.startsWith("r2://") ? `/api/library/images/${encodeURIComponent(content.thumbnail.slice(5))}` : content.thumbnail}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    typeIcon[content.type] || <BookOpen size={18} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{content.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", statusStyle[content.status])}>{t(`status${content.status}` as any) || content.status}</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", visibilityStyle[content.visibility])}>{t(`visibility${content.visibility}` as any) || content.visibility}</span>
                    <span className="text-xs text-gray-500">{typeLabel[content.type] || content.type}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: content.category.color ? `${content.category.color}20` : "#E8F8F2", color: content.category.color || "#1D9E75" }}>{content.category.name}</span>
                    {content.collection && <span className="text-xs text-gray-400">{content.collection.name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/admin/library/contents/${content.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Pencil size={14} />
                  </Link>
                  <button onClick={() => setDeleteId(content.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4"><AlertTriangle size={28} className="text-red-600" /></div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("delete") || "Supprimer"}</h3>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t("cancel") || "Annuler"}</button>
              <button onClick={() => handleDelete(deleteId)} disabled={loading} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">{loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (t("delete") || "Supprimer")}</button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
