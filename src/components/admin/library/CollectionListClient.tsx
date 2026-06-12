"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, FolderOpen, Pencil, Trash2, Users, BookOpen, AlertTriangle, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"

interface Collection {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
  isActive: boolean
  groupId?: string | null
  group?: { id: string; name: string } | null
  _count: { contents: number; enrollments: number }
  createdAt: string | Date
}

interface Props {
  collections: Collection[]
}

export function CollectionListClient({ collections }: Props) {
  const router = useRouter()
  const { useT, locale } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/library/collections/${id}`, { method: "DELETE" })
      if (res.ok) router.refresh()
    } finally {
      setLoading(false)
      setDeleteId(null)
    }
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("collections")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{collections.length} {t("collections").toLowerCase()}</p>
        </div>
        <Link
          href="/admin/library/collections/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition"
        >
          <Plus size={16} /> {t("newCollection")}
        </Link>
      </div>

      {collections.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <FolderOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noCollections")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {collections.map((collection, i) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              whileHover={{ scale: 1.01 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden card-hover"
            >
              <div
                className="h-24 bg-cover bg-center relative"
                style={{ backgroundColor: collection.color || "#1D9E75", backgroundImage: collection.coverImage ? `url(${collection.coverImage})` : undefined }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="font-bold text-white truncate">{collection.name}</h3>
                  {collection.nameAr && <p className="arabic text-xs text-white/80 truncate">{collection.nameAr}</p>}
                </div>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{collection.description || "—"}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {collection._count.contents}</span>
                  <span className="flex items-center gap-1"><Users size={12} /> {collection._count.enrollments}</span>
                  {collection.group && <span className="text-tahfidz-green">{collection.group.name}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                  <span className="text-xs text-gray-400">{formatDate(collection.createdAt, locale)}</span>
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/library/collections/${collection.id}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
                      <BookOpen size={14} />
                    </Link>
                    <Link href={`/admin/library/collections/${collection.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
                      <Pencil size={14} />
                    </Link>
                    <button onClick={() => setDeleteId(collection.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t("delete") || "Supprimer"}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t("confirm") || "Confirmer"}</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {t("cancel") || "Annuler"}
              </button>
              <button onClick={() => handleDelete(deleteId)} disabled={loading} className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50">
                {loading ? <Loader2 size={16} className="animate-spin mx-auto" /> : (t("delete") || "Supprimer")}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
