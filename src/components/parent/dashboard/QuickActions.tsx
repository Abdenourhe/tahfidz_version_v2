"use client"

import Link from "next/link"
import { CalendarCheck, Bell, UserPlus } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

export function QuickActions() {
  const t = useT("parentDashboardClient")

  return (
    <div className="grid grid-cols-3 gap-3">
      <Link
        href="/parent/attendance"
        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-tahfidz-green/40 hover:shadow-md transition active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
          <CalendarCheck size={20} className="text-emerald-600" />
        </div>
        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">{t("markAttendance")}</span>
      </Link>

      <Link
        href="/parent/link"
        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-tahfidz-green/40 hover:shadow-md transition active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
          <UserPlus size={20} className="text-blue-600" />
        </div>
        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">{t("linkChild")}</span>
      </Link>

      <Link
        href="/parent/notifications"
        className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-purple-400/40 hover:shadow-md transition active:scale-95"
      >
        <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
          <Bell size={20} className="text-purple-600" />
        </div>
        <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center leading-tight">{t("notifications")}</span>
      </Link>
    </div>
  )
}
