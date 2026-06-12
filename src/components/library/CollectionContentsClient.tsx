"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { ContentCard } from "./ContentCard"

interface Content {
  id: string
  title: string
  type: string
  thumbnail?: string | null
  category: { name: string; color?: string | null }
  progress?: number
}

interface Collection {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
}

interface Props {
  collection: Collection
  contents: Content[]
  basePath: string
}

export function CollectionContentsClient({ collection, contents, basePath }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={() => router.push(basePath)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition">
        <ArrowLeft size={16} /> {t("back") || "Retour"}
      </button>

      <div
        className="h-48 rounded-2xl bg-cover bg-center relative"
        style={{ backgroundColor: collection.color || "#1D9E75", backgroundImage: collection.coverImage ? `url(${collection.coverImage})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-2xl" />
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-2xl font-bold text-white">{collection.name}</h1>
          {collection.nameAr && <p className="arabic text-sm text-white/80">{collection.nameAr}</p>}
          <p className="text-white/80 text-sm mt-2">{collection.description || "—"}</p>
        </div>
      </div>

      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("contents")}</h2>
      {contents.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-gray-400">{t("noContents")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contents.map((content, i) => (
            <motion.div key={content.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <ContentCard
                id={content.id}
                title={content.title}
                type={content.type}
                thumbnail={content.thumbnail}
                categoryName={content.category.name}
                categoryColor={content.category.color}
                progress={content.progress}
                onClick={() => router.push(`${basePath}/contents/${content.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
