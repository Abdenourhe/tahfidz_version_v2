"use client"

import { motion } from "framer-motion"
import { PlayCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Episode {
  id: string
  title: string
  thumbnail?: string | null
  duration?: number | null
  isCompleted?: boolean
}

interface Props {
  episodes: Episode[]
  currentEpisodeId?: string
  onEpisodeSelect: (episodeId: string) => void
}

export function SeriesPlaylist({ episodes, currentEpisodeId, onEpisodeSelect }: Props) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Playlist</h3>
      {episodes.map((episode, i) => (
        <motion.button
          key={episode.id}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onEpisodeSelect(episode.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition",
            currentEpisodeId === episode.id
              ? "bg-tahfidz-green-light dark:bg-tahfidz-green/20 border border-tahfidz-green/30"
              : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent"
          )}
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 flex-shrink-0">
            {episode.isCompleted ? <CheckCircle2 size={18} className="text-tahfidz-green" /> : <PlayCircle size={18} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-medium truncate", currentEpisodeId === episode.id ? "text-tahfidz-green" : "text-gray-900 dark:text-gray-100")}>{episode.title}</p>
            {episode.duration && <p className="text-xs text-gray-500">{Math.floor(episode.duration / 60)} min</p>}
          </div>
        </motion.button>
      ))}
    </div>
  )
}
