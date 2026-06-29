"use client"
// src/components/teacher/TeacherStudentsGrid.tsx

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  BookOpen, RotateCcw, Headphones, GraduationCap, CalendarDays, Star,
  ChevronLeft, ChevronRight, Loader2, Users, Filter, ClipboardList, CheckCircle2,
  Clock, XCircle, Plus, Search, X, FileText, Award, ExternalLink, AlertTriangle,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { TeacherDailyLogModal } from "@/components/teacher/TeacherDailyLogModal"
import { TeacherBulkFillModal } from "@/components/teacher/TeacherBulkFillModal"
import { CourseDatePicker, displayLocalDate } from "@/components/shared/CourseDatePicker"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null

type SectionKey = "ATTENDANCE" | "HIFZ" | "MURAJA" | "TALQIN" | "COURSE"
type ModalMode = SectionKey | "FULL"

interface Surah {
  id: number
  nameFr: string
  nameAr: string
  verseCount: number
}

interface DailyLog {
  id: string
  date: string
  hifzFromSurahId: number | null
  hifzFromVerse: number | null
  hifzToSurahId: number | null
  hifzToVerse: number | null
  hifzNote: string | null
  murajaFromSurahId: number | null
  murajaFromVerse: number | null
  murajaToSurahId: number | null
  murajaToVerse: number | null
  murajaNote: string | null
  talqinFromSurahId: number | null
  talqinFromVerse: number | null
  talqinToSurahId: number | null
  talqinToVerse: number | null
  talqinNote: string | null
  courseBook: string | null
  courseFromPage: number | null
  courseToPage: number | null
  courseNote: string | null
  attendanceStatus: AttendanceStatus
  teacherObservation: string | null
  globalScore: number | null
}

interface ActiveProgress {
  id: string
  status: string
  completionPercentage: number
  surah: Surah
}

interface MemorizationAssignment {
  id: string
  surahId: number
  status: string
  completionPercentage: number
  currentVerse: number
  startVerse: number
  endVerse: number
  surah: { id: number; nameFr: string; nameAr: string; verseCount: number }
}

