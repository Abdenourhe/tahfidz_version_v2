"use client"
// src/components/admin/StatsChartsI18n.tsx
// Wrapper i18n — ajoute le titre de page traduit autour des graphiques

import { useLanguage } from "@/contexts/LanguageContext"
import { StatsCharts } from "@/components/admin/StatsCharts"

interface Props {
  data: any
}

const T = {
  title:    { fr: "Statistiques",                    en: "Statistics",           ar: "الإحصائيات" },
  subtitle: { fr: "Vue d'ensemble des performances", en: "Performance overview", ar: "نظرة عامة على الأداء" },
}

export function StatsChartsI18n({ data }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>
      <StatsCharts data={data} locale={L} />
    </div>
  )
}
