"use client"

import { motion } from "framer-motion"
import { Globe, BookOpen } from "lucide-react"
import { ContentCard } from "./ContentCard"

interface Content {
  id: string
  title: string
  type: string
  thumbnail?: string | null
  category: { id: string; name: string; color?: string | null }
  progress?: number
  isBookmarked?: boolean
}

interface Props {
  contents: Content[]
  basePath: string
  emptyMessage?: string
}

export function GlobalLibrarySection({ contents, basePath, emptyMessage = "Aucune ressource de la plateforme pour le moment." }: Props) {
  if (contents.length === 0) return null

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-tahfidz-purple" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ressources de la plateforme</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contents.map((content, i) => (
          <motion.div
            key={content.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <ContentCard
              id={content.id}
              title={content.title}
              type={content.type}
              thumbnail={content.thumbnail}
              categoryName={content.category.name}
              categoryColor={content.category.color}
              progress={content.progress}
              isBookmarked={content.isBookmarked}
              onClick={() => window.location.href = `${basePath}/contents/${content.id}`}
            />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
