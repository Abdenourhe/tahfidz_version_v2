"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarDays, ArrowRight } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface Child {
  id: string
  user: { fullName: string; avatar?: string | null }
}

export function AttendanceAlert({ missingChildren }: { missingChildren: Child[] }) {
  const t = useT("parentDashboardClient")

  if (missingChildren.length === 0) return null

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <Link
        href="/parent/attendance"
        className={cn(
          "flex items-center gap-3 p-4 rounded-2xl border transition-all duration-300",
          "bg-gradient-to-r from-amber-50/90 to-orange-50/70 dark:from-amber-900/20 dark:to-orange-900/10",
          "border-amber-200/70 dark:border-amber-700/30",
          "backdrop-blur-lg shadow-lg shadow-amber-500/5 hover:shadow-amber-500/10",
          "active:scale-[0.98]"
        )}
      >
        <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0">
          <CalendarDays size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
            {missingChildren.length === 1
              ? t("attendanceAlertOne").replace("{{name}}", missingChildren[0].user.fullName)
              : t("attendanceAlertMany").replace("{{count}}", String(missingChildren.length))}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t("clickToMark")}</p>
        </div>

        {missingChildren.length > 1 && (
          <div className="flex -space-x-2 shrink-0">
            {missingChildren.slice(0, 3).map((child) => (
              <div
                key={child.id}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-200 to-amber-100 dark:from-amber-700 dark:to-amber-800 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] font-bold text-amber-700 dark:text-amber-200"
                title={child.user.fullName}
              >
                {child.user.fullName.charAt(0).toUpperCase()}
              </div>
            ))}
            {missingChildren.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-800/50 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] font-bold text-amber-600 dark:text-amber-300">
                +{missingChildren.length - 3}
              </div>
            )}
          </div>
        )}

        <ArrowRight size={16} className="text-amber-400 shrink-0" />
      </Link>
    </motion.div>
  )
}
