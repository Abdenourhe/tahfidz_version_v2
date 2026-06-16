"use client"
// src/components/parent/dashboard/ParentDashboardClient.tsx — Centre d'opération parent

import { useSession } from "next-auth/react"
import { useT } from "@/contexts/LanguageContext"
import { User } from "lucide-react"
import Link from "next/link"
import { ChildCard } from "./ChildCard"
import { QuickActions } from "./QuickActions"
import { AttendanceAlert } from "./AttendanceAlert"

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { name: string } | null
  teacher: { user: { fullName: string } } | null
  studentBadges: { id: string; badge: { icon: string; name: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  todayDate: string
  children: Child[]
  missingTomorrowIds: string[]
}

export function ParentDashboardClient({ todayDate: _todayDate, children, missingTomorrowIds }: Props) {
  const t = useT("parentDashboardClient")
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || ""

  const missingChildren = children.filter((c) => missingTomorrowIds.includes(c.id))

  return (
    <div className="space-y-5">
      {/* En-tête de bienvenue */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100">
          {firstName ? t("welcome").replace("{{name}}", firstName) : t("welcomeFallback")}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Actions rapides */}
      <QuickActions />

      {/* Alerte présence */}
      <AttendanceAlert missingChildren={missingChildren} />

      {/* Mes enfants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <User size={16} className="text-tahfidz-green" />
            {t("myChildren")}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{children.length}</span>
          </h2>
        </div>

        {children.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-4xl mb-3">👨‍👩‍👦</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noChild")}</p>
            <p className="text-sm text-gray-500 mb-4">{t("noChildDesc")}</p>
            <Link
              href="/parent/link"
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition active:scale-95"
            >
              {t("linkChild")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
