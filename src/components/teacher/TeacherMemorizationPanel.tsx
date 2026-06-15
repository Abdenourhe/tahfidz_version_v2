"use client"
// src/components/teacher/TeacherMemorizationPanel.tsx

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Plus, BookOpen, Calendar, X, Loader2, Trash2, Search,
  Users, GraduationCap, CheckCircle2, AlertCircle, User, Eye,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn, formatDate } from "@/lib/utils"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { CourseDatePicker, displayLocalDate, dateToNoonIso, nextCourseDate } from "@/components/shared/CourseDatePicker"

interface StudentOption {
  id: string
  fullName: string
  fullNameAr?: string | null
  avatar?: string | null
  groupId?: string | null
  groupName?: string | null
}

interface SurahOption {
  id: number
  nameFr: string
  nameAr: string
  verseCount: number
}

interface GroupOption {
  id: string
  name: string
  nameAr?: string | null
  schedule?: Record<string, string> | null
  students: { id: string; user: { fullName: string; fullNameAr?: string | null } }[]
}

interface Assignment {
  id: string
  student: { id: string; user: { fullName: string; fullNameAr?: string | null } }
  surah: { id: number; nameFr: string; nameAr: string; verseCount: number }
  versesFrom: number | null
  versesTo: number | null
  dueDate: string | null
  status: string
  currentVerse: number
  completionPercentage: number
  notes: string | null
  startedAt: string
}

const STATUS_ORDER = ["ASSIGNED", "IN_PROGRESS", "NEEDS_REVISION", "MEMORIZED"]

function groupStudentsByGroup(students: StudentOption[]): [string, StudentOption[]][] {
  const map = new Map<string | null, StudentOption[]>()
  students.forEach((s) => {
    const key = s.groupName || null
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(s)
  })
  return Array.from(map.entries()).map(([key, list]) => [key || "__NO_GROUP__", list])
}

