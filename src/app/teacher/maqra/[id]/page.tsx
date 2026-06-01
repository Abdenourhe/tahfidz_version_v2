// src/app/teacher/maqra/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  Video, ArrowLeft, StopCircle, Users, Clock,
  Loader2, AlertCircle
} from "lucide-react"
import { MaqraRoom } from "@/components/maqra/MaqraRoom"

export default function TeacherMaqraLivePage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [session, setSession] = useState<any>(null)
  const [joinUrl, setJoinUrl] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    if (!sessionId) return
    joinSession()
  }, [sessionId])

  const joinSession = async () => {
    try {
      const res = await fetch("/api/maqra/join", {
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
    if (!confirm("Voulez-vous vraiment terminer cette séance ?")) return
    setEnding(true)
    try {
      const res = await fetch("/api/maqra/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })
      if (!res.ok) throw new Error("Erreur")
      router.push("/teacher/maqra")
    } catch {
      alert("Erreur lors de la fin de séance")
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
          <Link href="/teacher/maqra" className="mt-4 inline-block text-tahfidz-green hover:underline">
            Retour aux séances
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
            href="/teacher/maqra"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              <Video size={16} className="text-red-500" />
              Halaqa Online en direct
            </h1>
            <p className="text-xs text-gray-500">
              {session?.mode === "AUDIO_ONLY" ? "Mode audio" : session?.mode === "VIDEO" ? "Mode vidéo" : "Partage d'écran"}
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
            Terminer
          </button>
        </div>
      </div>

      {/* Room */}
      <div className="flex-1 overflow-hidden">
        {joinUrl ? (
          <MaqraRoom joinUrl={joinUrl} mode={session?.mode || "AUDIO_ONLY"} isTeacher />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin text-tahfidz-green" />
          </div>
        )}
      </div>
    </div>
  )
}
