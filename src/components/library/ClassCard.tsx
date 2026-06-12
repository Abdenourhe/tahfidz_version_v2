"use client"

import { motion } from "framer-motion"
import { BookOpen, Users } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  id: string
  name: string
  nameAr?: string | null
  description?: string | null
  coverImage?: string | null
  color?: string | null
  contentCount: number
  studentCount: number
  progress?: number
  onClick?: () => void
}

export function ClassCard({ name, nameAr, description, coverImage, color, contentCount, studentCount, progress, onClick }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      className={cn("cursor-pointer bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden card-hover")}
    >
      <div
        className="h-32 bg-cover bg-center relative"
        style={{ backgroundColor: color || "#1D9E75", backgroundImage: coverImage ? `url(${coverImage})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h3 className="font-bold text-white truncate">{name}</h3>
          {nameAr && <p className="arabic text-xs text-white/80 truncate">{nameAr}</p>}
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">{description || "—"}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><BookOpen size={12} /> {contentCount}</span>
            <span className="flex items-center gap-1"><Users size={12} /> {studentCount}</span>
          </div>
          {progress !== undefined && progress > 0 && (
            <span className="text-tahfidz-green font-medium">{Math.round(progress)}%</span>
          )}
        </div>
        {progress !== undefined && progress > 0 && (
          <div className="mt-2 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
            <div className="h-full rounded-full bg-tahfidz-green transition-all" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    </motion.div>
  )
}
