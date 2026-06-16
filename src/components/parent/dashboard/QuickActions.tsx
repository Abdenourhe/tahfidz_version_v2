"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { CalendarCheck, Bell, UserPlus } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

const actions = [
  { key: "markAttendance", href: "/parent/attendance", icon: CalendarCheck, color: "emerald", labelColor: "text-emerald-600" },
  { key: "linkChild", href: "/parent/link", icon: UserPlus, color: "blue", labelColor: "text-blue-600" },
  { key: "notifications", href: "/parent/notifications", icon: Bell, color: "purple", labelColor: "text-purple-600" },
]

export function QuickActions() {
  const t = useT("parentDashboardClient")

  return (
    <div className="grid grid-cols-3 gap-3">
      {actions.map((action, idx) => (
        <motion.div
          key={action.key}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.06 }}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
        >
          <Link
            href={action.href}
            className={cn(
              "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all duration-300",
              "bg-white/70 dark:bg-gray-900/70",
              "border-white/60 dark:border-white/10",
              "backdrop-blur-lg shadow-lg shadow-black/5 dark:shadow-black/20",
              action.color === "emerald" && "hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:shadow-emerald-500/10",
              action.color === "blue" && "hover:border-blue-300 dark:hover:border-blue-500/30 hover:shadow-blue-500/10",
              action.color === "purple" && "hover:border-purple-300 dark:hover:border-purple-500/30 hover:shadow-purple-500/10"
            )}
          >
            <div
              className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110",
                action.color === "emerald" && "bg-emerald-50 dark:bg-emerald-900/20",
                action.color === "blue" && "bg-blue-50 dark:bg-blue-900/20",
                action.color === "purple" && "bg-purple-50 dark:bg-purple-900/20"
              )}
            >
              <action.icon size={22} className={action.labelColor} />
            </div>
            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">
              {t(action.key as "markAttendance" | "linkChild" | "notifications")}
            </span>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
