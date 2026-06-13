"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, BookOpen, Headphones, FileText, Video, Loader2 } from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { PdfViewer } from "./PdfViewer"
import { VideoPlayer } from "./VideoPlayer"
import { SeriesPlaylist } from "./SeriesPlaylist"
import { BookmarkButton } from "./BookmarkButton"
import { ProgressBar } from "./ProgressBar"

interface Episode {
  id: string
  title: string
  videoUrl?: string | null
  duration?: number | null
  thumbnail?: string | null
}

interface Content {
  id: string
  title: string
  description?: string | null
  type: string
  pdfUrl?: string | null
  pdfPages?: number | null
  videoUrl?: string | null
  duration?: number | null
  category: { name: string; color?: string | null }
  episodes: Episode[]
}

interface Props {
  contentId: string
  basePath: string
}

export function ContentViewerClient({ contentId, basePath }: Props) {
  const router = useRouter()
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)
  const [content, setContent] = useState<Content | null>(null)
  const [progress, setProgress] = useState<{ progress: number; lastPosition?: number | null; isCompleted?: boolean } | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentEpisodeId, setCurrentEpisodeId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/library/contents/${contentId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("load-error")
        const data = await res.json()
        setContent(data.content)
        setProgress(data.progress)
        setIsBookmarked(data.isBookmarked || false)
        if (data.content.episodes?.length) {
          setCurrentEpisodeId(data.content.episodes[0].id)
        }
      })
      .catch(() => setError("load-error"))
      .finally(() => setLoading(false))
  }, [contentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  if (error || !content) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
        <BookOpen size={32} className="mx-auto mb-3 text-gray-300" />
        <p className="text-gray-400">{error === "load-error" ? t("noContents") : error || t("noContents")}</p>
        <button onClick={() => router.push(basePath)} className="mt-4 text-tahfidz-green text-sm hover:underline">{t("back") || "Retour"}</button>
      </div>
    )
  }

  const currentEpisode = content.episodes.find((e) => e.id === currentEpisodeId) || content.episodes[0]

  const renderMedia = () => {
    switch (content.type) {
      case "PDF":
        return <PdfViewer url={`/api/library/contents/${content.id}/pdf`} contentId={content.id} initialPage={progress?.lastPosition || 1} totalPages={content.pdfPages || 1} />
      case "AUDIO":
        return (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center space-y-4">
            <Headphones size={48} className="mx-auto text-tahfidz-green" />
            <audio src={content.videoUrl || ""} controls className="w-full" />
          </div>
        )
      case "VIDEO_SERIES":
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {currentEpisode?.videoUrl ? (
                <VideoPlayer
                  url={currentEpisode.videoUrl}
                  contentId={content.id}
                  initialTime={progress?.lastPosition || 0}
                />
              ) : (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl aspect-video flex items-center justify-center text-gray-500">{t("noContents")}</div>
              )}
              {currentEpisode && <p className="font-medium text-gray-900 dark:text-gray-100">{currentEpisode.title}</p>}
            </div>
            <div>
              <SeriesPlaylist
                episodes={content.episodes.map((e) => ({ ...e, isCompleted: false }))}
                currentEpisodeId={currentEpisodeId || undefined}
                onEpisodeSelect={setCurrentEpisodeId}
              />
            </div>
          </div>
        )
      case "VIDEO_SINGLE":
      default:
        return <VideoPlayer url={content.videoUrl || ""} contentId={content.id} initialTime={progress?.lastPosition || 0} />
    }
  }

  const typeIcon: Record<string, React.ReactNode> = {
    PDF: <FileText size={18} />,
    VIDEO_SINGLE: <Video size={18} />,
    VIDEO_SERIES: <Video size={18} />,
    AUDIO: <Headphones size={18} />,
  }

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={() => router.push(basePath)} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-tahfidz-green transition">
        <ArrowLeft size={16} /> {t("back") || "Retour"}
      </button>

      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-gray-400">{typeIcon[content.type]}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: content.category.color ? `${content.category.color}20` : "#E8F8F2", color: content.category.color || "#1D9E75" }}>{content.category.name}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{content.title}</h1>
          {content.description && <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-2xl">{content.description}</p>}
        </div>
        <BookmarkButton contentId={content.id} initialBookmarked={isBookmarked} />
      </div>

      {progress && progress.progress > 0 && <ProgressBar progress={progress.progress} />}

      {renderMedia()}
    </motion.div>
  )
}
