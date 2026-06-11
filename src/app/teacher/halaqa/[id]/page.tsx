// src/app/teacher/halaqa/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Video, ArrowLeft, Clock, StopCircle,
  Loader2, AlertCircle
} from "lucide-react"
import { HalaqaRoom } from "@/components/halaqa/HalaqaRoom"
import { useLanguage, useT } from "@/contexts/LanguageContext"

export default function TeacherHalaqaLivePage() {
  const params = useParams()
  const { locale } = useLanguage()
  const t = useT("halaqa")
  const router = useRouter()
  const _isRTL = locale === "ar"
  const sessionId = params?.id as string

  const [session, setSession] = useState<any>(null)
  const [joinUrl, setJoinUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    joinSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const joinSession = async () => {
    try {
      const res = await fetch("/api/halaqa/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setJoinUrl(data.joinUrl)
      setSession(data)
    } catch (err: any) {
      setError(err.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  const endSession = async () => {
    if (!confirm(t("confirmEnd"))) return
    setEnding(true)
    try {
      const res = await fetch("/api/halaqa/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error("Erreur")
      router.push("/teacher/halaqa")
    } catch {
      alert(t("errorEnd"))
    } finally {
      setEnding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 size={32} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
          <Link href="/teacher/halaqa" className="mt-4 inline-block text-tahfidz-green hover:underline">
            {t("backToSessions")}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/teacher/halaqa"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              <Video size={16} className="text-red-500" />
              {t("liveTitle")}
            </h1>
            <p className="text-xs text-gray-500">
              {session?.mode === "AUDIO_ONLY" ? t("modeAudio") : session?.mode === "VIDEO" ? t("modeVideo") : t("modeScreen")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={14} />
            {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button
            onClick={endSession}
            disabled={ending}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {ending ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
            {t("endSession")}
          </button>
        </div>
      </div>

      {/* Room */}
      <div className="flex-1 overflow-hidden">
        {joinUrl ? (
          <HalaqaRoom joinUrl={joinUrl} mode={session?.mode || "AUDIO_ONLY"} isTeacher />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin text-tahfidz-green" />
          </div>
        )}
      </div>
    </div>
  )
}
