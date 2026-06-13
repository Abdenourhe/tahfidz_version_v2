"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { Globe, Plus, Pencil, Trash2, AlertTriangle, Loader2, X, FolderOpen, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LibraryCategory } from "@prisma/client"

interface Props {
  initialCategories: LibraryCategory[]
}

export function SuperAdminCategoryListClient({ initialCategories }: Props) {
  const router = useRouter()
  const [categories, setCategories] = useState<LibraryCategory[]>(initialCategories)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LibraryCategory | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    nameAr: "",
    nameEn: "",
    description: "",
    icon: "",
    color: "#8B5CF6",
    sortOrder: 0,
  })

  const resetForm = () => {
    setFormData({
      name: "",
      nameAr: "",
      nameEn: "",
      description: "",
      icon: "",
      color: "#8B5CF6",
      sortOrder: 0,
    })
    setEditingCategory(null)
  }

  const openCreate = () => {
    resetForm()
    setIsModalOpen(true)
  }

  const openEdit = (category: LibraryCategory) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      nameAr: category.nameAr || "",
      nameEn: category.nameEn || "",
      description: category.description || "",
      icon: category.icon || "",
      color: category.color || "#8B5CF6",
      sortOrder: category.sortOrder,
    })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingCategory) {
        const res = await fetch(`/api/library/categories/${editingCategory.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, isGlobal: true }),
        })
        if (!res.ok) throw new Error("Erreur lors de la modification")
        setMessage({ type: "success", text: "Catégorie modifiée avec succès" })
      } else {
        const res = await fetch("/api/library/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, isGlobal: true }),
        })
        if (!res.ok) throw new Error("Erreur lors de la création")
        setMessage({ type: "success", text: "Catégorie globale créée avec succès" })
      }
      router.refresh()
      closeModal()
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue" })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/library/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erreur lors de la suppression")
      setCategories(categories.filter((c) => c.id !== id))
      setMessage({ type: "success", text: "Catégorie supprimée" })
    } catch {
      setMessage({ type: "error", text: "Impossible de supprimer cette catégorie" })
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium",
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300"
              : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300"
          )}
        >
          {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catégories globales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gérez les catégories disponibles pour toutes les écoles de la plateforme.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-tahfidz-purple hover:bg-tahfidz-purple/90 text-white text-sm font-medium rounded-lg transition"
        >
          <Plus size={16} />
          Nouvelle catégorie
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-tahfidz-purple/10 flex items-center justify-center mx-auto mb-4">
            <FolderOpen size={32} className="text-tahfidz-purple" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Aucune catégorie globale</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6">
            Créez une première catégorie pour organiser les ressources disponibles sur l&apos;ensemble de la plateforme.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-tahfidz-purple hover:bg-tahfidz-purple/90 text-white text-sm font-medium rounded-lg transition"
          >
            <Plus size={16} />
            Créer une catégorie
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 card-hover"
              style={{ borderLeftWidth: 4, borderLeftColor: category.color || "#8B5CF6" }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ backgroundColor: category.color || "#8B5CF6" }}
                  >
                    {category.icon ? <span>{category.icon}</span> : <Globe size={20} />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{category.name}</h3>
                    {category.nameAr && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 arabic truncate">{category.nameAr}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(category)}
                    className="p-1.5 text-gray-400 hover:text-tahfidz-purple hover:bg-tahfidz-purple/10 rounded-lg transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteId(category.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {category.description && (
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{category.description}</p>
              )}

              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  Ordre: {category.sortOrder}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tahfidz-purple/10 text-tahfidz-purple">
                  <Globe size={10} className="mr-1" />
                  Globale
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie globale"}
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nom (français) *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Pédagogie"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="nameAr" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom (arabe)
                    </label>
                    <input
                      id="nameAr"
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                      placeholder="الاسم بالعربية"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition arabic"
                      dir="rtl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom (anglais)
                    </label>
                    <input
                      id="nameEn"
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Ex: Pedagogy"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    id="description"
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Courte description de la catégorie"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Icône (emoji)
                    </label>
                    <input
                      id="icon"
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="Ex: 📚"
                      maxLength={2}
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Couleur
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-10 p-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        placeholder="#8B5CF6"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ordre d&apos;affichage
                  </label>
                  <input
                    id="sortOrder"
                    type="number"
                    min={0}
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-tahfidz-purple/20 focus:border-tahfidz-purple outline-none transition"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="px-4 py-2.5 rounded-lg border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-tahfidz-purple hover:bg-tahfidz-purple/90 transition disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : editingCategory ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full"
            >
              <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle size={28} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirmer la suppression</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Cette action est irréversible. Les contenus associés à cette catégorie ne seront plus classés.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(deleteId)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Supprimer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
