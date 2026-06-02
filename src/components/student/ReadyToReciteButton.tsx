"use client"
// src/components/student/ReadyToReciteButton.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Props {
  progressId: string
  studentId: string
  surahId: number
}

export function ReadyToReciteButton({ progressId }: Props) {
  const router = useRouter()
  const t = useT("studentMemorizationTracker")
  const [loading, setLoading] = useState(false)
  const [done, setDone]       = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      await fetch(`/api/progress/${progressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY_FOR_RECITATION" }),
      })
      setDone(true)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
        ✓ {t("teacherNotified")}
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-xs px-3 py-1.5 bg-tahfidz-green text-white rounded-full hover:bg-tahfidz-green/90 transition disabled:opacity-60 flex items-center gap-1 font-medium"
    >
      {loading && <Loader2 size={11} className="animate-spin" />}
      {t("readyToRecite")} ✓
    </button>
  )
}
