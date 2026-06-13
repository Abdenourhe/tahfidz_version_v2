"use client"

import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, Library, Search, FileText, Video, Headphones, Bookmark, PlayCircle, LayoutGrid } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { ClassCard } from "./ClassCard"
import { ContentCard } from "./ContentCard"
import { GlobalLibrarySection } from "./GlobalLibrarySection"
import { useMemo, useState } from "react"

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

type TabValue = "all" | "pdf" | "videos" | "audio" | "bookmarks" | "inProgress"

interface Props {
  collections: Collection[]
  contents: Content[]
  globalContents: Content[]
  categories: Category[]
  bookmarks: string[]
  basePath: string
}

const ITEMS_PER_SECTION_INITIAL = 4

export function LibraryPageClient({ collections, contents, globalContents, categories, bookmarks, basePath }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const tabs: { value: TabValue; label: string; icon: React.ReactNode }[] = [
    { value: "all", label: t("all"), icon: <LayoutGrid size={16} /> },
    { value: "pdf", label: t("typePdf"), icon: <FileText size={16} /> },
    { value: "videos", label: t("videos"), icon: <Video size={16} /> },
    { value: "audio", label: t("audios"), icon: <Headphones size={16} /> },
    { value: "bookmarks", label: t("bookmarks"), icon: <Bookmark size={16} /> },
    { value: "inProgress", label: t("inProgress"), icon: <PlayCircle size={16} /> },
  ]

  const normalizedSearch = search.trim().toLowerCase()
  const isSearchActive = normalizedSearch.length > 0

  const filteredContents = useMemo(() => {
    return contents.filter((c) => {
      const matchesSearch = c.title.toLowerCase().includes(normalizedSearch)
      if (!matchesSearch) return false

      switch (activeTab) {
        case "pdf":
          return c.type === "PDF"
        case "videos":
          return c.type === "VIDEO_SINGLE" || c.type === "VIDEO_SERIES"
        case "audio":
          return c.type === "AUDIO"
        case "bookmarks":
          return bookmarks.includes(c.id)
        case "inProgress": {
          const p = c.progress ?? 0
          return p > 0 && p < 100
        }
        case "all":
        default:
          return true
      }
    })
  }, [contents, normalizedSearch, activeTab, bookmarks])

  const inProgressContents = useMemo(() => {
    return contents.filter((c) => {
      const p = c.progress ?? 0
      const matchesSearch = c.title.toLowerCase().includes(normalizedSearch)
      return p > 0 && p < 100 && matchesSearch
    })
  }, [contents, normalizedSearch])

  const groupedContents = useMemo(() => {
    const map = new Map<string, { category: Content["category"]; contents: Content[] }>()
    for (const c of filteredContents) {
      const existing = map.get(c.category.id)
      if (existing) {
        existing.contents.push(c)
      } else {
        map.set(c.category.id, { category: c.category, contents: [c] })
      }
    }

    // Ordonner les sections selon l'ordre des catégories passées en prop
    const ordered: { category: Content["category"]; contents: Content[] }[] = []
    const seen = new Set<string>()

    for (const cat of categories) {
      const group = map.get(cat.id)
      if (group) {
        ordered.push(group)
        seen.add(cat.id)
      }
    }

    // Ajouter les catégories éventuellement absentes de la liste (données orphelines)
    for (const [catId, group] of map) {
      if (!seen.has(catId)) {
        ordered.push(group)
      }
    }

    return ordered
  }, [filteredContents, categories])

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const renderContentCard = (content: Content, index: number) => (
    <motion.div
      key={content.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
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
  )

  const renderEmptyState = (message: string) => (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center"
    >
      <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
      <p className="text-gray-500 dark:text-gray-400">{message}</p>
    </motion.div>
  )

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Hero */}
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

      {/* Filtres rapides */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = activeTab === tab.value
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                  active
                    ? "bg-tahfidz-green text-white border-tahfidz-green"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:border-tahfidz-green/50 hover:text-tahfidz-green"
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Ressources globales */}
      <GlobalLibrarySection contents={globalContents} basePath={basePath} />

      {/* Continuer la lecture */}
      <AnimatePresence>
        {inProgressContents.length > 0 && activeTab !== "inProgress" && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            <div className="flex items-center gap-2">
              <PlayCircle size={18} className="text-tahfidz-green" />
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("continueReading")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inProgressContents.slice(0, 4).map((content, i) => renderContentCard(content, i))}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Collections */}
      {collections.length > 0 && (
        <section className="space-y-4">
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
                  onClick={() => router.push(`${basePath}/collections/${collection.id}/contents`)}
                />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Contenus de l'école : résultats de recherche ou groupés par catégorie */}
      <div className="space-y-8">
        {filteredContents.length === 0 ? (
          renderEmptyState(t("noResultsForFilter"))
        ) : isSearchActive ? (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {t("searchResults")}{" "}
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                ({filteredContents.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContents.map((content, i) => renderContentCard(content, i))}
            </div>
          </section>
        ) : (
          groupedContents.map(({ category, contents: catContents }) => {
            const isExpanded = expandedCategories.has(category.id)
            const visibleContents = isExpanded ? catContents : catContents.slice(0, ITEMS_PER_SECTION_INITIAL)
            const canExpand = catContents.length > ITEMS_PER_SECTION_INITIAL

            return (
              <motion.section
                key={category.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-6 rounded-full"
                      style={{ backgroundColor: category.color || "#1D9E75" }}
                    />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{category.name}</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({catContents.length})</span>
                  </div>
                  {canExpand && (
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="text-sm font-medium text-tahfidz-green hover:text-tahfidz-green/80 transition-colors"
                    >
                      {isExpanded ? t("seeLess") : t("viewAll")}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <AnimatePresence mode="popLayout">
                    {visibleContents.map((content, i) => renderContentCard(content, i))}
                  </AnimatePresence>
                </div>
              </motion.section>
            )
          })
        )}
      </div>
    </motion.div>
  )
}
