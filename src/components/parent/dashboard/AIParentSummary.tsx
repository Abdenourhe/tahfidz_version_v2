"use client"

import { motion } from "framer-motion"
import { Sparkles, AlertCircle, TrendingUp, Award, BookOpen } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null }
  group: { name: string } | null
  teacher: { user: { fullName: string } } | null
  studentBadges: { id: string; badge: { name: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  students: Child[]
  missingIds: string[]
}

export function AIParentSummary({ students, missingIds }: Props) {
  const t = useT("parentDashboardClient")

  const missingChildren = students.filter((c) => missingIds.includes(c.id))
  const streakChildren = students.filter((c) => c.currentStreak > 0).sort((a, b) => b.currentStreak - a.currentStreak)
  const badgeChildren = students.filter((c) => c.studentBadges.length > 0)
  const beginners = students.filter((c) => c._count.memorizedSurahs === 0)

  const bullets: { icon: React.ReactNode; text: string; type: "alert" | "success" | "info" }[] = []

  if (missingChildren.length > 0) {
    const names = missingChildren.map((c) => c.user.fullName).join(", ")
    bullets.push({
      icon: <AlertCircle size={14} />,
      text: t("summaryAttendance").replace("{{count}}", String(missingChildren.length)).replace("{{names}}", names),
      type: "alert",
    })
  }

  if (streakChildren.length > 0) {
    const top = streakChildren[0]
    bullets.push({
      icon: <TrendingUp size={14} />,
      text: t("summaryStreak").replace("{{name}}", top.user.fullName).replace("{{days}}", String(top.currentStreak)),
      type: "success",
    })
  }

  if (badgeChildren.length > 0) {
    const recent = badgeChildren[0]
    const badgeName = recent.studentBadges[recent.studentBadges.length - 1]?.badge.name || ""
    bullets.push({
      icon: <Award size={14} />,
      text: t("summaryBadge").replace("{{name}}", recent.user.fullName).replace("{{badge}}", badgeName),
      type: "success",
    })
  }

  if (beginners.length > 0 && beginners.length < students.length) {
    const names = beginners.map((c) => c.user.fullName).join(", ")
    bullets.push({
      icon: <BookOpen size={14} />,
      text: t("summaryBeginner").replace("{{names}}", names),
      type: "info",
    })
  }

  if (bullets.length === 0) {
    bullets.push({
      icon: <Sparkles size={14} />,
      text: t("summaryAllGood"),
      type: "success",
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        "bg-gradient-to-br from-white/70 to-white/40 dark:from-gray-900/70 dark:to-gray-900/40",
        "border-white/40 dark:border-white/10",
        "backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20"
      )}
    >
      {/* Glow décoratif */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-tahfidz-green/20 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-tahfidz-gold/15 blur-3xl" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-tahfidz-green to-emerald-600 text-white shadow-lg shadow-tahfidz-green/25">
          <Sparkles size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("aiSummaryTitle")}</h3>
          <ul className="mt-2 space-y-1.5">
            {bullets.map((b, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className={cn(
                  "flex items-center gap-2 text-xs",
                  b.type === "alert" && "text-amber-700 dark:text-amber-300",
                  b.type === "success" && "text-emerald-700 dark:text-emerald-300",
                  b.type === "info" && "text-blue-700 dark:text-blue-300"
                )}
              >
                <span className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                  b.type === "alert" && "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300",
                  b.type === "success" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300",
                  b.type === "info" && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                )}>
                  {b.icon}
                </span>
                <span className="truncate">{b.text}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  )
}
