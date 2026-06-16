"use client"

import Link from "next/link"
import { CalendarDays, ArrowRight } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Child {
  id: string
  user: { fullName: string }
}

export function AttendanceAlert({ missingChildren }: { missingChildren: Child[] }) {
  const t = useT("parentDashboardClient")

  if (missingChildren.length === 0) return null

  return (
    <Link
      href="/parent/attendance"
      className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition active:scale-[0.98]"
    >
      <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0">
        <CalendarDays size={18} className="text-amber-600 dark:text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
          {missingChildren.length === 1
            ? t("attendanceAlertOne").replace("{{name}}", missingChildren[0].user.fullName)
            : t("attendanceAlertMany").replace("{{count}}", String(missingChildren.length))}
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{t("clickToMark")}</p>
      </div>
      <ArrowRight size={16} className="text-amber-400 shrink-0" />
    </Link>
  )
}
