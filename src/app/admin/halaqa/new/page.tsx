// src/app/admin/halaqa/new/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import HalaqaForm from "@/components/halaqa/HalaqaForm"

interface HalaqaSession {
  id: string
  meetingName: string
  type: "INDIVIDUAL" | "COLLECTIVE"
  mode: "AUDIO_ONLY" | "VIDEO" | "SCREEN_SHARE"
  scheduledAt: string
  duration: number
  sourah?: string | null
  verses?: string | null
  studentIds: string[]
  groupId?: string | null
  teacherId?: string
}

export default function AdminNewHalaqaPage() {
  const searchParams = useSearchParams()
  const teacherId = searchParams.get("teacherId") || ""
  const duplicateId = searchParams.get("duplicate") || ""
  const [duplicateFrom, setDuplicateFrom] = useState<HalaqaSession | null>(null)

  useEffect(() => {
    if (!duplicateId) return
    fetch(`/api/halaqa/${duplicateId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.session) setDuplicateFrom(data.session)
      })
      .catch(console.error)
  }, [duplicateId])

  return (
    <HalaqaForm
      mode="create"
      backHref="/admin/halaqa"
      isAdmin={true}
      initialTeacherId={teacherId}
      duplicateFrom={duplicateFrom}
      title={duplicateFrom ? "Dupliquer la séance" : "Planifier une Halaqa Online"}
      subtitle={duplicateFrom ? "Créez une copie de la séance avec une nouvelle date." : "Créez une séance de récitation en ligne et assignez-la à un enseignant."}
      submitLabel={duplicateFrom ? "Dupliquer la séance" : "Planifier la séance"}
    />
  )
}
