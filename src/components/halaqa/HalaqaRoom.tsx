// src/components/halaqa/HalaqaRoom.tsx
"use client"

import { useEffect, useRef, useState } from "react"
import { MaqraMode } from "@prisma/client"
import { Loader2, Maximize2, Minimize2 } from "lucide-react"

interface HalaqaRoomProps {
  joinUrl: string
  mode: MaqraMode
  isTeacher?: boolean
}

export function HalaqaRoom({ joinUrl, mode, isTeacher }: HalaqaRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => setLoading(false)
    iframe.addEventListener("load", handleLoad)
    return () => iframe.removeEventListener("load", handleLoad)
  }, [joinUrl])

  const toggleFullscreen = () => {
    const container = iframeRef.current?.parentElement
    if (!container) return
    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {})
      setFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setFullscreen(false)
    }
  }

  return (
    <div className={`relative w-full h-full bg-black ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
          <Loader2 size={40} className="animate-spin text-tahfidz-green mb-3" />
          <p className="text-sm text-gray-400">Connexion à la salle Halaqa Online...</p>
          <p className="text-xs text-gray-600 mt-1">
            {mode === "AUDIO_ONLY" ? "Mode audio uniquement" : "Mode audio + vidéo"}
          </p>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={joinUrl}
        allow="camera; microphone; display-capture; fullscreen; autoplay"
        className="w-full h-full border-0"
        style={{ minHeight: "100%" }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
      />

      {/* Controls overlay */}
      <div className="absolute bottom-4 right-4 z-20 flex gap-2">
        <button
          onClick={toggleFullscreen}
          className="p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition"
          title={fullscreen ? "Quitter plein écran" : "Plein écran"}
        >
          {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
        </button>
      </div>

      {isTeacher && (
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1.5 rounded-full bg-red-600/90 text-white text-xs font-bold backdrop-blur-sm animate-pulse">
            ● EN DIRECT
          </span>
        </div>
      )}
    </div>
  )
}
