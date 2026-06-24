// src/app/admin/halaqa/[id]/edit/page.tsx
"use client"

import { useParams } from "next/navigation"
import HalaqaForm from "@/components/halaqa/HalaqaForm"

export default function AdminEditHalaqaPage() {
  const params = useParams()
  const sessionId = params.id as string

  return (
    <HalaqaForm
      mode="edit"
      sessionId={sessionId}
      backHref="/admin/halaqa"
      isAdmin={true}
      title="Modifier la séance"
      subtitle="Modifiez les informations de la Halaqa Online planifiée."
      submitLabel="Enregistrer les modifications"
    />
  )
}
