// src/app/admin/halaqa/new/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import HalaqaForm from "@/components/halaqa/HalaqaForm"

export default function AdminNewHalaqaPage() {
  const searchParams = useSearchParams()
  const teacherId = searchParams.get("teacherId") || ""

  return (
    <HalaqaForm
      mode="create"
      backHref="/admin/halaqa"
      isAdmin={true}
      initialTeacherId={teacherId}
      title="Planifier une Halaqa Online"
      subtitle="Créez une séance de récitation en ligne et assignez-la à un enseignant."
      submitLabel="Planifier la séance"
    />
  )
}
