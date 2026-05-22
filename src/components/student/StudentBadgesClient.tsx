"use client"
// src/components/student/StudentBadgesClient.tsx

import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Badge {
  id: string
  icon: string
  name: string
  nameAr: string | null
  description: string
  rarity: string
}
interface EarnedBadge {
  id: string
  badge: Badge
  earnedAt: Date
}

interface Props {
  earnedBadges: EarnedBadge[]
  allBadges: Badge[]
  totalStars: number
  formatDate: (d: Date, opts?: Intl.DateTimeFormatOptions) => string
}

export function StudentBadgesClient({ earnedBadges, allBadges, totalStars, formatDate }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("studentBadgesClient")

  const rarityConfig: Record<string, { label: string; gradient: string; border: string }> = {
    COMMON:    { label: L === "ar" ? "شائع" : L === "en" ? "Common" : "Commun", gradient: "from-gray-100 to-gray-200", border: "border-gray-300" },
    RARE:      { label: L === "ar" ? "نادر" : L === "en" ? "Rare" : "Rare", gradient: "from-blue-100 to-blue-200", border: "border-blue-400" },
    EPIC:      { label: L === "ar" ? "ملحمي" : L === "en" ? "Epic" : "Épique", gradient: "from-purple-100 to-purple-200", border: "border-purple-500" },
    LEGENDARY: { label: L === "ar" ? "أسطوري" : L === "en" ? "Legendary" : "Légendaire", gradient: "from-yellow-100 to-yellow-200", border: "border-yellow-500" },
  }

  const earnedIds = new Set(earnedBadges.map(sb => sb.badge.id))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {earnedBadges.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("earned")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {earnedBadges.map((sb) => {
              const rc = rarityConfig[sb.badge.rarity] ?? rarityConfig.COMMON
              return (
                <div key={sb.id} className={`bg-gradient-to-br ${rc.gradient} border-2 ${rc.border} rounded-2xl p-5 text-center badge-earned`}>
                  <div className="text-4xl mb-3">{sb.badge.icon}</div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{sb.badge.name}</p>
                  <p className="arabic text-xs text-gray-600 dark:text-gray-400 mb-2">{sb.badge.nameAr}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sb.badge.rarity === "LEGENDARY" ? "bg-yellow-400 text-yellow-900" :
                    sb.badge.rarity === "EPIC" ? "bg-purple-400 text-white" :
                    sb.badge.rarity === "RARE" ? "bg-blue-400 text-white" :
                    "bg-gray-300 text-gray-700"
                  }`}>{rc.label}</span>
                  <p className="text-xs text-gray-500 mt-2">{t("earnedOn")} {formatDate(sb.earnedAt, { day: "2-digit", month: "short" })}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div>
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("toUnlock")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {allBadges.filter(b => !earnedIds.has(b.id)).map((badge) => {
            const rc = rarityConfig[badge.rarity] ?? rarityConfig.COMMON
            return (
              <div key={badge.id} className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-center opacity-60">
                <div className="text-4xl mb-3 grayscale">{badge.icon}</div>
                <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1">{t("unknown")}</p>
                <p className="text-xs text-gray-400 mb-2">{badge.description}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{rc.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}