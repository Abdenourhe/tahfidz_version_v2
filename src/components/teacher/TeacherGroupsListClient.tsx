"use client"
// src/components/teacher/TeacherGroupsListClient.tsx

import Link from "next/link"
import { BookOpen, Users } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Group {
  id: string
  name: string
  nameAr: string | null
  level: string
  maxCapacity: number
  isActive: boolean
  students: {
    id: string
    user: { fullName: string }
    _count: { memorizedSurahs: number }
  }[]
  _count: { students: number }
}

interface Props {
  groups: Group[]
}

export function TeacherGroupsListClient({ groups }: Props) {
  const t = useT("teacherGroupsListClient")

  const levelMap: Record<string, { label: string; color: string }> = {
    beginner:     { label: t("beginner"),     color: "bg-green-100 text-green-700" },
    intermediate: { label: t("intermediate"), color: "bg-yellow-100 text-yellow-700" },
    advanced:     { label: t("advanced"),     color: "bg-red-100 text-red-700" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.length === 0 ? (
          <div className="col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noGroup")}</p>
          </div>
        ) : (
          groups.map(group => {
            const lc = levelMap[group.level] ?? levelMap.beginner
            const capacityPct = Math.round((group._count.students / group.maxCapacity) * 100)
            const avgMemorized = group.students.length > 0
              ? Math.round(group.students.reduce((a, s) => a + s._count.memorizedSurahs, 0) / group.students.length)
              : 0

            return (
              <div key={group.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100">{group.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${lc.color}`}>{lc.label}</span>
                    </div>
                    {group.nameAr && <p className="arabic text-sm text-tahfidz-green">{group.nameAr}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-blue-600">{group._count.students}</p>
                    <p className="text-xs text-gray-400">{t("students")}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-tahfidz-green">{avgMemorized}</p>
                    <p className="text-xs text-gray-400">{t("avgSurahs")}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{group.maxCapacity}</p>
                    <p className="text-xs text-gray-400">{t("max")}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                    <span>{t("occupation")}</span>
                    <span className={capacityPct >= 90 ? "text-red-500 font-medium" : ""}>{group._count.students}/{group.maxCapacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`h-full rounded-full ${capacityPct >= 90 ? "bg-red-400" : capacityPct >= 70 ? "bg-yellow-400" : "bg-tahfidz-green"}`}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex -space-x-2">
                    {group.students.slice(0, 5).map(s => (
                      <div key={s.id} className="w-7 h-7 rounded-full gradient-tahfidz border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">{s.user.fullName.charAt(0)}</span>
                      </div>
                    ))}
                    {group.students.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                        <span className="text-gray-500 dark:text-gray-300 text-xs font-bold">+{group.students.length - 5}</span>
                      </div>
                    )}
                  </div>
                  {group.students.length === 0 && <span className="text-xs text-gray-400">{t("noStudent")}</span>}
                </div>

                <Link href={`/teacher/groups/${group.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
                  <Users size={15} /> {t("manage")}
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}