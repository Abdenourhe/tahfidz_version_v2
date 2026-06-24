// src/app/teacher/halaqa/new/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import HalaqaForm from "@/components/halaqa/HalaqaForm"
import { useT } from "@/contexts/LanguageContext"

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

export default function TeacherNewHalaqaPage() {
  const t = useT("halaqa")
  const searchParams = useSearchParams()
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
      backHref="/teacher/halaqa"
      isAdmin={false}
      duplicateFrom={duplicateFrom}
      title={duplicateFrom ? t("duplicateSession") || "Dupliquer la séance" : t("newHalaqaTitle")}
      subtitle={duplicateFrom ? t("duplicateSubtitle") || "Créez une copie de la séance avec une nouvelle date." : t("newHalaqaSubtitle")}
      submitLabel={duplicateFrom ? t("duplicateSession") || "Dupliquer la séance" : t("createSession")}
    />
  )
}
