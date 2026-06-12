"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { BookOpen, Library, Search } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { ClassCard } from "./ClassCard"
import { ContentCard } from "./ContentCard"
import { useState } from "react"

interface Collection {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
  _count: { contents: number; enrollments: number }
  contents?: any[]
}

interface Content {
  id: string
  title: string
  type: string
  thumbnail?: string | null
  category: { id: string; name: string; color?: string | null }
  progress?: number
  isBookmarked?: boolean
}

interface Category {
  id: string
  name: string
  color?: string | null
}

interface Props {
  collections: Collection[]
  contents: Content[]
  categories: Category[]
  bookmarks: string[]
  basePath: string
}

export function LibraryPageClient({ collections, contents, categories, bookmarks, basePath }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filteredContents = contents.filter((c) => {
    const matchesSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory ? c.category.id === activeCategory : true
    return matchesSearch && matchesCategory
  })

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tahfidz-green/5 to-tahfidz-purple/5 dark:from-tahfidz-green/10 dark:to-tahfidz-purple/10 border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-tahfidz-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tahfidz-purple/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-medium text-tahfidz-green mb-4">
            <Library size={14} /> {t("title")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">{t("description") || "Explorez les ressources pédagogiques mises à votre disposition."}</p>
        </div>
      </section>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm" />
          </div>
          <select onChange={(e) => setActiveCategory(e.target.value || null)} className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm">
            <option value="">{t("allTypes")}</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {collections.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("collections")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection, i) => (
                <motion.div key={collection.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ClassCard
                    id={collection.id}
                    name={collection.name}
                    nameAr={collection.nameAr}
                    description={collection.description}
                    coverImage={collection.coverImage}
                    color={collection.color}
                    contentCount={collection._count.contents}
                    studentCount={collection._count.enrollments}
                    onClick={() => router.push(`${basePath}/collections/${collection.id}`)}
                  />
                </motion.div>
              ))}
            </div>
          </>
        )}

        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 pt-4">{t("contents")}</h2>
        {filteredContents.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="text-gray-400">{t("noContents")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredContents.map((content, i) => (
              <motion.div key={content.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <ContentCard
                  id={content.id}
                  title={content.title}
                  type={content.type}
                  thumbnail={content.thumbnail}
                  categoryName={content.category.name}
                  categoryColor={content.category.color}
                  progress={content.progress}
                  isBookmarked={bookmarks.includes(content.id)}
                  onClick={() => router.push(`${basePath}/contents/${content.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