interface StudentRow {
  id: string
  user: { id: string; fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { id: string; name: string; nameAr: string | null } | null
  dailyLog: DailyLog | null
  lastLogs: {
    hifz?: DailyLog
    muraja?: DailyLog
    talqin?: DailyLog
    course?: DailyLog
  }
  activeProgress: ActiveProgress | null
  memorizationAssignments: MemorizationAssignment[]
  readyForEvaluation: boolean
}

interface Group {
  id: string
  name: string
  nameAr: string | null
  schedule: Record<string, string> | null
}

interface Props {
  initialGroups: Group[]
}

const SECTIONS: { key: SectionKey; labelKey: string; icon: React.ElementType; color: string; bg: string; lightColor: string }[] = [
  { key: "ATTENDANCE", labelKey: "presence", icon: CalendarDays, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10", lightColor: "text-red-500" },
  { key: "HIFZ", labelKey: "hifz", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10", lightColor: "text-emerald-500" },
  { key: "MURAJA", labelKey: "muraja", icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10", lightColor: "text-blue-500" },
  { key: "TALQIN", labelKey: "talqin", icon: Headphones, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10", lightColor: "text-purple-500" },
  { key: "COURSE", labelKey: "course", icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", lightColor: "text-amber-500" },
]

const ATTENDANCE_OPTIONS: { value: Exclude<AttendanceStatus, null>; labelKey: string; icon: React.ElementType; classes: string }[] = [
  { value: "PRESENT", labelKey: "present", icon: CheckCircle2, classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  { value: "LATE",    labelKey: "late",    icon: Clock,         classes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { value: "EXCUSED", labelKey: "excused", icon: BookOpen,      classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { value: "ABSENT",  labelKey: "absent",  icon: XCircle,       classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
]

function formatDateInput(d: Date) {
  return d.toISOString().split("T")[0]
}

function getSurahName(surah: Surah | undefined, locale: string) {
  if (!surah) return "—"
  return locale === "ar" ? surah.nameAr : surah.nameFr
}

function verseRange(fromSurah?: Surah | null, fromVerse?: number | null, toSurah?: Surah | null, toVerse?: number | null, locale?: string) {
  if (!fromSurah && !toSurah) return null
  const a = getSurahName(fromSurah ?? undefined, locale || "fr")
  const b = getSurahName(toSurah ?? undefined, locale || "fr")
  const sameSurah = !toSurah || fromSurah?.id === toSurah?.id
  const v1 = fromVerse ?? ""
  const v2 = toVerse ?? ""
  if (sameSurah) {
    if (v1 && v2 && v1 !== v2) return `${a} ${v1}→${v2}`
    if (v1) return `${a} ${v1}`
    return a
  }
  return `${a} ${v1} → ${b} ${v2}`
}

const GROUP_COLORS = ["#16a34a", "#2563eb", "#d97706", "#9333ea", "#dc2626", "#0891b2"]

function EmptyCell({ label, colorClass = "text-gray-400" }: { label: string; colorClass?: string }) {
  return (
    <span className={cn("flex items-center justify-center gap-1.5 w-full h-full", colorClass)}>
      <Plus size={12} className="opacity-60" />
      <span>{label}</span>
    </span>
  )
}

export function TeacherStudentsGrid({ initialGroups }: Props) {
  const { locale, dir } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherStudents")
  const router = useRouter()
  const searchParams = useSearchParams()

  const today = useMemo(() => formatDateInput(new Date()), [])
  const urlDate = searchParams.get("date")
  const urlGroup = searchParams.get("groupId") || ""

  const [date, setDate] = useState(urlDate || today)
  const [groupId, setGroupId] = useState(urlGroup)

  useEffect(() => {
    setGroupId(urlGroup)
  }, [urlGroup])

  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<StudentRow[]>([])
  const [onlyEmpty, setOnlyEmpty] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statFilter, setStatFilter] = useState<"all" | "filled" | "absent" | "ready">("all")
  const [surahs, setSurahs] = useState<Surah[]>([])

  const [modal, setModal] = useState<{ open: boolean; student: StudentRow | null; section: ModalMode }>({
    open: false,
    student: null,
    section: "HIFZ",
  })
  const [bulkModal, setBulkModal] = useState<{ open: boolean; section: SectionKey | "GLOBAL_SCORE" }>({
    open: false,
    section: "ATTENDANCE",
  })
  const [editingScore, setEditingScore] = useState<Record<string, boolean>>({})
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({})
  const [savingScore, setSavingScore] = useState<Record<string, boolean>>({})
  const [validatingAll, setValidatingAll] = useState(false)
  const [pendingAttendance, setPendingAttendance] = useState<Record<string, AttendanceStatus>>({})
  const [openMenuStudentId, setOpenMenuStudentId] = useState<string | null>(null)
  const attendanceMenuRef = useRef<HTMLDivElement | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const calendarRef = useRef<HTMLDivElement | null>(null)
  const calendarButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!calendarOpen) return
    const handleClick = (e: MouseEvent) => {
      if (calendarRef.current?.contains(e.target as Node)) return
      if (calendarButtonRef.current?.contains(e.target as Node)) return
      setCalendarOpen(false)
    }
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [calendarOpen])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/students?date=${date}${groupId ? `&groupId=${groupId}` : ""}`)
      const data = await res.json()
      if (res.ok) {
        setRows(data.students || [])
        setSurahs(data.surahs || [])
      } else {
        console.error(data.error)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [date, groupId])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    setPendingAttendance({})
    setOpenMenuStudentId(null)
  }, [date, groupId])

  useEffect(() => {
    if (!openMenuStudentId) return
    const handleClick = (e: MouseEvent) => {
      if (attendanceMenuRef.current?.contains(e.target as Node)) return
      setOpenMenuStudentId(null)
    }
    window.addEventListener("click", handleClick)
    return () => window.removeEventListener("click", handleClick)
  }, [openMenuStudentId])

  const updateUrl = (newDate: string, newGroup: string) => {
    const params = new URLSearchParams()
    if (newDate && newDate !== today) params.set("date", newDate)
    if (newGroup) params.set("groupId", newGroup)
    const qs = params.toString()
    router.replace(`/teacher/students${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const handleDateChange = (d: string) => {
    setDate(d)
    updateUrl(d, groupId)
  }

  const handleGroupChange = (g: string) => {
    setGroupId(g)
    updateUrl(date, g)
  }

  const selectedGroup = useMemo(() => initialGroups.find((g) => g.id === groupId) || null, [initialGroups, groupId])

  const multiSchedule = useMemo(() => {
    if (groupId) return undefined
    return initialGroups
      .filter((g) => g.schedule && Object.keys(g.schedule).length > 0)
      .map((g, idx) => ({
        id: g.id,
        label: g.name,
        schedule: g.schedule || {},
        color: GROUP_COLORS[idx % GROUP_COLORS.length],
      }))
  }, [groupId, initialGroups])

  const shiftDate = (days: number) => {
    const d = new Date(date + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + days)
    const s = formatDateInput(d)
    handleDateChange(s)
  }

  const openLog = (student: StudentRow, section: ModalMode) => {
    setModal({ open: true, student, section })
  }

  const selectPendingAttendance = (studentId: string, status: AttendanceStatus) => {
    const current = rows.find((r) => r.id === studentId)?.dailyLog?.attendanceStatus ?? null
    setPendingAttendance((prev) => {
      if (status === current) {
        const next = { ...prev }
        delete next[studentId]
        return next
      }
      return { ...prev, [studentId]: status }
    })
    setOpenMenuStudentId(null)
  }

  const validateAllAttendances = async () => {
    const entries = Object.entries(pendingAttendance).filter(
      ([, status]) => status !== null
    ) as [string, Exclude<AttendanceStatus, null>][]
    if (entries.length === 0) return

    setValidatingAll(true)
    try {
      const items = entries
        .map(([studentId, status]) => {
          const student = rows.find((r) => r.id === studentId)
          return student ? { student, status } : null
        })
        .filter(Boolean) as { student: StudentRow; status: Exclude<AttendanceStatus, null> }[]

      // Met à jour le carnet quotidien pour chaque élève
      const logPromises = items.map(({ student, status }) =>
        fetch(`/api/students/${student.id}/daily-log`, {
          method: student.dailyLog ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, attendanceStatus: status }),
        })
      )

      // Synchronise avec l'onglet Présences par groupe
      const byGroup = items.reduce<Record<string, typeof items>>((acc, item) => {
        if (!item.student.group?.id) return acc
        acc[item.student.group.id] = acc[item.student.group.id] || []
        acc[item.student.group.id].push(item)
        return acc
      }, {})
      const attendancePromises = Object.entries(byGroup).map(([groupId, groupItems]) =>
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            groupId,
            date: `${date}T00:00:00.000Z`,
            records: groupItems.map(({ student, status }) => ({ studentId: student.id, status, notes: "" })),
          }),
        })
      )

      const results = await Promise.all([...logPromises, ...attendancePromises])
      if (results.some((r) => !r.ok)) throw new Error("Erreur")
      setPendingAttendance({})
      loadData()
    } catch (e) {
      console.error(e)
      alert(t("error"))
    } finally {
      setValidatingAll(false)
    }
  }

  const saveGlobalScore = async (student: StudentRow, value: string) => {
    const num = value === "" ? null : parseInt(value, 10)
    if (num !== null && (isNaN(num) || num < 0 || num > 20)) {
      alert(t("scoreRange"))
      return
    }
    setSavingScore((s) => ({ ...s, [student.id]: true }))
    try {
      const body: any = { date, globalScore: num }
      const method = student.dailyLog ? "PATCH" : "POST"
      const res = await fetch(`/api/students/${student.id}/daily-log`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erreur")
      loadData()
    } catch (e) {
      console.error(e)
      alert(t("error"))
    } finally {
      setSavingScore((s) => ({ ...s, [student.id]: false }))
      setEditingScore((s) => ({ ...s, [student.id]: false }))
    }
  }

  const attendanceBadge = (status: AttendanceStatus) => {
    if (!status) return null
    const map: Record<string, { label: string; classes: string }> = {
      PRESENT: { label: t("present"), classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      ABSENT: { label: t("absent"), classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
      LATE: { label: t("late"), classes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
      EXCUSED: { label: t("excused"), classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
    }
    return map[status] ?? { label: status, classes: "bg-gray-100 text-gray-700" }
  }

  const normalizedSearch = searchQuery.trim().toLowerCase()
  const displayRows = useMemo(() => {
    let filtered = rows
    if (normalizedSearch) {
      filtered = filtered.filter((r) => {
        const name = (L === "ar" && r.user.fullNameAr ? r.user.fullNameAr : r.user.fullName).toLowerCase()
        const groupName = (r.group ? (L === "ar" && r.group.nameAr ? r.group.nameAr : r.group.name) : "").toLowerCase()
        return name.includes(normalizedSearch) || groupName.includes(normalizedSearch)
      })
    }
    if (statFilter === "filled") {
      filtered = filtered.filter((r) => r.dailyLog && (r.dailyLog.attendanceStatus || r.dailyLog.hifzFromSurahId || r.dailyLog.globalScore !== null))
    } else if (statFilter === "absent") {
      filtered = filtered.filter((r) => r.dailyLog?.attendanceStatus === "ABSENT")
    } else if (statFilter === "ready") {
      filtered = filtered.filter((r) => r.readyForEvaluation)
    }
    if (onlyEmpty) {
      filtered = filtered.filter((r) => !r.dailyLog || (!r.dailyLog.attendanceStatus && !r.dailyLog.hifzFromSurahId && !r.dailyLog.globalScore))
    }
    return filtered
  }, [rows, normalizedSearch, statFilter, onlyEmpty, L])

  const findSurah = (id?: number | null) => surahs.find((s) => s.id === id)

  const isRtl = dir === "rtl"
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  const lastLogForModal = (student: StudentRow, section: ModalMode) => {
    if (section === "FULL" || section === "ATTENDANCE") {
      return {
        ...student.lastLogs.hifz,
        ...student.lastLogs.muraja,
        ...student.lastLogs.talqin,
        ...student.lastLogs.course,
      }
    }
    const key = section.toLowerCase() as keyof StudentRow["lastLogs"]
    return student.lastLogs[key]
  }

  return (
    <div className="space-y-4">
      {/* Header / Filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <PrevIcon size={16} />
          </button>
          <div className="relative">
            <button
              ref={calendarButtonRef}
              type="button"
              onClick={() => setCalendarOpen((v) => !v)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green min-w-[140px] text-center flex items-center justify-center gap-2"
            >
              <CalendarDays size={14} className="text-tahfidz-green" />
              {displayLocalDate(date, L)}
            </button>
            {calendarOpen && (
              <div ref={calendarRef} className="absolute top-full mt-2 right-0 z-50 w-72">
                <CourseDatePicker
                  value={date}
                  onChange={(d) => { handleDateChange(d); setCalendarOpen(false) }}
                  schedule={selectedGroup?.schedule}
                  multiSchedule={multiSchedule}
                  locale={L}
                />
              </div>
            )}
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <NextIcon size={16} />
          </button>
        </div>
      </div>

      {/* Groupes rapides + recherche */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
          <button
            onClick={() => handleGroupChange("")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border",
              groupId === ""
                ? "bg-tahfidz-green text-white border-tahfidz-green"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            {t("allGroups")}
          </button>
          {initialGroups.map((g) => (
            <button
              key={g.id}
              onClick={() => handleGroupChange(g.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border",
                groupId === g.id
                  ? "bg-tahfidz-green text-white border-tahfidz-green"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              {L === "ar" && g.nameAr ? g.nameAr : g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchStudent")}
              className="pl-8 pr-7 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green w-full md:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <button
            onClick={() => setOnlyEmpty((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition",
              onlyEmpty
                ? "bg-tahfidz-green text-white border-tahfidz-green"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <Filter size={14} />
            {t("onlyEmpty")}
          </button>
        </div>
      </div>

      {/* Résumé cliquable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => setStatFilter("all")}
          className={cn(
            "text-start bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition",
            statFilter === "all"
              ? "border-tahfidz-green ring-1 ring-tahfidz-green"
              : "border-gray-100 dark:border-gray-800 hover:border-tahfidz-green/50"
          )}
        >
          <div className="p-2 bg-tahfidz-green/10 rounded-lg"><Users size={18} className="text-tahfidz-green" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{rows.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("students")}</p>
          </div>
        </button>
        <button
          onClick={() => setStatFilter(statFilter === "filled" ? "all" : "filled")}
          className={cn(
            "text-start bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition",
            statFilter === "filled"
              ? "border-emerald-500 ring-1 ring-emerald-500"
              : "border-gray-100 dark:border-gray-800 hover:border-emerald-500/50"
          )}
        >
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><ClipboardList size={18} className="text-emerald-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.dailyLog?.attendanceStatus).length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("filledToday")}</p>
          </div>
        </button>
        <button
          onClick={() => setStatFilter(statFilter === "absent" ? "all" : "absent")}
          className={cn(
            "text-start bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition",
            statFilter === "absent"
              ? "border-red-500 ring-1 ring-red-500"
              : "border-gray-100 dark:border-gray-800 hover:border-red-500/50"
          )}
        >
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><CalendarDays size={18} className="text-red-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.dailyLog?.attendanceStatus === "ABSENT").length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("absents")}</p>
          </div>
        </button>
        <button
          onClick={() => setStatFilter(statFilter === "ready" ? "all" : "ready")}
          className={cn(
            "text-start bg-white dark:bg-gray-900 rounded-xl border p-3 flex items-center gap-3 transition",
            statFilter === "ready"
              ? "border-yellow-500 ring-1 ring-yellow-500"
              : "border-gray-100 dark:border-gray-800 hover:border-yellow-500/50"
          )}
        >
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><Star size={18} className="text-yellow-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.readyForEvaluation).length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("readyToEvaluate")}</p>
          </div>
        </button>
      </div>

      {/* Avertissement présences en attente */}
      <AnimatePresence>
        {Object.keys(pendingAttendance).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-yellow-800 dark:text-yellow-200"
          >
            <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="font-medium">{t("attendancesRequired")}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tableau */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        {loading && rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-400">
            <Loader2 size={28} className="animate-spin mb-3" />
            <p className="text-sm">{t("loading")}</p>
          </div>
        ) : displayRows.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p>{rows.length === 0 ? t("noStudents") : t("noEmptyStudents")}</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <th className="sticky start-0 z-10 bg-gray-50 dark:bg-gray-800/60 text-start px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                    {t("student")}
                  </th>
                  {SECTIONS.map((sec) => (
                    <th key={sec.key} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <sec.icon size={14} className={sec.lightColor} />
                          {t(sec.labelKey)}
                        </div>
                        <button
                          onClick={() => {
                            if (!groupId) {
                              alert(t("selectGroupFirst"))
                              return
                            }
                            setBulkModal({ open: true, section: sec.key })
                          }}
                          title={`${t("fillAll")} — ${t(sec.labelKey)}`}
                          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-tahfidz-green transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[80px]">
                    <div className="flex items-center justify-between gap-2">
                      <span>{t("global")}</span>
                      <button
                        onClick={() => {
                          if (!groupId) {
                            alert(t("selectGroupFirst"))
                            return
                          }
                          setBulkModal({ open: true, section: "GLOBAL_SCORE" })
                        }}
                        title={`${t("fillAll")} — ${t("global")}`}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-tahfidz-green transition"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayRows.map((student) => {
                  const log = student.dailyLog
                  const displayStatus = pendingAttendance[student.id] ?? log?.attendanceStatus ?? null
                  return (
                    <tr key={student.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      {/* Élève */}
                      <td className="sticky start-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/30 px-4 py-3">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          title={`${t("viewProfile")} ${L === "ar" && student.user.fullNameAr ? student.user.fullNameAr : student.user.fullName}`}
                          className="flex items-center gap-3 group/row rounded-lg transition"
                        >
                          <div
                            className="w-9 h-9 rounded-lg gradient-tahfidz flex items-center justify-center overflow-hidden flex-shrink-0"
                            onClick={(e) => e.preventDefault()}
                          >
                            <AvatarLightbox
                              src={student.user.avatar}
                              alt={student.user.fullName}
                              fallback={
                                <span className="text-white font-bold text-xs">
                                  {student.user.fullName.charAt(0).toUpperCase()}
                                </span>
                              }
                              className="w-full h-full"
                              imgClassName="w-full h-full"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover/row:text-tahfidz-green transition flex items-center gap-1.5">
                              {L === "ar" && student.user.fullNameAr ? student.user.fullNameAr : student.user.fullName}
                              <ExternalLink size={12} className="opacity-0 group-hover/row:opacity-60 transition-opacity text-tahfidz-green flex-shrink-0" />
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {student.group ? (L === "ar" && student.group.nameAr ? student.group.nameAr : student.group.name) : t("noGroup")}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Présence - sélecteur horizontal d'icônes */}
                      <td className="px-3 py-2">
                        <AnimatePresence mode="wait">
                          {openMenuStudentId === student.id ? (
                            <motion.div
                              ref={attendanceMenuRef}
                              key="attendance-menu"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              className="grid grid-cols-2 gap-1.5 w-full"
                            >
                              {ATTENDANCE_OPTIONS.map((opt) => {
                                const selected = (pendingAttendance[student.id] ?? log?.attendanceStatus) === opt.value
                                const Icon = opt.icon
                                return (
                                  <button
                                    key={opt.value}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      selectPendingAttendance(student.id, opt.value)
                                    }}
                                    className={cn(
                                      "px-2 py-2 rounded-lg flex items-center gap-2 transition shadow-sm text-[10px] font-bold",
                                      opt.classes,
                                      selected
                                        ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900"
                                        : "opacity-80 hover:opacity-100"
                                    )}
                                  >
                                    <Icon size={16} />
                                    <span className="truncate">{t(opt.labelKey)}</span>
                                  </button>
                                )
                              })}
                            </motion.div>
                          ) : (
                            <motion.button
                              key="attendance-badge"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.12 }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setOpenMenuStudentId(student.id)
                              }}
                              className={cn(
                                "w-full text-center px-2 py-2 rounded-lg text-xs font-medium border transition min-h-[40px] flex items-center justify-center relative",
                                displayStatus
                                  ? attendanceBadge(displayStatus)!.classes
                                  : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800",
                                pendingAttendance[student.id] !== undefined && "ring-2 ring-tahfidz-gold ring-offset-1 dark:ring-offset-gray-900"
                              )}
                            >
                              {displayStatus ? attendanceBadge(displayStatus)!.label : <EmptyCell label={t("fill")} colorClass="text-gray-400" />}
                              {pendingAttendance[student.id] !== undefined && (
                                <span className="absolute top-1 end-1 w-1.5 h-1.5 rounded-full bg-tahfidz-gold" />
                              )}
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </td>

                      {/* Hifz */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openLog(student, "HIFZ")}
                          className={cn(
                            "w-full text-start px-2 py-2 rounded-lg text-xs border transition min-h-[40px]",
                            log?.hifzFromSurahId
                              ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.hifzFromSurahId
                            ? verseRange(findSurah(log.hifzFromSurahId), log.hifzFromVerse, findSurah(log.hifzToSurahId), log.hifzToVerse, L)
                            : student.lastLogs.hifz
                              ? (() => {
                                  const text = verseRange(findSurah(student.lastLogs.hifz.hifzFromSurahId), student.lastLogs.hifz.hifzFromVerse, findSurah(student.lastLogs.hifz.hifzToSurahId), student.lastLogs.hifz.hifzToVerse, L)
                                  return <span className="text-emerald-700/50 dark:text-emerald-300/50 truncate" title={`${t("last")}: ${text}`}>{text}</span>
                                })()
                              : <EmptyCell label={t("fill")} colorClass="text-emerald-400/70 dark:text-emerald-500/60" />}
                        </button>
                      </td>

                      {/* Muraja */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openLog(student, "MURAJA")}
                          className={cn(
                            "w-full text-start px-2 py-2 rounded-lg text-xs border transition min-h-[40px]",
                            log?.murajaFromSurahId
                              ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.murajaFromSurahId
                            ? verseRange(findSurah(log.murajaFromSurahId), log.murajaFromVerse, findSurah(log.murajaToSurahId), log.murajaToVerse, L)
                            : student.lastLogs.muraja
                              ? (() => {
                                  const text = verseRange(findSurah(student.lastLogs.muraja.murajaFromSurahId), student.lastLogs.muraja.murajaFromVerse, findSurah(student.lastLogs.muraja.murajaToSurahId), student.lastLogs.muraja.murajaToVerse, L)
                                  return <span className="text-blue-700/50 dark:text-blue-300/50 truncate" title={`${t("last")}: ${text}`}>{text}</span>
                                })()
                              : <EmptyCell label={t("fill")} colorClass="text-blue-400/70 dark:text-blue-500/60" />}
                        </button>
                      </td>

                      {/* Talqin */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openLog(student, "TALQIN")}
                          className={cn(
                            "w-full text-start px-2 py-2 rounded-lg text-xs border transition min-h-[40px]",
                            log?.talqinFromSurahId
                              ? "bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800 text-purple-800 dark:text-purple-200"
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.talqinFromSurahId
                            ? verseRange(findSurah(log.talqinFromSurahId), log.talqinFromVerse, findSurah(log.talqinToSurahId), log.talqinToVerse, L)
                            : student.lastLogs.talqin
                              ? (() => {
                                  const text = verseRange(findSurah(student.lastLogs.talqin.talqinFromSurahId), student.lastLogs.talqin.talqinFromVerse, findSurah(student.lastLogs.talqin.talqinToSurahId), student.lastLogs.talqin.talqinToVerse, L)
                                  return <span className="text-purple-700/50 dark:text-purple-300/50 truncate" title={`${t("last")}: ${text}`}>{text}</span>
                                })()
                              : <EmptyCell label={t("fill")} colorClass="text-purple-400/70 dark:text-purple-500/60" />}
                        </button>
                      </td>

                      {/* Cours */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openLog(student, "COURSE")}
                          className={cn(
                            "w-full text-start px-2 py-2 rounded-lg text-xs border transition min-h-[40px]",
                            log?.courseBook
                              ? "bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800 text-amber-800 dark:text-amber-200"
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.courseBook
                            ? `${log.courseBook}${log.courseFromPage ? ` ${log.courseFromPage}${log.courseToPage && log.courseToPage !== log.courseFromPage ? `→${log.courseToPage}` : ""}` : ""}`
                            : student.lastLogs.course
                              ? (() => {
                                  const last = student.lastLogs.course
                                  const text = `${last.courseBook}${last.courseFromPage ? ` ${last.courseFromPage}${last.courseToPage && last.courseToPage !== last.courseFromPage ? `→${last.courseToPage}` : ""}` : ""}`
                                  return <span className="text-amber-700/50 dark:text-amber-300/50 truncate" title={`${t("last")}: ${text}`}>{text}</span>
                                })()
                              : <EmptyCell label={t("fill")} colorClass="text-amber-400/70 dark:text-amber-500/60" />}
                        </button>
                      </td>

                      {/* Note globale - saisie directe */}
                      <td className="px-3 py-2">
                        {editingScore[student.id] ? (
                          <div className="relative">
                            <input
                              type="number"
                              min={0}
                              max={20}
                              autoFocus
                              value={scoreDraft[student.id] ?? ""}
                              onChange={(e) => setScoreDraft((d) => ({ ...d, [student.id]: e.target.value }))}
                              onBlur={() => saveGlobalScore(student, scoreDraft[student.id] ?? "")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveGlobalScore(student, scoreDraft[student.id] ?? "")
                                if (e.key === "Escape") {
                                  setEditingScore((s) => ({ ...s, [student.id]: false }))
                                  setScoreDraft((d) => ({ ...d, [student.id]: "" }))
                                }
                              }}
                              className="w-full px-2 py-2 rounded-lg border border-tahfidz-green dark:border-tahfidz-green/50 bg-white dark:bg-gray-800 text-center text-xs font-bold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 min-h-[40px]"
                            />
                            {savingScore[student.id] && (
                              <Loader2 size={12} className="absolute right-2 top-1/2 -translate-y-1/2 animate-spin text-tahfidz-green" />
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingScore((s) => ({ ...s, [student.id]: true }))
                              setScoreDraft((d) => ({ ...d, [student.id]: log?.globalScore?.toString() ?? "" }))
                            }}
                            className={cn(
                              "w-full text-center px-2 py-2 rounded-lg text-xs font-bold border transition min-h-[40px]",
                              log?.globalScore !== null && log?.globalScore !== undefined
                                ? "bg-tahfidz-green/10 border-tahfidz-green/20 text-tahfidz-green"
                                : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            {log?.globalScore !== null && log?.globalScore !== undefined ? `${log.globalScore}/20` : <EmptyCell label={t("fill")} colorClass="text-tahfidz-green/60" />}
                          </button>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openLog(student, "FULL")}
                            title={t("openLog")}
                            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium bg-tahfidz-green text-white rounded-lg hover:bg-tahfidz-green/90 transition"
                          >
                            <FileText size={14} />
                            <span className="hidden sm:inline">{t("openLog")}</span>
                          </button>
                          {student.readyForEvaluation && (
                            <Link
                              href={`/teacher/evaluation/new?studentId=${student.id}${student.activeProgress ? `&progressId=${student.activeProgress.id}` : ""}`}
                              title={t("evaluate")}
                              className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium bg-tahfidz-gold text-white rounded-lg hover:bg-tahfidz-gold/90 transition"
                            >
                              <Award size={14} />
                              <span className="hidden sm:inline">{t("evaluate")}</span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Barre d'actions en bas du tableau */}
          <AnimatePresence>
            {Object.keys(pendingAttendance).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-gray-800 dark:text-gray-100">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tahfidz-gold opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-tahfidz-gold" />
                    </span>
                    <span className="font-medium">
                      {t("pendingAttendances").replace("{count}", String(Object.keys(pendingAttendance).length))}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={validateAllAttendances}
                      disabled={validatingAll}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-tahfidz-gold text-gray-900 hover:bg-tahfidz-gold-dark rounded-lg transition disabled:opacity-60"
                    >
                      {validatingAll ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                      {t("validateAllAttendances")}
                    </button>
                    <button
                      onClick={() => setPendingAttendance({})}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      {t("cancel")}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </>
        )}
      </div>

      {modal.open && modal.student && (
        <TeacherDailyLogModal
          studentId={modal.student.id}
          studentName={L === "ar" && modal.student.user.fullNameAr ? modal.student.user.fullNameAr : modal.student.user.fullName}
          date={date}
          defaultSection={modal.section}
          singleSection={modal.section !== "FULL"}
          lastLog={lastLogForModal(modal.student, modal.section)}
          memorizationAssignments={modal.student.memorizationAssignments}
          onClose={() => setModal({ open: false, student: null, section: "HIFZ" })}
          onSaved={loadData}
        />
      )}

      {bulkModal.open && (
        <TeacherBulkFillModal
          section={bulkModal.section}
          date={date}
          groupId={groupId}
          surahs={surahs}
          onClose={() => setBulkModal({ open: false, section: "ATTENDANCE" })}
          onApplied={() => {
            setBulkModal({ open: false, section: "ATTENDANCE" })
            setPendingAttendance({})
            loadData()
          }}
        />
      )}

    </div>
  )
}
