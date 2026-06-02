"use client"
// src/components/student/StudentBadgesClient.tsx

import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"

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
}

export function StudentBadgesClient({ earnedBadges, allBadges, totalStars }: Props) {
  const t = useT("studentBadgesClient")

  const rarityConfig: Record<string, { labelKey: string; gradient: string; border: string }> = {
    COMMON:    { labelKey: "common", gradient: "from-gray-100 to-gray-200", border: "border-gray-300" },
    RARE:      { labelKey: "rare", gradient: "from-blue-100 to-blue-200", border: "border-blue-400" },
    EPIC:      { labelKey: "epic", gradient: "from-purple-100 to-purple-200", border: "border-purple-500" },
    LEGENDARY: { labelKey: "legendary", gradient: "from-yellow-100 to-yellow-200", border: "border-yellow-500" },
  }

  const earnedIds = new Set(earnedBadges.map(sb => sb.badge.id))

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {earnedBadges.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
          <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("earned")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {earnedBadges.map((sb, i) => {
              const rc = rarityConfig[sb.badge.rarity] ?? rarityConfig.COMMON
              return (
                <motion.div key={sb.id} className={`bg-gradient-to-br ${rc.gradient} border-2 ${rc.border} rounded-2xl p-5 text-center badge-earned`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}>
                  <div className="text-4xl mb-3">{sb.badge.icon}</div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 text-sm mb-1">{sb.badge.name}</p>
                  <p className="arabic text-xs text-gray-600 dark:text-gray-400 mb-2">{sb.badge.nameAr}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    sb.badge.rarity === "LEGENDARY" ? "bg-yellow-400 text-yellow-900" :
                    sb.badge.rarity === "EPIC" ? "bg-purple-400 text-white" :
                    sb.badge.rarity === "RARE" ? "bg-blue-400 text-white" :
                    "bg-gray-300 text-gray-700"
                  }`}>{t(rc.labelKey)}</span>
                  <p className="text-xs text-gray-500 mt-2">{t("earnedOn")} {formatDate(sb.earnedAt, { day: "2-digit", month: "short" })}</p>
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
        <h2 className="font-semibold text-gray-700 dark:text-gray-300 mb-4">{t("toUnlock")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {allBadges.filter(b => !earnedIds.has(b.id)).map((badge, i) => {
            const rc = rarityConfig[badge.rarity] ?? rarityConfig.COMMON
            return (
              <motion.div key={badge.id} className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-5 text-center opacity-60"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.03 }}>
                <div className="text-4xl mb-3 grayscale">{badge.icon}</div>
                <p className="font-semibold text-gray-500 dark:text-gray-400 text-sm mb-1">{t("unknown")}</p>
                <p className="text-xs text-gray-400 mb-2">{badge.description}</p>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t(rc.labelKey)}</span>
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}