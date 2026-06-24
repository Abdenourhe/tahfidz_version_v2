// src/app/teacher/halaqa/[id]/edit/page.tsx
"use client"

import { useParams } from "next/navigation"
import HalaqaForm from "@/components/halaqa/HalaqaForm"

export default function TeacherEditHalaqaPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <HalaqaForm
      mode="edit"
      sessionId={sessionId}
      backHref="/teacher/halaqa"
      isAdmin={false}
      title="Modifier la séance"
      subtitle="Modifiez les informations de votre Halaqa Online planifiée."
      submitLabel="Enregistrer les modifications"
    />
  )
}
