"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { ArrowLeft, Loader2, Plus, Save, Trash2, Upload } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useLanguage } from "@/contexts/LanguageContext"
import { libraryContentSchema, libraryEpisodeSchema } from "@/lib/validations/library"
import { z } from "zod"

interface Category {
  id: string
  name: string
  color?: string | null
}

interface Collection {
  id: string
  name: string
}

interface Episode {
  id: string
  title: string
  videoUrl: string
  duration?: number
  episodeOrder: number
}

interface Content {
  id: string
  visibility: string
  collectionId?: string | null
  type: string
  status: string
  title: string
  titleAr?: string | null
  titleEn?: string | null
  description?: string | null
  descriptionAr?: string | null
  descriptionEn?: string | null
  thumbnail?: string | null
  coverImage?: string | null
  pdfUrl?: string | null
  pdfPages?: number | null
  videoUrl?: string | null
  videoSource?: string | null
  duration?: number
  categoryId: string
  author?: string | null
  language?: string | null
  level?: string | null
  tags: string[]
  episodes: Episode[]
}

interface Props {
  categories: Category[]
  collections: Collection[]
  content?: Content
  isSuperAdmin?: boolean
  defaultVisibility?: "GLOBAL" | "SCHOOL" | "CLASS"
}

const contentFormSchema = libraryContentSchema.extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  tags: z.array(z.string()).default([]),
  episodes: z.array(libraryEpisodeSchema).default([]),
})

type FormData = z.infer<typeof contentFormSchema>

