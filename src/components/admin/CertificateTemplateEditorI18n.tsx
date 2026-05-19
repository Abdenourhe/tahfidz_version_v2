"use client"
// src/components/admin/CertificateTemplateEditorI18n.tsx
// Wrapper i18n — ajoute le titre de page traduit autour de l'éditeur

import { useLanguage } from "@/contexts/LanguageContext"
import { CertificateTemplateEditor } from "@/components/admin/CertificateTemplateEditor"

interface Props {
  initialTemplates: any
}

const T = {
  title:    { fr: "Modèles de certificats",              en: "Certificate templates",          ar: "قوالب الشهادات" },
  subtitle: { fr: "Personnalisez les certificats selon le niveau",
              en: "Customize completion certificates by level",
              ar: "تخصيص شهادات الإنجاز حسب المستوى" },
}

export function CertificateTemplateEditorI18n({ initialTemplates }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>
      <CertificateTemplateEditor initialTemplates={initialTemplates} locale={L} />
    </div>
  )
}
