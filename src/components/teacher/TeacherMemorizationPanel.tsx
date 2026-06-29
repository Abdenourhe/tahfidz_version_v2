"use client"
// src/components/teacher/TeacherMemorizationPanel.tsx

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  BookOpen, Loader2, Trash2, Search,
  CheckCircle2, User, Eye,
  ChevronDown, ChevronUp, LayoutGrid, List, Calendar,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn, formatDate } from "@/lib/utils"
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

interface StudentCard {
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

function statusColor(status: string) {
  const map: Record<string, string> = {
    ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    MEMORIZED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    NEEDS_REVISION: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  }
  return map[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
}

function isOverdue(a: Assignment) {
  if (!a.dueDate) return false
  const due = new Date(a.dueDate)
  const now = new Date()
  const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  return dueDay < today && a.status !== "MEMORIZED"
}


export default function TeacherMemorizationPanel() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherMemorizationPanel")

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedGroupId, setSelectedGroupId] = useState<string>("ALL")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [dailyLogModal, setDailyLogModal] = useState<{ open: boolean; assignment: Assignment | null } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, gRes] = await Promise.all([
        fetch("/api/memorization/assign"),
        fetch("/api/groups?mine=true"),
      ])
      const aData = await aRes.json()
      const gData = await gRes.json()
      setAssignments(aData.assignments || [])
      setGroups(gData.groups || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const studentsById = useMemo(() => {
    const map = new Map<string, StudentCard>()
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
      const card = map.get(sid)!
      card.assignments.push(a)
      if (a.status === "MEMORIZED") card.memorizedCount++
      else if (a.status === "IN_PROGRESS") card.inProgressCount++
      if (isOverdue(a)) card.overdueCount++
    }
    for (const card of map.values()) {
      const total = card.assignments.length
      card.averageProgress = total > 0
        ? Math.round(card.assignments.reduce((sum, a) => sum + a.completionPercentage, 0) / total)
        : 0
      card.assignments.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status))
    }
    return map
  }, [assignments])

  const allStudents = useMemo(() => Array.from(studentsById.values()), [studentsById])

  const filteredStudents = useMemo(() => {
    let result = allStudents
    if (selectedGroupId !== "ALL") {
      result = result.filter((s) => s.group?.id === selectedGroupId)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.fullNameAr?.toLowerCase().includes(q) ||
        s.assignments.some((a) =>
          a.surah.nameFr.toLowerCase().includes(q) ||
          a.surah.nameAr.includes(q)
        )
      )
    }
    return result.sort((a, b) => a.fullName.localeCompare(b.fullName))
  }, [allStudents, selectedGroupId, search])

  const groupStats = useMemo(() => {
    const targetStudents = selectedGroupId === "ALL" ? allStudents : allStudents.filter((s) => s.group?.id === selectedGroupId)
    const totalAssignments = targetStudents.reduce((sum, s) => sum + s.assignments.length, 0)
    const inProgress = targetStudents.reduce((sum, s) => sum + s.inProgressCount, 0)
    const memorized = targetStudents.reduce((sum, s) => sum + s.memorizedCount, 0)
    const overdue = targetStudents.reduce((sum, s) => sum + s.overdueCount, 0)
    const avgProgress = totalAssignments > 0
      ? Math.round(targetStudents.reduce((sum, s) => sum + s.assignments.reduce((s2, a) => s2 + a.completionPercentage, 0), 0) / totalAssignments)
      : 0
    return {
      studentsCount: targetStudents.length,
      totalAssignments,
      inProgress,
      memorized,
      overdue,
      avgProgress,
    }
  }, [allStudents, selectedGroupId])

  const toggleExpand = (id: string) => {
    setExpandedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

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
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode("cards")}
            className={cn(
              "px-3 py-2 text-sm flex items-center gap-1.5 transition",
              viewMode === "cards" ? "bg-tahfidz-green text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            )}
          >
            <LayoutGrid size={14} /> {t("cards") || "Cartes"}
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={cn(
              "px-3 py-2 text-sm flex items-center gap-1.5 transition",
              viewMode === "table" ? "bg-tahfidz-green text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300"
            )}
          >
            <List size={14} /> {t("table") || "Tableau"}
          </button>
        </div>
      </div>

      {/* Statistiques du groupe */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: "students", label: t("students") || "Élèves", value: groupStats.studentsCount, color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200" },
          { key: "assignments", label: t("assignments") || "Assignations", value: groupStats.totalAssignments, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
          { key: "inProgress", label: t("status_IN_PROGRESS") || "En cours", value: groupStats.inProgress, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" },
          { key: "memorized", label: t("status_MEMORIZED") || "Mémorisées", value: groupStats.memorized, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
          { key: "overdue", label: t("overdue") || "En retard", value: groupStats.overdue, color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
        ].map((stat) => (
          <div
            key={stat.key}
            className="text-start rounded-xl border border-gray-100 dark:border-gray-800 p-3 bg-white dark:bg-gray-900"
          >
            <p className={cn("text-lg font-bold", stat.color.split(" ")[1])}>{stat.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Barre de progression moyenne */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t("averageProgress") || "Progression moyenne du groupe"}</p>
          <p className="text-sm font-bold text-tahfidz-green">{groupStats.avgProgress}%</p>
        </div>
        <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${groupStats.avgProgress}%` }} />
        </div>
      </div>

      {/* Vue cartes */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full p-12 text-center text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p>{t("noStudents") || "Aucun élève trouvé"}</p>
            </div>
          ) : (
            filteredStudents.map((s) => (
              <div
                key={s.id}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:border-tahfidz-green/50 transition"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full gradient-tahfidz flex items-center justify-center text-white font-bold text-sm">
                        {(L === "ar" && s.fullNameAr ? s.fullNameAr : s.fullName).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <Link
                          href={`/teacher/students/${s.id}`}
                          className="font-semibold text-gray-900 dark:text-gray-100 hover:text-tahfidz-green transition"
                        >
                          {L === "ar" && s.fullNameAr ? s.fullNameAr : s.fullName}
                        </Link>
                        <p className="text-xs text-gray-500">{s.group?.name || t("noGroup") || "Sans groupe"}</p>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-lg font-bold text-tahfidz-green">{s.averageProgress}%</p>
                      <p className="text-[10px] text-gray-400">{t("average") || "moyenne"}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {s.inProgressCount} {t("inProgress") || "en cours"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                      {s.memorizedCount} {t("memorized") || "mémorisées"}
                    </span>
                    {s.overdueCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        {s.overdueCount} {t("overdue") || "en retard"}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 space-y-2">
                    {s.assignments.slice(0, expandedStudents.has(s.id) ? undefined : 2).map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <BookOpen size={14} className="text-tahfidz-green flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                              {L === "ar" ? a.surah.nameAr : a.surah.nameFr}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {a.currentVerse} / {a.surah.verseCount} {t("verses") || "versets"}
                              {a.dueDate && ` · ${isOverdue(a) ? t("overdue") + " · " : ""}${formatDate(a.dueDate, L)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className="h-full bg-tahfidz-green rounded-full" style={{ width: `${a.completionPercentage}%` }} />
                          </div>
                          <span className="text-[10px] text-gray-500 w-7 text-end">{a.completionPercentage}%</span>
                          {a.status !== "MEMORIZED" && (
                            <button
                              onClick={() => setDailyLogModal({ open: true, assignment: a })}
                              title={t("fillInDailyLog") || "Remplir dans le carnet"}
                              className="p-1 rounded text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                              <BookOpen size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {s.assignments.length > 2 && (
                    <button
                      onClick={() => toggleExpand(s.id)}
                      className="mt-3 text-xs text-tahfidz-green hover:text-tahfidz-green-dark font-medium flex items-center gap-1"
                    >
                      {expandedStudents.has(s.id) ? (
                        <><ChevronUp size={14} /> {t("seeLess") || "Voir moins"}</>
                      ) : (
                        <><ChevronDown size={14} /> {t("seeMore") || "Voir plus"} ({s.assignments.length - 2})</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Vue tableau */}
      {viewMode === "table" && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
              <p>{t("noStudents") || "Aucun élève trouvé"}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">{t("student")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("group")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("surah")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("verses")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("progress")}</th>
                    <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                    <th className="px-4 py-3 text-right font-medium">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredStudents.flatMap((s) =>
                    s.assignments.map((a) => (
                      <tr key={`${s.id}-${a.id}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                        <td className="px-4 py-3">
                          <Link
                            href={`/teacher/students/${s.id}`}
                            className="font-medium text-gray-900 dark:text-gray-100 hover:text-tahfidz-green transition flex items-center gap-1.5"
                          >
                            <User size={14} className="text-gray-400" />
                            {L === "ar" && s.fullNameAr ? s.fullNameAr : s.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.group?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={13} className="text-tahfidz-green" />
                            <span className="font-medium text-gray-800 dark:text-gray-200">
                              {L === "ar" ? a.surah.nameAr : a.surah.nameFr}
                            </span>
                          </div>
                          {a.dueDate && (
                            <div className={cn("flex items-center gap-1 text-xs mt-0.5", isOverdue(a) ? "text-red-500 font-medium" : "text-gray-400")}>
                              <Calendar size={11} />
                              {isOverdue(a) ? `${t("overdue")} · ` : ""}{formatDate(a.dueDate, L)}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                          {a.versesFrom ?? 1}-{a.versesTo ?? a.surah.verseCount}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${a.completionPercentage}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{a.completionPercentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn("inline-flex px-2 py-0.5 rounded-full text-xs font-medium", statusColor(a.status))}>
                            {t(`status_${a.status}`) || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/teacher/students/${s.id}`}
                              title={t("viewProfile")}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                            >
                              <Eye size={16} />
                            </Link>
                            {a.status !== "MEMORIZED" && (
                              <>
                                <Link
                                  href={`/teacher/evaluation/new?studentId=${s.id}${a.id ? `&progressId=${a.id}` : ""}`}
                                  title={t("evaluate")}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-gold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                >
                                  <CheckCircle2 size={16} />
                                </Link>
                                <button
                                  onClick={() => setDailyLogModal({ open: true, assignment: a })}
                                  title={t("fillInDailyLog") || "Remplir dans le carnet"}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                                >
                                  <BookOpen size={16} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                              title={t("delete")}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal Hifz */}
      {dailyLogModal?.open && dailyLogModal.assignment && (
        <TeacherDailyLogModal
          studentId={dailyLogModal.assignment.student.id}
          studentName={L === "ar" && dailyLogModal.assignment.student.user.fullNameAr
            ? dailyLogModal.assignment.student.user.fullNameAr
            : dailyLogModal.assignment.student.user.fullName}
          date={new Date().toISOString().split("T")[0]}
          defaultSection="HIFZ"
          singleSection={true}
          lastLog={{}}
          memorizationAssignments={[{
            id: dailyLogModal.assignment.id,
            surahId: dailyLogModal.assignment.surah.id,
            status: dailyLogModal.assignment.status,
            completionPercentage: dailyLogModal.assignment.completionPercentage,
            currentVerse: dailyLogModal.assignment.currentVerse,
            startVerse: dailyLogModal.assignment.versesFrom ?? 1,
            endVerse: dailyLogModal.assignment.versesTo ?? dailyLogModal.assignment.surah.verseCount,
            surah: dailyLogModal.assignment.surah,
          }]}
          defaultMemorizationProgressId={dailyLogModal.assignment.id}
          onClose={() => setDailyLogModal(null)}
          onSaved={() => {
            setDailyLogModal(null)
            load()
          }}
        />
      )}
    </div>
  )
}
