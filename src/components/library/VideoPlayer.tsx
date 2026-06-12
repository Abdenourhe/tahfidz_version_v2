"use client"

import { useRef, useEffect, useState } from "react"
import { motion } from "framer-motion"

interface Props {
  url: string
  contentId: string
  initialTime?: number
  onProgressUpdate?: (time: number, duration: number) => void
  onComplete?: () => void
}

export function VideoPlayer({ url, contentId, initialTime = 0, onProgressUpdate, onComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = initialTime
  }, [initialTime])

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const progress = duration > 0 ? (video.currentTime / duration) * 100 : 0
    onProgressUpdate?.(video.currentTime, duration)
    if (progress >= 95) onComplete?.()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const save = setInterval(() => {
      fetch("/api/library/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, progress: Math.min(100, Math.round((video.currentTime / (duration || 1)) * 100)), lastPosition: Math.round(video.currentTime) }),
      })
    }, 5000)
    return () => clearInterval(save)
  }, [contentId, duration])

  return (
    <motion.div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <video
        ref={videoRef}
        src={url}
        controls
        className="w-full aspect-video"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
      />
    </motion.div>
  )
}
