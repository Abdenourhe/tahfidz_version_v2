"use client"
// src/components/teacher/TeacherMemorizationPanel.tsx

import { useState, useEffect, useCallback, useMemo } from "react"
import {
  BookOpen, Loader2, Search,
  User, Eye, NotebookPen, Trash2,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { useMobile } from "@/hooks/useMobile"
import { TeacherStudentDrawer } from "@/components/teacher/TeacherStudentDrawer"
import { TeacherDailyLogModal } from "@/components/teacher/TeacherDailyLogModal"

interface Surah {
  id: number
  nameFr: string
  nameAr: string
  verseCount: number
}

interface Group {
  id: string
  name: string
  nameAr?: string | null
}

interface Assignment {
  id: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null }
    group: Group | null
  }
  surah: Surah
  versesFrom: number | null
  versesTo: number | null
  dueDate: string | null
  status: string
  currentVerse: number
  completionPercentage: number
  notes: string | null
  startedAt: string
}

interface StudentRow {
  id: string
  fullName: string
  fullNameAr?: string | null
  group: Group | null
  assignments: Assignment[]
  inProgressCount: number
  memorizedCount: number
  overdueCount: number
  averageProgress: number
}

const STATUS_ORDER = ["ASSIGNED", "IN_PROGRESS", "NEEDS_REVISION", "MEMORIZED"]

function isOverdue(a: Assignment) {
  if (!a.dueDate) return false
  const due = new Date(a.dueDate)
  const now = new Date()
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return dueDay < today && a.status !== "MEMORIZED"
}