export function ContentForm({ categories, collections, content, isSuperAdmin = false, defaultVisibility }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultCollectionId = searchParams.get("collectionId") || content?.collectionId || ""
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const isEdit = !!content
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(content?.pdfUrl ? "Fichier stocké" : null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(contentFormSchema) as any,
    defaultValues: {
      visibility: (content?.visibility as any) || defaultVisibility || "SCHOOL",
      collectionId: defaultCollectionId || null,
      type: (content?.type as any) || "PDF",
      status: (content?.status as any) || "DRAFT",
      title: content?.title || "",
      titleAr: content?.titleAr || "",
      titleEn: content?.titleEn || "",
      description: content?.description || "",
      descriptionAr: content?.descriptionAr || "",
      descriptionEn: content?.descriptionEn || "",
      thumbnail: content?.thumbnail || "",
      coverImage: content?.coverImage || "",
      pdfUrl: content?.pdfUrl || "",
      pdfPages: content?.pdfPages || undefined,
      videoUrl: content?.videoUrl || "",
      videoSource: (content?.videoSource as any) || "local",
      duration: content?.duration || undefined,
      categoryId: content?.categoryId || categories[0]?.id || "",
      author: content?.author || "",
      language: content?.language || "",
      level: content?.level || "",
      tags: content?.tags || [],
      episodes: content?.episodes.map((e: any) => ({ ...e, duration: e.duration ?? undefined })) || [],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: "episodes" })
  const type = watch("type")
  const visibility = watch("visibility")
  const tags = watch("tags")

  // Forcer la visibilité quand elle est imposée par le contexte (ex: superadmin global)
  useEffect(() => {
    if (defaultVisibility) {
      setValue("visibility", defaultVisibility)
    }
  }, [defaultVisibility, setValue])

  const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 * 1024 // 5 Go

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "pdfUrl") => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadError(null)
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadError(t("maxSize"))
      return
    }
    setUploading(true)
    try {
      // 1. Demander une URL d'upload signée
      const metaRes = await fetch("/api/library/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, size: file.size }),
      })
      const meta: any = metaRes.ok ? await metaRes.json() : { error: await metaRes.text() || t("error") }
      if (!metaRes.ok) {
        setUploadError(meta.error || t("error"))
        return
      }

      // 2. Uploader directement sur R2
      const uploadRes = await fetch(meta.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      })
      if (!uploadRes.ok) {
        setUploadError("Échec de l'upload sur le stockage")
        return
      }

      // 3. Stocker la clé R2 dans le formulaire
      setValue(field, `r2://${meta.key}`)
      setUploadedFileName(file.name)
    } catch (err: any) {
      setUploadError(err.message || t("error"))
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: FormData) => {
    setSubmitError(null)
    const url = isEdit ? `/api/library/contents/${content!.id}` : "/api/library/contents"
    const method = isEdit ? "PATCH" : "POST"

    const payload = {
      ...data,
      collectionId: data.collectionId || null,
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        router.push("/admin/library/contents")
        router.refresh()
      } else {
        const contentType = res.headers.get("content-type")
        let err: any = {}
        if (contentType?.includes("application/json")) {
          err = await res.json()
        } else {
          err = { error: await res.text() || t("error") }
        }
        if (err.error && typeof err.error === "object" && err.error.fieldErrors) {
          const messages = Object.values(err.error.fieldErrors).flat().filter(Boolean)
          setSubmitError(messages.join("\n") || t("error"))
        } else {
          setSubmitError(err.error || t("error"))
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || t("error"))
    }
  }

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      const val = e.currentTarget.value.trim()
      if (val && !tags.includes(val)) {
        setValue("tags", [...tags, val])
        e.currentTarget.value = ""
      }
    }
  }

  const removeTag = (tag: string) => setValue("tags", tags.filter((t) => t !== tag))

  return (
    <motion.div className="max-w-3xl mx-auto space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center gap-3">
        <Link href="/admin/library/contents" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"><ArrowLeft size={18} className="text-gray-500" /></Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? t("editContent") : t("newContent")}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("title")} *</label>
            <input {...register("title")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("nameAr")}</label>
              <input {...register("titleAr")} dir="rtl" className="arabic w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("nameEn")}</label>
              <input {...register("titleEn")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("description")}</label>
            <textarea {...register("description")} rows={3} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("type")}</label>
              <select {...register("type")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
                <option value="PDF">{t("typePdf")}</option>
                <option value="VIDEO_SINGLE">{t("typeVideoSingle")}</option>
                <option value="VIDEO_SERIES">{t("typeVideoSeries")}</option>
                <option value="AUDIO">{t("typeAudio")}</option>
              </select>
            </div>
            {!defaultVisibility && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("visibility")}</label>
                <select {...register("visibility")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
                  {isSuperAdmin && <option value="GLOBAL">{t("visibilityGlobal")}</option>}
                  <option value="SCHOOL">{t("visibilitySchool")}</option>
                  <option value="CLASS">{t("visibilityClass")}</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("status")}</label>
              <select {...register("status")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
                <option value="DRAFT">{t("statusDraft")}</option>
                <option value="PUBLISHED">{t("statusPublished")}</option>
                <option value="ARCHIVED">{t("statusArchived")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("category")}</label>
              <select {...register("categoryId")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("collection")}</label>
              <select {...register("collectionId")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
                <option value="">{t("noGroup")}</option>
                {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {visibility === "CLASS" && !watch("collectionId") && <p className="mt-1 text-xs text-amber-600">{t("visibilityClass")}</p>}
            </div>
          </div>

          {type === "PDF" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("pdfUrl")}</label>
              <input {...register("pdfUrl")} type="hidden" />
              <div className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm min-h-[2.5rem] flex items-center">
                {uploadedFileName ? (
                  <span className="text-gray-700 dark:text-gray-200">{uploadedFileName}</span>
                ) : (
                  <span className="text-gray-400">{t("pdfUrl") || "Aucun fichier"}</span>
                )}
              </div>
              <div>
                <label className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition cursor-pointer w-fit">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {uploading ? t("loading") : t("uploadFile")}
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, "pdfUrl")} />
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">PDF jusqu&apos;à 5 Go</p>
                {uploadError && <p className="text-xs text-red-500 mt-1.5">{uploadError}</p>}
              </div>
              <input {...register("pdfPages")} type="number" placeholder="Nombre de pages" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
          )}

          {(type === "VIDEO_SINGLE" || type === "AUDIO") && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{type === "AUDIO" ? t("typeAudio") : t("videoUrl")}</label>
              <input {...register("videoUrl")} placeholder="URL" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
              <input {...register("duration")} type="number" placeholder={t("duration")} className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            </div>
          )}

          {type === "VIDEO_SERIES" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("episodes")}</label>
                <button type="button" onClick={() => append({ title: "", videoUrl: "", duration: undefined, episodeOrder: fields.length, thumbnail: "" })} className="flex items-center gap-1 text-xs text-tahfidz-green hover:underline">
                  <Plus size={12} /> {t("addEpisode")}
                </button>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center gap-2">
                    <input {...register(`episodes.${index}.title`)} placeholder={t("episodeTitle")} className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    <input {...register(`episodes.${index}.episodeOrder`)} type="number" placeholder={t("episodeOrder")} className="w-20 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm" />
                    <button type="button" onClick={() => remove(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                  </div>
                  <input {...register(`episodes.${index}.videoUrl`)} placeholder={t("videoUrl")} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm" />
                </div>
              ))}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("tags")}</label>
            <input onKeyDown={addTag} placeholder="Appuyez sur Entrée pour ajouter" className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-tahfidz-green-light text-tahfidz-green text-xs">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {submitError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
            {submitError}
          </div>
        )}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/library/contents" className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">{t("cancel") || "Annuler"}</Link>
          <button type="submit" disabled={isSubmitting || uploading} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2">
            {isSubmitting ? <><Loader2 size={15} className="animate-spin" /> {t("loading")}</> : <><Save size={15} /> {t("save") || "Enregistrer"}</>}
          </button>
        </div>
      </form>
    </motion.div>
  )
}
