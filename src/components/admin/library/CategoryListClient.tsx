"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { motion } from "framer-motion"
import { Plus, Layers, Pencil, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface Category {
  id: string
  name: string
  color?: string | null
  icon?: string | null
  schoolId?: string | null
  _count?: { contents: number }
}

interface Props {
  categories: Category[]
  currentSchoolId: string
}

export function CategoryListClient({ categories, currentSchoolId }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/library/categories/${id}`, { method: "DELETE" })
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("categories")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{categories.length} {t("categories").toLowerCase()}</p>
        </div>
        <Link href="/admin/library/categories/new" className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("newCategory")}
        </Link>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <Layers size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noCategories")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, i) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: category.color || "#1D9E75" }}>
                    <Layers size={18} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{category.name}</h3>
                </div>
                {category.schoolId === currentSchoolId && (
                  <div className="flex items-center gap-1">
                    <Link href={`/admin/library/categories/${category.id}/edit`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Pencil size={14} /></Link>
                    <button onClick={() => setDeleteId(category.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
                  </div>
                )}
                {category.schoolId === null && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-tahfidz-purple/10 text-tahfidz-purple font-medium">
                    Global
                  </span>
                )}
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