export default function TeacherMemorizationPanel() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherMemorizationPanel")
  const searchParams = useSearchParams()
  const defaultStudentId = searchParams.get("studentId") || ""
  const defaultGroupId = searchParams.get("groupId") || ""

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [surahs, setSurahs] = useState<SurahOption[]>([])
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtres tableau
  const [searchAssignment, setSearchAssignment] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")

  // Form wizard
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [mode, setMode] = useState<"student" | "group">("student")
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(defaultStudentId ? [defaultStudentId] : [])
  const [selectedGroupId, setSelectedGroupId] = useState<string>(defaultGroupId)
  const [form, setForm] = useState({
    surahId: "",
    versesFrom: "",
    versesTo: "",
    dueDate: "",
    notes: "",
  })

  // Autocomplete sourah
  const [surahQuery, setSurahQuery] = useState("")
  const [surahFilter, setSurahFilter] = useState<"all" | "short" | "medium" | "long" | "recent">("all")
  const surahInputRef = useRef<HTMLInputElement>(null)

  const [studentGroupTab, setStudentGroupTab] = useState<string>("ALL")
  const [calendarGroupId, setCalendarGroupId] = useState<string>("")
  const [groupDueDates, setGroupDueDates] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, sRes, qRes, gRes] = await Promise.all([
        fetch("/api/memorization/assign"),
        fetch("/api/students"),
        fetch("/api/surahs"),
        fetch("/api/groups?mine=true"),
      ])
      const aData = await aRes.json()
      const sData = await sRes.json()
      const qData = await qRes.json()
      const gData = await gRes.json()

      const mappedStudents = (sData.students || []).map((s: any) => ({
        id: s.id,
        fullName: s.user?.fullName || "",
        fullNameAr: s.user?.fullNameAr || null,
        avatar: s.user?.avatar || null,
        groupId: s.group?.id || null,
        groupName: s.group?.name || null,
      }))

      setAssignments(aData.assignments || [])
      setStudents(mappedStudents)
      setSurahs(qData.surahs || [])
      setGroups(gData.groups || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    if (!showForm) {
      setStep(1)
      setMode("student")
      setSelectedStudentIds(defaultStudentId ? [defaultStudentId] : [])
      setSelectedGroupId(defaultGroupId)
      setForm({ surahId: "", versesFrom: "", versesTo: "", dueDate: "", notes: "" })
      setSurahQuery("")
      setCalendarGroupId("")
      setGroupDueDates({})
      setError(null)
    }
  }, [showForm, defaultStudentId, defaultGroupId])

  const selectedSurah = useMemo(() => surahs.find((s) => s.id === Number(form.surahId)), [surahs, form.surahId])

  const selectedStudentGroups = useMemo(() => {
    if (mode !== "student" || selectedStudentIds.length === 0) return []
    const groupIds = Array.from(new Set(selectedStudentIds.map((id) => students.find((s) => s.id === id)?.groupId).filter(Boolean)))
    return groupIds.map((id) => groups.find((g) => g.id === id)).filter(Boolean) as GroupOption[]
  }, [mode, selectedStudentIds, students, groups])

  const targetGroupId = useMemo(() => {
    if (mode === "group") return selectedGroupId || null
    if (mode === "student" && selectedStudentIds.length > 0) {
      const groupIds = Array.from(new Set(selectedStudentIds.map((id) => students.find((s) => s.id === id)?.groupId).filter(Boolean)))
      if (groupIds.length === 0) return null
      if (groupIds.length === 1) return groupIds[0] as string
      if (calendarGroupId) return calendarGroupId
      const targetGroups = groupIds.map((id) => groups.find((g) => g.id === id)).filter(Boolean) as GroupOption[]
      const groupWithMostStudents = targetGroups
        .map((g) => ({ g, count: g.students.filter((s) => selectedStudentIds.includes(s.id)).length }))
        .sort((a, b) => b.count - a.count)[0]?.g
      return groupWithMostStudents?.id || (groupIds[0] as string)
    }
    return null
  }, [mode, selectedGroupId, selectedStudentIds, students, groups, calendarGroupId])

  const targetSchedule = useMemo(() => {
    if (!targetGroupId) return null
    return groups.find((g) => g.id === targetGroupId)?.schedule || null
  }, [targetGroupId, groups])

  const primaryStudent = useMemo(() => {
    if (mode === "student" && selectedStudentIds.length > 0) {
      return students.find((s) => s.id === selectedStudentIds[0]) || null
    }
    if (mode === "group" && selectedGroupId) {
      const firstStudentId = groups.find((g) => g.id === selectedGroupId)?.students[0]?.id
      return firstStudentId ? students.find((s) => s.id === firstStudentId) || null : null
    }
    return null
  }, [mode, selectedStudentIds, selectedGroupId, students, groups])

  useEffect(() => {
    if (step !== 3) return

    const groupIds = mode === "student" && selectedStudentIds.length > 0
      ? Array.from(new Set(selectedStudentIds.map((id) => students.find((s) => s.id === id)?.groupId).filter(Boolean)))
      : []

    // Mode élèves multi-groupes : une date butoir par groupe
    if (mode === "student" && groupIds.length > 1) {
      setGroupDueDates((prev) => {
        const next = { ...prev }
        let changed = false
        groupIds.forEach((groupId) => {
          const gid = groupId as string
          if (!next[gid]) {
            const schedule = groups.find((g) => g.id === gid)?.schedule
            const d = nextCourseDate(schedule)
            if (d) {
              next[gid] = d
              changed = true
            }
          }
        })
        return changed ? next : prev
      })
      return
    }

    // Mode mono-groupe : date butoir unique dans form.dueDate
    if (!targetGroupId) return
    if (form.dueDate) return
    const schedule = targetSchedule
    const nextDate = nextCourseDate(schedule)
    if (nextDate) setForm((f) => ({ ...f, dueDate: nextDate }))
  }, [step, targetGroupId, targetSchedule, mode, selectedStudentIds, students, groups, form.dueDate])

  const recentSurahIds = useMemo(() => {
    const ids = new Set<number>()
    assignments.slice(0, 10).forEach((a) => ids.add(a.surah.id))
    return Array.from(ids)
  }, [assignments])

  const filteredSurahs = useMemo(() => {
    let result = surahs
    if (surahFilter === "short") result = result.filter((s) => s.verseCount < 50)
    else if (surahFilter === "medium") result = result.filter((s) => s.verseCount >= 50 && s.verseCount <= 100)
    else if (surahFilter === "long") result = result.filter((s) => s.verseCount > 100)
    else if (surahFilter === "recent") result = result.filter((s) => recentSurahIds.includes(s.id))

    const q = surahQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((s) =>
        s.nameFr.toLowerCase().includes(q) ||
        s.nameAr.includes(q) ||
        s.id.toString() === q
      )
    }
    return result
  }, [surahs, surahQuery, surahFilter, recentSurahIds])

  const suggestedSurah = useMemo(() => {
    if (!mode || (mode === "student" && selectedStudentIds.length !== 1)) return null
    const targetStudentId = mode === "student" ? selectedStudentIds[0] : null
    if (!targetStudentId) return null
    const studentAssignments = assignments
      .filter((a) => a.student.id === targetStudentId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
    const lastMemorized = studentAssignments.find((a) => a.status === "MEMORIZED")
    if (lastMemorized) {
      const next = surahs.find((s) => s.id === lastMemorized.surah.id + 1)
      if (next) return next
    }
    return null
  }, [assignments, mode, selectedStudentIds, surahs])

  const verseCount = useMemo(() => {
    if (!selectedSurah) return 0
    const from = form.versesFrom ? parseInt(form.versesFrom, 10) : 1
    const to = form.versesTo ? parseInt(form.versesTo, 10) : selectedSurah.verseCount
    if (isNaN(from) || isNaN(to)) return 0
    return Math.max(0, to - from + 1)
  }, [selectedSurah, form.versesFrom, form.versesTo])

  const verseError = useMemo(() => {
    if (!selectedSurah) return null
    const from = form.versesFrom ? parseInt(form.versesFrom, 10) : null
    const to = form.versesTo ? parseInt(form.versesTo, 10) : null
    if (from !== null && (from < 1 || from > selectedSurah.verseCount)) {
      return t("verseFromInvalid").replace("{{total}}", String(selectedSurah.verseCount))
    }
    if (to !== null && (to < 1 || to > selectedSurah.verseCount)) {
      return t("verseToInvalid").replace("{{total}}", String(selectedSurah.verseCount))
    }
    if (from !== null && to !== null && from > to) {
      return t("verseRangeInvalid")
    }
    return null
  }, [selectedSurah, form.versesFrom, form.versesTo, t])

  const selectedStudentsLabel = useMemo(() => {
    if (mode === "group") {
      const g = groups.find((gr) => gr.id === selectedGroupId)
      return g ? `${t("group")} ${g.name}` : t("chooseGroup")
    }
    if (selectedStudentIds.length === 0) return t("chooseStudent")
    if (selectedStudentIds.length === 1) {
      const s = students.find((st) => st.id === selectedStudentIds[0])
      return s ? s.fullName : t("chooseStudent")
    }
    return `${selectedStudentIds.length} ${t("studentsSelected")}`
  }, [mode, selectedGroupId, selectedStudentIds, groups, students, t])

  const handleSurahSelect = (s: SurahOption) => {
    setForm((f) => ({ ...f, surahId: String(s.id), versesFrom: f.versesFrom || "1", versesTo: f.versesTo || String(s.verseCount) }))
    setSurahQuery(L === "ar" ? s.nameAr : `${s.id}. ${s.nameFr}`)
  }

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleGroupSelection = (groupStudentIds: string[], allSelected: boolean) => {
    setSelectedStudentIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !groupStudentIds.includes(id))
      }
      return Array.from(new Set([...prev, ...groupStudentIds]))
    })
  }

  const canGoNext = () => {
    if (step === 1) {
      if (mode === "group") return !!selectedGroupId
      return selectedStudentIds.length > 0
    }
    if (step === 2) {
      return !!form.surahId && !verseError
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canGoNext()) return
    setSubmitting(true)
    setError(null)
    try {
      const targetIds = mode === "group"
        ? (groups.find((g) => g.id === selectedGroupId)?.students.map((s) => s.id) || [])
        : selectedStudentIds

      if (targetIds.length === 0) throw new Error(t("noTargetStudents"))

      const isMultiGroup = mode === "student" && selectedStudentGroups.length > 1

      const body: any = {
        studentIds: targetIds,
        surahId: Number(form.surahId),
        versesFrom: form.versesFrom ? Number(form.versesFrom) : undefined,
        versesTo: form.versesTo ? Number(form.versesTo) : undefined,
        notes: form.notes || null,
      }

      if (isMultiGroup) {
        const missing = selectedStudentGroups.some((g) => !groupDueDates[g.id])
        if (missing) throw new Error(t("dueDateRequired"))
        body.groupDueDates = Object.fromEntries(
          selectedStudentGroups.map((g) => [g.id, dateToNoonIso(groupDueDates[g.id])])
        )
      } else {
        body.dueDate = form.dueDate ? dateToNoonIso(form.dueDate) : null
      }

      const res = await fetch("/api/memorization/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t("error"))
      setShowForm(false)
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
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

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ASSIGNED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      IN_PROGRESS: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
      MEMORIZED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
      NEEDS_REVISION: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    }
    return map[status] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  }

  const isOverdue = (a: Assignment) => {
    if (!a.dueDate) return false
    const due = new Date(a.dueDate)
    const now = new Date()
    const dueDay = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate())
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    return dueDay < today && a.status !== "MEMORIZED"
  }

  const displayedAssignments = useMemo(() => {
    let filtered = [...assignments]
    if (searchAssignment.trim()) {
      const q = searchAssignment.toLowerCase()
      filtered = filtered.filter((a) =>
        a.student.user.fullName.toLowerCase().includes(q) ||
        a.student.user.fullNameAr?.toLowerCase().includes(q) ||
        a.surah.nameFr.toLowerCase().includes(q) ||
        a.surah.nameAr.includes(q)
      )
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter)
    }
    return filtered.sort((a, b) => {
      const sa = STATUS_ORDER.indexOf(a.status)
      const sb = STATUS_ORDER.indexOf(b.status)
      if (sa !== sb) return sa - sb
      return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    })
  }, [assignments, searchAssignment, statusFilter])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: assignments.length }
    assignments.forEach((a) => { counts[a.status] = (counts[a.status] || 0) + 1 })
    return counts
  }, [assignments])

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
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-tahfidz-green text-white rounded-lg text-sm font-medium hover:bg-tahfidz-green-dark transition"
        >
          <Plus size={16} /> {t("assignSurah")}
        </button>
      </div>

      {/* Filtres tableau */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchAssignment}
            onChange={(e) => setSearchAssignment(e.target.value)}
            placeholder={t("searchAssignment")}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          />
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {[
            { key: "ALL", label: t("all") },
            { key: "ASSIGNED", label: t("status_ASSIGNED") },
            { key: "IN_PROGRESS", label: t("status_IN_PROGRESS") },
            { key: "NEEDS_REVISION", label: t("status_NEEDS_REVISION") },
            { key: "MEMORIZED", label: t("status_MEMORIZED") },
          ].map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition",
                statusFilter === s.key
                  ? "bg-tahfidz-green text-white border-tahfidz-green"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {s.label}
              <span className="ml-1.5 opacity-80">({statusCounts[s.key] || 0})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {displayedAssignments.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p>{t("noAssignments")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("student")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("surah")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("verses")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("progress")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayedAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <Link
                        href={`/teacher/students/${a.student.id}`}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-tahfidz-green transition flex items-center gap-1.5"
                        title={`${t("viewProfile")} ${a.student.user.fullName}`}
                      >
                        <User size={14} className="text-gray-400" />
                        {L === "ar" && a.student.user.fullNameAr ? a.student.user.fullNameAr : a.student.user.fullName}
                      </Link>
                    </td>
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
                          <div
                            className="h-full bg-tahfidz-green rounded-full transition-all"
                            style={{ width: `${a.completionPercentage}%` }}
                          />
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
                          href={`/teacher/students/${a.student.id}`}
                          title={t("viewProfile")}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                        >
                          <Eye size={16} />
                        </Link>
                        {a.status !== "MEMORIZED" && (
                          <Link
                            href={`/teacher/evaluation/new?studentId=${a.student.id}${a.id ? `&progressId=${a.id}` : ""}`}
                            title={t("evaluate")}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-gold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                          >
                            <CheckCircle2 size={16} />
                          </Link>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{t("assignSurah")}</h4>
                <p className="text-xs text-gray-500">{t("step")} {step}/3</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"><X size={20} /></button>
            </div>

            <div className="flex-shrink-0 px-6 pt-4">
              <div className="flex items-center gap-2 mb-4">
                {[
                  { num: 1, label: t("stepStudents") },
                  { num: 2, label: t("stepSurah") },
                  { num: 3, label: t("stepDetails") },
                ].map((s) => (
                  <div key={s.num} className={cn("flex items-center gap-2 text-xs", step >= s.num ? "text-tahfidz-green font-medium" : "text-gray-400")}>
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold", step >= s.num ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-800")}>{s.num}</span>
                    <span className="hidden sm:inline">{s.label}</span>
                    {s.num < 3 && <span className="hidden sm:inline text-gray-300">→</span>}
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMode("student")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition",
                        mode === "student" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500"
                      )}
                    >
                      <User size={14} className="inline-block mr-1" /> {t("modeStudent")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode("group")}
                      className={cn(
                        "flex-1 py-1.5 text-xs font-medium rounded-md transition",
                        mode === "group" ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm" : "text-gray-500"
                      )}
                    >
                      <Users size={14} className="inline-block mr-1" /> {t("modeGroup")}
                    </button>
                  </div>

                  {mode === "group" ? (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">{t("group")}</label>
                      <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      >
                        <option value="">{t("chooseGroup")}</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>{g.name} ({g.students.length} {t("students")})</option>
                        ))}
                      </select>
                      {selectedGroupId && (
                        <p className="text-xs text-gray-500">
                          {groups.find((g) => g.id === selectedGroupId)?.students.length || 0} {t("studentsWillReceive")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(() => {
                        const grouped = groupStudentsByGroup(students)
                        const tabs = [{ key: "ALL", label: t("allGroups") }, ...grouped.map(([name]) => ({ key: name, label: name === "__NO_GROUP__" ? t("noGroup") : name }))]
                        const visibleStudents = studentGroupTab === "ALL" ? students : (grouped.find(([name]) => name === studentGroupTab)?.[1] || [])
                        const visibleIds = visibleStudents.map((s) => s.id)
                        const allVisibleSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedStudentIds.includes(id))
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">{t("students")}</label>
                              <span className="text-xs text-gray-500">{selectedStudentIds.length} {t("studentsSelected")}</span>
                            </div>
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5">
                              {tabs.map((tab) => (
                                <button
                                  key={tab.key}
                                  type="button"
                                  onClick={() => setStudentGroupTab(tab.key)}
                                  className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition",
                                    studentGroupTab === tab.key
                                      ? "bg-tahfidz-green text-white"
                                      : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  )}
                                >
                                  {tab.label}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => toggleGroupSelection(visibleIds, allVisibleSelected)}
                                className="text-xs font-medium text-tahfidz-green hover:text-tahfidz-green-dark transition"
                              >
                                {allVisibleSelected ? t("deselectAll") : t("selectAll")}
                              </button>
                              <span className="text-[10px] text-gray-400">{visibleStudents.length} {t("students")}</span>
                            </div>
                            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                              {visibleStudents.length === 0 ? (
                                <p className="p-4 text-sm text-gray-400 text-center">{t("noStudents")}</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-800">
                                  {visibleStudents.map((s) => (
                                    <label
                                      key={s.id}
                                      className={cn(
                                        "flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition",
                                        selectedStudentIds.includes(s.id) && "bg-tahfidz-green/[0.04] dark:bg-tahfidz-green/[0.06]"
                                      )}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedStudentIds.includes(s.id)}
                                        onChange={() => toggleStudent(s.id)}
                                        className="w-4 h-4 text-tahfidz-green rounded border-gray-300 focus:ring-tahfidz-green"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm truncate", selectedStudentIds.includes(s.id) ? "font-semibold text-gray-900 dark:text-gray-100" : "font-medium text-gray-700 dark:text-gray-200")}>
                                          {L === "ar" && s.fullNameAr ? s.fullNameAr : s.fullName}
                                        </p>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  {/* Suggestion */}
                  {suggestedSurah && (
                    <div className="relative overflow-hidden rounded-xl border border-tahfidz-green/30 bg-gradient-to-br from-tahfidz-green/15 to-tahfidz-green/5 dark:from-tahfidz-green/20 dark:to-tahfidz-green/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-white/60 dark:bg-white/10 rounded-lg">
                          <GraduationCap size={20} className="text-tahfidz-green" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{t("suggestedSurah")}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{t("basedOnHistory")}</p>
                          <button
                            type="button"
                            onClick={() => handleSurahSelect(suggestedSurah)}
                            className="mt-3 text-xs px-4 py-2 bg-tahfidz-green text-white rounded-lg hover:bg-tahfidz-green-dark transition shadow-sm"
                          >
                            {L === "ar" ? suggestedSurah.nameAr : `${suggestedSurah.id}. ${suggestedSurah.nameFr}`} ({suggestedSurah.verseCount} {t("verses")})
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Recherche */}
                  <div className="relative" ref={surahInputRef}>
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      ref={surahInputRef}
                      type="text"
                      value={surahQuery}
                      onChange={(e) => setSurahQuery(e.target.value)}
                      placeholder={t("searchSurah")}
                      className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    />
                    {surahQuery && (
                      <button
                        type="button"
                        onClick={() => { setSurahQuery(""); surahInputRef.current?.focus() }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* Filtres */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                    {[
                      { key: "all", label: t("all") },
                      { key: "recent", label: t("recent") },
                      { key: "short", label: t("shortSurahs") },
                      { key: "medium", label: t("mediumSurahs") },
                      { key: "long", label: t("longSurahs") },
                    ].map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setSurahFilter(f.key as typeof surahFilter)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition",
                          surahFilter === f.key
                            ? "bg-tahfidz-green text-white border-tahfidz-green"
                            : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                        )}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Grille de sourates */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto p-0.5">
                    {filteredSurahs.length === 0 ? (
                      <div className="col-span-full p-6 text-center text-gray-400 text-sm">
                        <BookOpen size={24} className="mx-auto mb-2 opacity-40" />
                        {t("noSurahFound")}
                      </div>
                    ) : (
                      filteredSurahs.map((s) => {
                        const selected = form.surahId === String(s.id)
                        const isRecent = recentSurahIds.includes(s.id)
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => handleSurahSelect(s)}
                            className={cn(
                              "relative text-start p-3 rounded-xl border transition flex flex-col gap-1",
                              selected
                                ? "border-tahfidz-green bg-tahfidz-green/10 dark:bg-tahfidz-green/15"
                                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-tahfidz-green/40 hover:bg-gray-50 dark:hover:bg-gray-800/80"
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", selected ? "bg-tahfidz-green text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500")}>{s.id}</span>
                              {isRecent && <span className="w-1.5 h-1.5 rounded-full bg-tahfidz-gold" title={t("recent")} />}
                            </div>
                            <div>
                              <p className={cn("text-sm font-semibold truncate", selected ? "text-tahfidz-green-dark dark:text-tahfidz-green-light" : "text-gray-900 dark:text-gray-100")}>
                                {L === "ar" ? s.nameAr : s.nameFr}
                              </p>
                              <p className="arabic text-[11px] text-gray-500 dark:text-gray-400 truncate">{L === "ar" ? s.nameFr : s.nameAr}</p>
                            </div>
                            <p className="text-[10px] text-gray-400 mt-auto">{s.verseCount} {t("verses")}</p>
                          </button>
                        )
                      })
                    )}
                  </div>

                  {/* Versets */}
                  {selectedSurah && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <BookOpen size={14} className="text-tahfidz-green" />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{L === "ar" ? selectedSurah.nameAr : selectedSurah.nameFr}</span>
                        <span className="text-xs text-gray-400">({selectedSurah.verseCount} {t("verses")})</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{t("versesFrom")}</label>
                          <input
                            type="number"
                            min={1}
                            max={selectedSurah.verseCount}
                            value={form.versesFrom}
                            onChange={(e) => setForm((f) => ({ ...f, versesFrom: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            placeholder="1"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{t("versesTo")}</label>
                          <input
                            type="number"
                            min={1}
                            max={selectedSurah.verseCount}
                            value={form.versesTo}
                            onChange={(e) => setForm((f) => ({ ...f, versesTo: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                            placeholder={String(selectedSurah.verseCount)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          {verseCount > 0 ? (
                            <>
                              <span className="font-bold text-tahfidz-green">{verseCount}</span> {t("versesSelected")} {t("of")} {selectedSurah.verseCount}
                            </>
                          ) : (
                            <span className="text-gray-400">{t("enterVerses")}</span>
                          )}
                        </p>
                        {verseError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {verseError}</p>}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  {/* Carte cible */}
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                    {mode === "group" ? (
                      <>
                        <div className="w-12 h-12 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
                          <Users size={22} className="text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {groups.find((g) => g.id === selectedGroupId)?.name || t("chooseGroup")}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {(groups.find((g) => g.id === selectedGroupId)?.students.length || 0)} {t("students")}
                          </p>
                        </div>
                      </>
                    ) : selectedStudentIds.length === 1 && primaryStudent ? (
                      <>
                        <div className="w-12 h-12 rounded-xl gradient-tahfidz flex items-center justify-center overflow-hidden flex-shrink-0">
                          <AvatarLightbox
                            src={primaryStudent.avatar}
                            alt={primaryStudent.fullName}
                            fallback={
                              <span className="text-white font-bold text-sm">
                                {primaryStudent.fullName.charAt(0).toUpperCase()}
                              </span>
                            }
                            className="w-full h-full"
                            imgClassName="w-full h-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {L === "ar" && primaryStudent.fullNameAr ? primaryStudent.fullNameAr : primaryStudent.fullName}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                            {primaryStudent.groupName || t("noGroup")}
                          </p>
                        </div>
                      </>
                    ) : selectedStudentIds.length > 1 ? (
                      <>
                        <div className="flex -space-x-2 flex-shrink-0">
                          {selectedStudentIds.slice(0, 3).map((id, idx) => {
                            const s = students.find((st) => st.id === id)
                            if (!s) return null
                            return (
                              <div
                                key={id}
                                className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center overflow-hidden gradient-tahfidz"
                                style={{ zIndex: 3 - idx }}
                              >
                                {s.avatar ? (
                                  <img src={s.avatar} alt={s.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-white font-bold text-[10px]">{s.fullName.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                            )
                          })}
                          {selectedStudentIds.length > 3 && (
                            <div className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300 z-0">
                              +{selectedStudentIds.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                            {selectedStudentIds.length} {t("studentsSelected")}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate" title={selectedStudentIds.map((id) => students.find((s) => s.id === id)?.fullName).filter(Boolean).join(", ")}>
                            {selectedStudentIds.map((id) => students.find((s) => s.id === id)?.fullName).filter(Boolean).join(", ")}
                          </p>
                        </div>
                      </>
                    ) : null}
                    <div className="text-end">
                      <p className="text-xs font-semibold text-tahfidz-green">{selectedSurah ? (L === "ar" ? selectedSurah.nameAr : selectedSurah.nameFr) : "—"}</p>
                      <p className="text-[10px] text-gray-400">{selectedSurah ? `${form.versesFrom || 1}-${form.versesTo || selectedSurah.verseCount}` : ""}</p>
                    </div>
                  </div>

                  {/* Récapitulatif */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2 text-sm">
                    <p className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <BookOpen size={14} className="text-tahfidz-green" /> {t("summary")}
                    </p>
                    <div className="flex justify-between"><span className="text-gray-500">{mode === "group" ? t("group") : t("students")}</span><span className="font-medium">{selectedStudentsLabel}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t("surah")}</span><span className="font-medium">{selectedSurah ? (L === "ar" ? selectedSurah.nameAr : selectedSurah.nameFr) : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">{t("verses")}</span><span className="font-medium">{selectedSurah ? `${form.versesFrom || 1}-${form.versesTo || selectedSurah.verseCount}` : "—"}</span></div>
                    {selectedStudentGroups.length > 1 ? (
                      <div className="space-y-1">
                        <span className="text-gray-500">{t("dueDateByGroup")}</span>
                        {selectedStudentGroups.map((g) => (
                          <div key={g.id} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{g.name}</span>
                            <span className="font-medium">{groupDueDates[g.id] ? displayLocalDate(groupDueDates[g.id], L) : "—"}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex justify-between"><span className="text-gray-500">{t("dueDate")}</span><span className="font-medium">{form.dueDate ? displayLocalDate(form.dueDate, L) : "—"}</span></div>
                    )}
                  </div>

                  {/* Calendrier */}
                  <div>
                    {selectedStudentGroups.length > 1 ? (
                      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Calendar size={14} className="text-tahfidz-green" /> {t("dueDateByGroup")}
                        </p>
                        {selectedStudentGroups.map((g) => (
                          <div key={g.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                                {g.name} ({g.students.filter((s) => selectedStudentIds.includes(s.id)).length} {t("students")})
                              </p>
                              {groupDueDates[g.id] && (
                                <span className="text-xs font-semibold text-tahfidz-green">{displayLocalDate(groupDueDates[g.id], L)}</span>
                              )}
                            </div>
                            <CourseDatePicker
                              value={groupDueDates[g.id] || ""}
                              onChange={(date) => setGroupDueDates((prev) => ({ ...prev, [g.id]: date }))}
                              schedule={g.schedule}
                              locale={L}
                              labels={{
                                courseDay: t("courseDay"),
                                weeklySchedule: t("weeklySchedule"),
                                noCourseDays: t("noCourseDays"),
                                day: (d) => t(`day_${d}` as const),
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium flex items-center gap-2">
                            <Calendar size={14} className="text-tahfidz-green" /> {t("dueDate")}
                          </label>
                          {form.dueDate && (
                            <span className="text-xs font-semibold text-tahfidz-green">{displayLocalDate(form.dueDate, L)}</span>
                          )}
                        </div>
                        <CourseDatePicker
                          value={form.dueDate}
                          onChange={(date) => setForm((f) => ({ ...f, dueDate: date }))}
                          schedule={targetSchedule}
                          locale={L}
                          labels={{
                            courseDay: t("courseDay"),
                            weeklySchedule: t("weeklySchedule"),
                            noCourseDays: t("noCourseDays"),
                            day: (d) => t(`day_${d}` as const),
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t("notes")}</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                      rows={3}
                      placeholder={t("notesPlaceholder")}
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-500 flex items-center gap-1"><AlertCircle size={14} /> {error}</p>}
            </form>

            <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep((s) => (s > 1 ? (s - 1) as 1 | 2 | 3 : s))}
                disabled={step === 1}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40 transition"
              >
                {t("back")}
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s < 3 ? (s + 1) as 1 | 2 | 3 : s))}
                  disabled={!canGoNext()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-tahfidz-green text-white hover:bg-tahfidz-green-dark disabled:opacity-50 transition"
                >
                  {t("next")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !canGoNext()}
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-tahfidz-green text-white hover:bg-tahfidz-green-dark disabled:opacity-50 transition flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  {t("assign")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