function globalStatus(row: StudentRow) {
  if (row.overdueCount > 0) return { label: "overdue", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
  if (row.inProgressCount > 0) return { label: "inProgress", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" }
  if (row.memorizedCount > 0) return { label: "memorized", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" }
  return { label: "assigned", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" }
}

function visibleSurahBadges(assignments: Assignment[]) {
  const visible = assignments.slice(0, 3)
  const hiddenCount = assignments.length - 3
  return { visible, hiddenCount }
}

function surahBadge(a: Assignment, L: string) {
  const name = L === "ar" ? a.surah.nameAr : a.surah.nameFr
  if (a.status === "MEMORIZED") return `${name} ✓`
  return `${name} ${a.currentVerse}/${a.surah.verseCount}`
}

export default function TeacherMemorizationPanel() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherMemorizationPanel")
  const { isMobile } = useMobile()

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL")
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [dailyLogStudent, setDailyLogStudent] = useState<{ id: string; fullName: string; fullNameAr?: string | null } | null>(null)


  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/memorization/assign")
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rows = useMemo(() => {
    const map = new Map<string, StudentRow>()
    for (const a of assignments) {
      const sid = a.student.id
      if (!map.has(sid)) {
        map.set(sid, {
          id: sid,
          fullName: a.student.user.fullName,
          fullNameAr: a.student.user.fullNameAr,
          group: a.student.group,
          assignments: [],
          inProgressCount: 0,
          memorizedCount: 0,
          overdueCount: 0,
          averageProgress: 0,
        })
      }
      const row = map.get(sid)!
      row.assignments.push(a)
      if (a.status === "MEMORIZED") row.memorizedCount++
      else if (a.status === "IN_PROGRESS") row.inProgressCount++
      if (isOverdue(a)) row.overdueCount++
    }
    for (const row of map.values()) {
      const total = row.assignments.length
      row.averageProgress = total > 0
        ? Math.round(row.assignments.reduce((sum, a) => sum + a.completionPercentage, 0) / total)
        : 0
      row.assignments.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    }
    return Array.from(map.values()).sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [assignments])

  const filteredRows = useMemo(() => {
    let result = rows
    if (selectedGroupId !== "ALL") {
      result = result.filter((r) => r.group?.id === selectedGroupId)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.fullNameAr?.toLowerCase().includes(q) ||
        r.assignments.some((a) =>
          a.surah.nameFr.toLowerCase().includes(q) ||
          a.surah.nameAr.includes(q)
        )
      )
    }
    return result
  }, [rows, selectedGroupId, search])

  const availableGroups = useMemo(() => {
    const map = new Map<string, Group>()
    for (const row of rows) {
      if (row.group) map.set(row.group.id, row.group)
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [rows])

  const groupStats = useMemo(() => {
    const targetRows = selectedGroupId === "ALL" ? rows : rows.filter((r) => r.group?.id === selectedGroupId)
    const totalAssignments = targetRows.reduce((sum, r) => sum + r.assignments.length, 0)
    const inProgress = targetRows.reduce((sum, r) => sum + r.inProgressCount, 0)
    const memorized = targetRows.reduce((sum, r) => sum + r.memorizedCount, 0)
    const overdue = targetRows.reduce((sum, r) => sum + r.overdueCount, 0)
    const avgProgress = totalAssignments > 0
      ? Math.round(targetRows.reduce((sum, r) => sum + r.assignments.reduce((s2, a) => s2 + a.completionPercentage, 0), 0) / totalAssignments)
      : 0
    return {
      studentsCount: targetRows.length,
      totalAssignments,
      inProgress,
      memorized,
      overdue,
      avgProgress,
    }
  }, [rows, selectedGroupId])

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete") || "Supprimer ?")) return
    const res = await fetch(`/api/memorization/assign?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || "Erreur")
    }
    load()
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin text-tahfidz-green" size={28} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t("myAssignments")}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchStudentOrSurah") || "Rechercher un élève ou une sourah..."}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          />
        </div>
        <select
          value={selectedGroupId}
          onChange={(e) => setSelectedGroupId(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
        >
          <option value="ALL">{t("allGroups") || "Tous les groupes"}</option>
          {availableGroups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        {[
          { label: t("students") || "Élèves", value: groupStats.studentsCount },
          { label: t("assignments") || "Assignations", value: groupStats.totalAssignments },
          { label: t("status_IN_PROGRESS") || "En cours", value: groupStats.inProgress },
          { label: t("status_MEMORIZED") || "Mémorisées", value: groupStats.memorized },
          { label: t("overdue") || "En retard", value: groupStats.overdue },
        ].map((s, i) => (
          <div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-2.5 sm:p-3 bg-white dark:bg-gray-900">
            <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("averageProgress") || "Progression moyenne du groupe"}</p>
          <p className="text-sm font-bold text-tahfidz-green">{groupStats.avgProgress}%</p>
        </div>
        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${groupStats.avgProgress}%` }} />
        </div>
      </div>

      {/* Tableau / cartes mobile */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {filteredRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>{t("noStudents") || "Aucun élève trouvé"}</p>
          </div>
        ) : isMobile ? (
          <div className="p-3 space-y-3">
            {filteredRows.map((row) => {
              const { visible, hiddenCount } = visibleSurahBadges(row.assignments)
              const status = globalStatus(row)
              return (
                <div
                  key={row.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 space-y-3"
                  onClick={() => setSelectedStudentId(row.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                        <User size={14} className="text-gray-400" />
                        {L === "ar" && row.fullNameAr ? row.fullNameAr : row.fullName}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{row.group?.name || "—"}</p>
                    </div>
                    <span className={cn("inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium", status.color)}>
                      {t(`status_${status.label}`) || status.label}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {visible.map((a) => (
                      <span
                        key={a.id}
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium",
                          a.status === "MEMORIZED"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                        )}
                      >
                        <BookOpen size={10} />
                        {surahBadge(a, L)}
                      </span>
                    ))}
                    {hiddenCount > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium bg-tahfidz-green/10 text-tahfidz-green dark:bg-tahfidz-green/20 dark:text-tahfidz-green-light">
                        +{hiddenCount}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-tahfidz-green rounded-full" style={{ width: `${row.averageProgress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">{row.averageProgress}%</span>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDailyLogStudent({ id: row.id, fullName: row.fullName, fullNameAr: row.fullNameAr }) }}
                      title={t("fillInDailyLog") || "Remplir le carnet"}
                      className="p-2 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <NotebookPen size={18} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (row.assignments.length === 1) {
                          handleDelete(row.assignments[0].id)
                        } else {
                          setSelectedStudentId(row.id)
                        }
                      }}
                      title={t("delete")}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setSelectedStudentId(row.id) }}
                      title={t("viewProfile")}
                      className="p-2 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                      <Eye size={18} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("student")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("group")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("activeSurahs") || "Sourates actives"}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("progress")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredRows.map((row) => {
                  const { visible, hiddenCount } = visibleSurahBadges(row.assignments)
                  const status = globalStatus(row)
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                      onClick={() => setSelectedStudentId(row.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                          <User size={14} className="text-gray-400" />
                          {L === "ar" && row.fullNameAr ? row.fullNameAr : row.fullName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{row.group?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {visible.map((a) => (
                            <span
                              key={a.id}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                                a.status === "MEMORIZED"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              )}
                            >
                              <BookOpen size={10} />
                              {surahBadge(a, L)}
                            </span>
                          ))}
                          {hiddenCount > 0 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-tahfidz-green/10 text-tahfidz-green dark:bg-tahfidz-green/20 dark:text-tahfidz-green-light">
                              +{hiddenCount}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-tahfidz-green rounded-full" style={{ width: `${row.averageProgress}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 w-8">{row.averageProgress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", status.color)}>
                          {t(`status_${status.label}`) || status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); setDailyLogStudent({ id: row.id, fullName: row.fullName, fullNameAr: row.fullNameAr }) }}
                            title={t("fillInDailyLog") || "Remplir le carnet"}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <NotebookPen size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              if (row.assignments.length === 1) {
                                handleDelete(row.assignments[0].id)
                              } else {
                                setSelectedStudentId(row.id)
                              }
                            }}
                            title={t("delete")}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setSelectedStudentId(row.id) }}
                            title={t("viewProfile")}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <Eye size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Drawer fiche élève */}
      {selectedStudentId && (
        <TeacherStudentDrawer
          open={!!selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
          studentId={selectedStudentId}
          assignments={assignments.filter((a) => a.student.id === selectedStudentId)}
          onAssignmentsChange={load}
        />
      )}

      {/* Modal carnet rapide */}
      {dailyLogStudent && (
        <TeacherDailyLogModal
          studentId={dailyLogStudent.id}
          studentName={L === "ar" && dailyLogStudent.fullNameAr ? dailyLogStudent.fullNameAr : dailyLogStudent.fullName}
          date={new Date().toISOString().split("T")[0]}
          defaultSection="HIFZ"
          singleSection={true}
          lastLog={{}}
          onClose={() => setDailyLogStudent(null)}
          onSaved={() => {
            setDailyLogStudent(null)
            load()
          }}
        />
      )}
    </div>
  )
}
