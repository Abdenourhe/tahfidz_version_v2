"use client"
// src/components/admin/GroupsListClient.tsx

import { useState } from "react"

import Link from "next/link"
import { Plus, BookOpen, Users, Trash2 } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { shortId } from "@/lib/utils"
import { useRouter } from "next/navigation"

interface Group {
  id: string
  name: string
  nameAr: string | null
  level: string
  maxCapacity: number
  isActive: boolean
  teacher: { user: { fullName: string } }
  students: { id: string; totalStars: number }[]
  _count: { students: number }
}

interface Props {
  groups: Group[]
  // ← SUPPRIMÉ : shortId n'est plus en props
}

export function GroupsListClient({ groups: initialGroups }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()
  const t = useT("groupsListClient")

  const [groups, setGroups] = useState<Group[]>(initialGroups)
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (groupId: string) => {
    if (!confirm(t("deleteConfirm"))) return
    setDeleting(groupId)
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        alert(d.error || "Erreur")
        return
      }
      setGroups(prev => prev.filter(g => g.id !== groupId))
      router.refresh()
    } catch {
      alert("Erreur réseau")
    } finally {
      setDeleting(null)
    }
  }

  const levelMap: Record<string, { label: string; color: string }> = {
    beginner:     { label: t("beginner"),     color: "bg-green-100 text-green-700" },
    intermediate: { label: t("intermediate"), color: "bg-yellow-100 text-yellow-700" },
    advanced:     { label: t("advanced"),     color: "bg-red-100 text-red-700" },
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/groups/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("add")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {groups.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noGroup")}</p>
          </div>
        ) : (
          groups.map((group) => {
            const lvl = levelMap[group.level] ?? { label: group.level, color: "bg-gray-100 text-gray-600" }
            const capacityPct = Math.round((group._count.students / group.maxCapacity) * 100)
            const avgStars = group.students.length > 0
              ? Math.round(group.students.reduce((a, s) => a + s.totalStars, 0) / group.students.length)
              : 0

            return (
              <div key={group.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md select-all">{shortId(group.id)}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full ${group.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {group.isActive ? t("statusActive") : t("statusInact")}
                  </span>
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{group.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${lvl.color}`}>{lvl.label}</span>
                    </div>
                    {group.nameAr && <p className="arabic text-sm text-gray-500">{group.nameAr}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500 dark:text-gray-400">
                  <Users size={14} />
                  <span>{group.teacher.user.fullName}</span>
                </div>

                {/* Capacité */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>{group._count.students} {t("students")}</span>
                    <span className={capacityPct >= 90 ? "text-red-500 font-medium" : ""}>{group._count.students}/{group.maxCapacity}</span>
                  </div>
                  <div className="progress-bar">
                    <div className={`h-full rounded-full transition-all duration-500 ${capacityPct >= 90 ? "bg-red-400" : capacityPct >= 70 ? "bg-yellow-400" : "bg-tahfidz-green"}`}
                      style={{ width: `${Math.min(capacityPct, 100)}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-tahfidz-gold font-medium">⭐ {avgStars} {t("avgStars")}</span>
                  <div className="flex items-center gap-3">
                    {group._count.students === 0 && (
                      <button
                        onClick={() => handleDelete(group.id)}
                        disabled={deleting === group.id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> {t("delete")}
                      </button>
                    )}
                    <Link href={`/admin/groups/${group.id}`}
                      className="text-xs text-tahfidz-green hover:underline font-medium">{t("manage")}</Link>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}