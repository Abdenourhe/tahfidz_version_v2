"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { BookOpen, FolderOpen, Layers, Plus, Library, Film, Bookmark, PlayCircle } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface Props {
  collectionsCount: number
  contentsCount: number
  categoriesCount: number
  episodesCount: number
  bookmarksCount: number
  inProgressCount: number
}

export function LibraryDashboardClient({
  collectionsCount,
  contentsCount,
  categoriesCount,
  episodesCount,
  bookmarksCount,
  inProgressCount,
}: Props) {
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)

  const cards = [
    { label: t("collections"), value: collectionsCount, icon: FolderOpen, color: "bg-blue-100 text-blue-600", href: "/admin/library/collections" },
    { label: t("contents"), value: contentsCount, icon: BookOpen, color: "bg-emerald-100 text-emerald-600", href: "/admin/library/contents" },
    { label: t("categories"), value: categoriesCount, icon: Layers, color: "bg-purple-100 text-purple-600", href: "/admin/library/categories" },
    { label: t("episodes"), value: episodesCount, icon: Film, color: "bg-amber-100 text-amber-600", href: "/admin/library/contents" },
    { label: t("bookmarks"), value: bookmarksCount, icon: Bookmark, color: "bg-rose-100 text-rose-600", href: "/admin/library/contents" },
    { label: t("inProgress"), value: inProgressCount, icon: PlayCircle, color: "bg-cyan-100 text-cyan-600", href: "/admin/library/contents" },
  ]

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-tahfidz-green/5 to-tahfidz-purple/5 dark:from-tahfidz-green/10 dark:to-tahfidz-purple/10 border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-tahfidz-green/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-tahfidz-purple/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-medium text-tahfidz-green mb-4">
            <Library size={14} />
            {t("title")}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">{t("dashboard")}</h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">{t("description") || "Gérez les ressources pédagogiques de votre école."}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/admin/library/contents/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-tahfidz-green/25"
            >
              <Plus size={16} /> {t("newContent")}
            </Link>
            <Link
              href="/admin/library/collections/new"
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <FolderOpen size={16} /> {t("newCollection")}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
          >
            <Link
              href={card.href}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 card-hover h-full"
            >
              <div className={`inline-flex p-3 rounded-xl ${card.color} mb-4`}>
                <card.icon size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
