// src/app/student/halaqa/[id]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { Loader2, AlertCircle, ArrowLeft, Video } from "lucide-react"
import { HalaqaRoom } from "@/components/halaqa/HalaqaRoom"

export default function StudentHalaqaJoinPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params?.id as string

  const [joinUrl, setJoinUrl] = useState<string>("")
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId) return
    joinSession()
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
          <Link href="/student/halaqa" className="mt-4 inline-block text-tahfidz-green hover:underline">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Link
            href="/student/halaqa"
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-white flex items-center gap-2">
              <Video size={16} className="text-tahfidz-green" />
              Halaqa Online
            </h1>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {joinUrl ? (
          <HalaqaRoom joinUrl={joinUrl} mode={session?.mode || "AUDIO_ONLY"} />
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin text-tahfidz-green" />
          </div>
        )}
      </div>
    </div>
  )
}
