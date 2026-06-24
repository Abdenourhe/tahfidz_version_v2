// src/app/teacher/halaqa/new/page.tsx
"use client"

import HalaqaForm from "@/components/halaqa/HalaqaForm"
import { useT } from "@/contexts/LanguageContext"

export default function TeacherNewHalaqaPage() {
  const t = useT("halaqa")
  return (
    <HalaqaForm
      mode="create"
      backHref="/teacher/halaqa"
      isAdmin={false}
      title={t("newHalaqaTitle")}
      subtitle={t("newHalaqaSubtitle")}
      submitLabel={t("createSession")}
    />
  )
}
