"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react"
import { useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { libraryCollectionSchema, type LibraryCollectionInput } from "@/lib/validations/library"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Group {
  id: string
  name: string
}

interface Collection {
  id: string
  name: string
  nameAr?: string | null
  nameEn?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
  groupId?: string | null
}

interface Props {
  groups: Group[]
  collection?: Collection
}

const COLORS = [
  "#1D9E75", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
  "#EF4444", "#14B8A6", "#6366F1", "#84CC16", "#F97316",
]

const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2 Mo

function getCoverImageSrc(coverImage?: string | null): string | null {
  if (!coverImage) return null
  if (coverImage.startsWith("r2://")) {
    return `/api/library/images/${encodeURIComponent(coverImage.slice(5))}`
  }
  return coverImage
}

export function CollectionForm({ groups, collection }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const isEdit = !!collection

  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LibraryCollectionInput>({
    resolver: zodResolver(libraryCollectionSchema),
    defaultValues: {
      name: collection?.name || "",
      nameAr: collection?.nameAr || "",
      nameEn: collection?.nameEn || "",
      description: collection?.description || "",
      coverImage: collection?.coverImage || "",
      color: collection?.color || COLORS[0],
      groupId: collection?.groupId || null,
      isActive: true,
    },
  })

  const selectedColor = watch("color")
  const coverImage = watch("coverImage")
  const coverImageSrc = getCoverImageSrc(coverImage)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)

    if (!file.type.startsWith("image/")) {
      setUploadError("Format non accepté. Veuillez choisir une image.")
      return
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError(t("maxSize"))
      return
    }

    setUploading(true)
    try {
      const metaRes = await fetch("/api/library/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          size: file.size,
          prefix: "collections",
        }),
      })
      const meta: any = metaRes.ok ? await metaRes.json() : { error: await metaRes.text() || t("error") }
      if (!metaRes.ok) {
        setUploadError(meta.error || t("error"))
        return
      }

      const uploadRes = await fetch(meta.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) {
        setUploadError("Échec de l'upload sur le stockage")
        return
      }

      setValue("coverImage", `r2://${meta.key}`)
    } catch (err: any) {
      setUploadError(err.message || t("error"))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: LibraryCollectionInput) => {
    const url = isEdit ? `/api/library/collections/${collection.id}` : "/api/library/collections"
    const method = isEdit ? "PATCH" : "POST"

    const payload = {
      ...data,
      groupId: data.groupId || null,
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      router.push("/admin/library/collections")
      router.refresh()
    } else {
      const err = await res.json()
      alert(err.error || "Erreur")
    }
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center gap-3">
        <Link href="/admin/library/collections" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? t("editCollection") : t("newCollection")}</h1>
        </div>
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
            <textarea {...register("description")} rows={4} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("group")}</label>
            <select {...register("groupId")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
              <option value="">{t("noGroup")}</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("color")}</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition",
                    selectedColor === color ? "border-gray-900 dark:border-white scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <input type="hidden" {...register("color")} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("coverImage")}</label>
            <input type="hidden" {...register("coverImage")} />
            <div className="space-y-3">
              <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer w-fit">
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {uploading ? t("loading") || "Chargement..." : t("uploadFile") || "Uploader une image"}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">Image jusqu&apos;à 2 Mo</p>
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
            </div>
            {coverImageSrc && (
              <div
                className="mt-3 h-32 rounded-lg border border-gray-200 dark:border-gray-700 bg-cover bg-center"
                style={{ backgroundImage: `url(${coverImageSrc})` }}
                aria-label={t("coverImage") || "Image de couverture"}
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Link href="/admin/library/collections" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel") || "Annuler"}
          </Link>
          <button type="submit" disabled={isSubmitting || uploading} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> {t("loading")}</> : <><Save size={15} /> {t("save") || "Enregistrer"}</>}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
