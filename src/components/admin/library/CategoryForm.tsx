"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { libraryCategorySchema, type LibraryCategoryInput } from "@/lib/validations/library"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  nameAr?: string | null
  nameEn?: string | null
  description?: string | null
  color?: string | null
}

interface Props {
  category?: Category
}

const COLORS = [
  "#1D9E75", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
  "#EF4444", "#14B8A6", "#6366F1", "#84CC16", "#F97316",
]

export function CategoryForm({ category }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const isEdit = !!category

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LibraryCategoryInput>({
    resolver: zodResolver(libraryCategorySchema),
    defaultValues: {
      name: category?.name || "",
      nameAr: category?.nameAr || "",
      nameEn: category?.nameEn || "",
      description: category?.description || "",
      color: category?.color || COLORS[0],
      sortOrder: 0,
      isActive: true,
    },
  })

  const selectedColor = watch("color")

  const onSubmit = async (data: LibraryCategoryInput) => {
    const url = isEdit ? `/api/library/categories/${category.id}` : "/api/library/categories"
    const method = isEdit ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push("/admin/library/categories")
      router.refresh()
    } else {
      const err = await res.json()
      alert(err.error || "Erreur")
    }
  }

  return (
    <motion.div className="max-w-2xl mx-auto space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <Link href="/admin/library/categories" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><ArrowLeft size={18} className="text-gray-500" /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? t("editCategory") : t("newCategory")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("name")} *</label>
            <input {...register("name")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("nameAr")}</label>
              <input {...register("nameAr")} dir="rtl" className="arabic w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("nameEn")}</label>
              <input {...register("nameEn")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("description")}</label>
            <textarea {...register("description")} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("color")}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={cn("w-8 h-8 rounded-full border-2 transition", selectedColor === color ? "border-gray-900 dark:border-white scale-110" : "border-transparent")}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input type="hidden" {...register("color")} />
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/library/categories" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t("cancel") || "Annuler"}</Link>
          <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> {t("loading")}</> : <><Save size={15} /> {t("save") || "Enregistrer"}</>}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
