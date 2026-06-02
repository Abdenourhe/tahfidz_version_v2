"use client"

import { MessageCircle, HelpCircle, ArrowRight } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

export function QuickActionsWidget({ teacherName }: { teacherName: string | null }) {
  const t = useT("studentDashboardClient")
  if (!teacherName) return null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("quickActions")}</h3>
      </div>
      <div className="space-y-2">
        <a
          href="/student/messages"
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm text-gray-700 dark:text-gray-300"
        >
          <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
            <MessageCircle size={14} />
          </div>
          <span className="flex-1">{t("messageTeacher")}</span>
          <ArrowRight size={14} className="text-gray-400" />
        </a>
        <a
          href="/student/ask"
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-sm text-gray-700 dark:text-gray-300"
        >
          <div className="p-1.5 bg-orange-100 text-orange-600 rounded-md">
            <HelpCircle size={14} />
          </div>
          <span className="flex-1">{t("askQuestion")}</span>
          <ArrowRight size={14} className="text-gray-400" />
        </a>
      </div>
    </div>
  )
}
