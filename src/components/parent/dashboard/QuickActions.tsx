"use client"

import { motion } from "framer-motion"
import { CalendarClock, Building2, TrendingUp } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface Props {
  missingCount: number
  onContactAdmin: () => void
  onScrollToChildren?: () => void
  onOpenAttendance: () => void
}

export function QuickActions({ missingCount, onContactAdmin, onScrollToChildren, onOpenAttendance }: Props) {
  const t = useT("parentDashboardClient")

  const actions = [
    {
      key: "tomorrowAttendance",
      onClick: onOpenAttendance,
      icon: CalendarClock,
      color: "amber",
      label: missingCount > 0
        ? t("tomorrowAttendanceAlert").replace("{{count}}", String(missingCount))
        : t("tomorrowAttendanceOk"),
      badge: missingCount > 0 ? String(missingCount) : null,
    },
    {
      key: "contactAdmin",
      onClick: onContactAdmin,
      icon: Building2,
      color: "purple",
      label: t("contactAdmin"),
      badge: null,
    },
    {
      key: "childrenProgress",
      onClick: onScrollToChildren,
      icon: TrendingUp,
      color: "blue",
      label: t("childrenProgress"),
      badge: null,
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action, idx) => {
        const content = (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.96 }}
            className={cn(
              "relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300 h-full",
              "bg-white/70 dark:bg-gray-900/70",
              "border-white/60 dark:border-white/10",
              "backdrop-blur-lg shadow-lg shadow-black/5 dark:shadow-black/20",
              action.color === "amber" && "hover:border-amber-300 dark:hover:border-amber-500/30 hover:shadow-amber-500/10",
              action.color === "purple" && "hover:border-purple-300 dark:hover:border-purple-500/30 hover:shadow-purple-500/10",
              action.color === "blue" && "hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-blue-500/10"
            )}
          >
            <div
              className={cn(
                "relative w-11 h-11 rounded-2xl flex items-center justify-center",
                action.color === "amber" && "bg-amber-50 dark:bg-amber-900/20",
                action.color === "purple" && "bg-purple-50 dark:bg-purple-900/20",
                action.color === "blue" && "bg-blue-50 dark:bg-blue-900/20"
              )}
            >
              <action.icon
                size={22}
                className={cn(
                  action.color === "amber" && "text-amber-600",
                  action.color === "purple" && "text-purple-600",
                  action.color === "blue" && "text-blue-600"
                )}
              />
              {action.badge && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {action.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">
              {action.label}
            </span>
          </motion.div>
        )

        return (
          <button key={action.key} onClick={action.onClick} className="block w-full text-left">
            {content}
          </button>
        )
      })}
    </div>
  )
}
