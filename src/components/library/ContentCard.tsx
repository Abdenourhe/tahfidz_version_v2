"use client"

import { motion } from "framer-motion"
import { FileText, Video, Headphones, PlayCircle, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  id: string
  title: string
  type: string
  thumbnail?: string | null
  categoryName: string
  categoryColor?: string | null
  progress?: number
  isBookmarked?: boolean
  onClick?: () => void
}

export function ContentCard({ title, type, thumbnail, categoryName, categoryColor, progress, isBookmarked, onClick }: Props) {
  const iconMap: Record<string, React.ReactNode> = {
    PDF: <FileText size={18} />,
    VIDEO_SINGLE: <PlayCircle size={18} />,
    VIDEO_SERIES: <Video size={18} />,
    AUDIO: <Headphones size={18} />,
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={cn("cursor-pointer bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 card-hover flex gap-4")}
    >
      <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0 overflow-hidden">
        {thumbnail ? <img src={thumbnail} alt="" className="w-full h-full object-cover" /> : iconMap[type] || <FileText size={18} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{title}</h3>
          {isBookmarked && <Bookmark size={14} className="text-tahfidz-gold flex-shrink-0" />}
        </div>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: categoryColor ? `${categoryColor}20` : "#E8F8F2", color: categoryColor || "#1D9E75" }}>{categoryName}</span>
        {progress !== undefined && progress > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-tahfidz-green transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
