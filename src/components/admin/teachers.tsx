"use client"
// src/components/admin/teachers.tsx
// Fusion de : TeachersListClient.tsx + TeacherDetailClient.tsx

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import {
  Plus, Search, Users, ArrowLeft, BookOpen, Star,
  ClipboardList, Pencil, Trash2, AlertTriangle,
} from "lucide-react"
import { formatDate, scoreToGrade } from "@/lib/utils"

// ═══════════════════════════════════════════════════════════════════════════
// LISTE ENSEIGNANTS
// ═══════════════════════════════════════════════════════════════════════════

interface TeacherRow {
  id: string
  user: {
    fullName: string
    email: string
    avatar: string | null
    isActive: boolean
    createdAt: Date
    gender: string | null
  }
  groups: { id: string; name: string; _count: { students: number } }[]
  _count: { students: number; evaluations: number }
}

interface ListProps {
  teachers: TeacherRow[]
  total: number
  search: string
}

export function TeachersListClient({ teachers: initialTeachers, total: _total, search }: ListProps) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()
  const t = useT("teachers_1")

  const [teachers, setTeachers] = useState<TeacherRow[]>(initialTeachers)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/teachers/${deleteId}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || t("deleteBlocked"))
        setDeleteLoading(false)
        return
      }
      setTeachers((prev) => prev.filter((t) => t.id !== deleteId))
      setDeleteId(null)
      router.refresh()
    } catch {
      setDeleteError(t("deleteBlocked"))
    } finally {
      setDeleteLoading(false)
    }
  }

  const teacherToDelete = teachers.find((t) => t.id === deleteId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/admin/teachers/new"
          className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-medium rounded-lg hover:opacity-90 transition">
          <Plus size={16} /> {t("add")}
        </Link>
      </div>

      <form>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input name="search" type="text" defaultValue={search} placeholder={t("search")}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white" />
        </div>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teachers.length === 0 ? (
          <div className="col-span-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="text-gray-400">{t("noTeacher")}</p>
          </div>
        ) : (
          teachers.map((teacher) => (
            <div key={teacher.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{teacher.user.fullName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</p>
                    <p className="text-xs text-gray-400">{teacher.user.email}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${teacher.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {teacher.user.isActive ? t("statusActive") : t("statusInact")}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-blue-600">{teacher._count.students}</p>
                  <p className="text-xs text-gray-400">{t("students")}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-purple-600">{teacher.groups.length}</p>
                  <p className="text-xs text-gray-400">{t("groups")}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                  <p className="text-lg font-bold text-tahfidz-green">{teacher._count.evaluations}</p>
                  <p className="text-xs text-gray-400">{t("evaluations")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-400">{t("enrolled")} {formatDate(teacher.user.createdAt, L, { month: "short", year: "numeric" })}</span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/teachers/${teacher.id}/edit`}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition"
                    title={t("edit")}>
                    <Pencil size={14} />
                  </Link>
                  <button
                    onClick={() => { setDeleteId(teacher.id); setDeleteError(null) }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition"
                    title={t("delete")}>
                    <Trash2 size={14} />
                  </button>
                  <Link href={`/admin/teachers/${teacher.id}`}
                    className="text-xs text-tahfidz-green hover:underline font-medium ml-1">{t("view")}</Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Confirmation dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("delete")}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("deleteConfirm")}
            </p>
            {teacherToDelete && (
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                {teacherToDelete.user.fullName}
              </p>
            )}
            {deleteError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setDeleteId(null); setDeleteError(null) }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                disabled={deleteLoading}>
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {deleteLoading ? "…" : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// DÉTAIL ENSEIGNANT
// ═══════════════════════════════════════════════════════════════════════════

interface DetailProps {
  teacher: any
  school: any
  avgScore: number | null
}

export function TeacherDetailClient({ teacher: initialTeacher, school, avgScore }: DetailProps) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const router = useRouter()
  const t = useT("teachers_2")

  const [teacher, _setTeacher] = useState<any>(initialTeacher)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const res = await fetch(`/api/teachers/${teacher.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setDeleteError(data.error || t("deleteBlocked"))
        setDeleteLoading(false)
        return
      }
      setShowDelete(false)
      router.push("/admin/teachers")
    } catch {
      setDeleteError(t("deleteBlocked"))
      setDeleteLoading(false)
    }
  }

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/teachers" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</h1>
          {teacher.user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400">{teacher.user.fullNameAr}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/teachers/${teacher.id}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition">
            <Pencil size={14} /> {t("edit")}
          </Link>
          <button
            onClick={() => { setShowDelete(true); setDeleteError(null) }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition">
            <Trash2 size={14} /> {t("delete")}
          </button>
          <span className={`px-3 py-1 text-sm rounded-full font-medium ${teacher.user.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
            {teacher.user.isActive ? t("active") : t("inactive")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center mb-3">
                <span className="text-white font-bold text-xl">{teacher.user.fullName.charAt(0)}</span>
              </div>
              <p className="font-bold text-gray-900 dark:text-gray-100">{teacher.user.fullName}</p>
              <p className="text-xs text-gray-400 mt-0.5">{teacher.user.email}</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("specialization")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.specialization ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("gender")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{genderLabel(teacher.user.gender)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t("enrolled")}</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.createdAt, L, { day: "2-digit", month: "short", year: "numeric" })}</span>
              </div>
              {teacher.user.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("lastLogin")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatDate(teacher.user.lastLoginAt, L, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              )}
              {teacher.user.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">{t("phone")}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{teacher.user.phone}</span>
                </div>
              )}
            </div>

            {school && (
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-700">
                  {school.logo ? (
                    <Image src={school.logo} alt={school.name} width={36} height={36} className="w-full h-full object-contain p-0.5" unoptimized />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                      <span className="text-white font-bold text-xs">{school.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{t("school")}</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{school.name}</p>
                  {school.nameAr && <p className="arabic text-xs text-gray-400 truncate">{school.nameAr}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: t("groups"), value: teacher.groups.length, color: "text-blue-600" },
              { icon: BookOpen, label: t("students"), value: teacher._count.students, color: "text-tahfidz-green" },
              { icon: ClipboardList, label: t("evaluations"), value: teacher._count.evaluations, color: "text-purple-600" },
              { icon: Star, label: t("avgScore"), value: avgScore ?? "—", color: "text-tahfidz-gold" },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <stat.icon size={18} className={`${stat.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-2 space-y-4">
          {/* Groupes */}
          {teacher.groups.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("groups")} ({teacher.groups.length})</h3>
              <div className="space-y-2">
                {teacher.groups.map((group: any) => (
                  <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">{group.name}</p>
                      <p className="text-xs text-gray-400">{group._count.students} {t("students")}</p>
                    </div>
                    <Link href={`/admin/groups/${group.id}`} className="text-xs text-tahfidz-green hover:underline font-medium">
                      {t("manageGroup")}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Élèves récents */}
          {teacher.students.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("students")} ({teacher.students.length})</h3>
              <div className="space-y-2">
                {teacher.students.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                        <span className="text-white font-bold text-xs">{s.user.fullName.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 dark:text-gray-200">{s.user.fullName}</p>
                        {s.user.fullNameAr && <p className="arabic text-xs text-gray-400">{s.user.fullNameAr}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">{s._count.memorizedSurahs} {t("memorized")}</span>
                      <Link href={`/admin/students/${s.id}`} className="text-xs text-tahfidz-green hover:underline font-medium">
                        {t("viewStudent")}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Évaluations récentes */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("recentEval")} ({teacher.evaluations.length})</h3>
            {teacher.evaluations.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">{t("noEval")}</p>
            ) : (
              <div className="space-y-2">
                {teacher.evaluations.map((evalItem: any) => {
                  const grade = scoreToGrade(evalItem.finalScore)
                  return (
                    <div key={evalItem.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{evalItem.student.user.fullName}</p>
                          <p className="text-xs text-gray-400">{evalItem.progress?.surah?.nameFr ?? "—"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${grade.color}`}>{evalItem.finalScore}/100</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${grade.bg} ${grade.color}`}>{grade.label}</span>
                        <span className="text-xs text-gray-400">{formatDate(evalItem.evaluatedAt, L, { day: "2-digit", month: "short" })}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t("delete")}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("deleteConfirm")}
            </p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
              {teacher.user.fullName}
            </p>
            {deleteError && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">{deleteError}</p>
            )}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => { setShowDelete(false); setDeleteError(null) }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                disabled={deleteLoading}>
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50">
                {deleteLoading ? "…" : t("delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
