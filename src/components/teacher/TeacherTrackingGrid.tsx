"use client"
// src/components/teacher/TeacherTrackingGrid.tsx

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  BookOpen, RotateCcw, Headphones, GraduationCap, CalendarDays, Star,
  ChevronLeft, ChevronRight, Loader2, Users, Filter, ClipboardList,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { TeacherDailyLogModal } from "@/components/teacher/TeacherDailyLogModal"

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED" | null

type SectionKey = "ATTENDANCE" | "HIFZ" | "MURAJA" | "TALQIN" | "COURSE"

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

interface StudentRow {
  id: string
  user: { id: string; fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { id: string; name: string; nameAr: string | null } | null
  dailyLog: DailyLog | null
  activeProgress: ActiveProgress | null
  readyForEvaluation: boolean
}

interface Group {
  id: string
  name: string
  nameAr: string | null
}

interface Props {
  initialGroups: Group[]
}

const SECTIONS: { key: SectionKey; icon: React.ElementType; color: string; bg: string; lightColor: string }[] = [
  { key: "ATTENDANCE", icon: CalendarDays, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10", lightColor: "text-red-500" },
  { key: "HIFZ", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/10", lightColor: "text-emerald-500" },
  { key: "MURAJA", icon: RotateCcw, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10", lightColor: "text-blue-500" },
  { key: "TALQIN", icon: Headphones, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10", lightColor: "text-purple-500" },
  { key: "COURSE", icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/10", lightColor: "text-amber-500" },
]

const ATTENDANCE_CYCLE: AttendanceStatus[] = [null, "PRESENT", "ABSENT", "LATE", "EXCUSED", "PRESENT"]

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

export function TeacherTrackingGrid({ initialGroups }: Props) {
  const { locale, dir } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherTracking")
  const router = useRouter()
  const searchParams = useSearchParams()

  const today = useMemo(() => formatDateInput(new Date()), [])
  const urlDate = searchParams.get("date")
  const urlGroup = searchParams.get("groupId") || ""

  const [date, setDate] = useState(urlDate || today)
  const [groupId, setGroupId] = useState(urlGroup)
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<StudentRow[]>([])
  const [onlyEmpty, setOnlyEmpty] = useState(false)
  const [surahs, setSurahs] = useState<Surah[]>([])

  const [modal, setModal] = useState<{ open: boolean; student: StudentRow | null; section: SectionKey | "GLOBAL" }>({
    open: false,
    student: null,
    section: "HIFZ",
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/teacher/tracking?date=${date}${groupId ? `&groupId=${groupId}` : ""}`)
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

  const updateUrl = (newDate: string, newGroup: string) => {
    const params = new URLSearchParams()
    if (newDate && newDate !== today) params.set("date", newDate)
    if (newGroup) params.set("groupId", newGroup)
    const qs = params.toString()
    router.replace(`/teacher/tracking${qs ? `?${qs}` : ""}`, { scroll: false })
  }

  const handleDateChange = (d: string) => {
    setDate(d)
    updateUrl(d, groupId)
  }

  const handleGroupChange = (g: string) => {
    setGroupId(g)
    updateUrl(date, g)
  }

  const shiftDate = (days: number) => {
    const d = new Date(date + "T00:00:00Z")
    d.setUTCDate(d.getUTCDate() + days)
    const s = formatDateInput(d)
    handleDateChange(s)
  }

  const openLog = (student: StudentRow, section: SectionKey | "GLOBAL") => {
    setModal({ open: true, student, section })
  }

  const cycleAttendance = async (student: StudentRow) => {
    const current = student.dailyLog?.attendanceStatus ?? null
    const nextIndex = (ATTENDANCE_CYCLE.indexOf(current) + 1) % ATTENDANCE_CYCLE.length
    const next = ATTENDANCE_CYCLE[nextIndex]

    try {
      const promises: Promise<Response>[] = []

      // Met à jour le carnet quotidien
      const logBody: any = { date, attendanceStatus: next }
      const logMethod = student.dailyLog ? "PATCH" : "POST"
      promises.push(
        fetch(`/api/students/${student.id}/daily-log`, {
          method: logMethod,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logBody),
        })
      )

      // Synchronise avec l'onglet Présences si l'élève a un groupe
      if (next && student.group?.id) {
        promises.push(
          fetch("/api/attendance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              groupId: student.group.id,
              date: `${date}T00:00:00.000Z`,
              records: [{ studentId: student.id, status: next, notes: "" }],
            }),
          })
        )
      }

      const results = await Promise.all(promises)
      if (results.some((r) => !r.ok)) throw new Error("Erreur")
      loadData()
    } catch (e) {
      console.error(e)
      alert(t("error"))
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

  const displayRows = onlyEmpty
    ? rows.filter((r) => !r.dailyLog || (!r.dailyLog.attendanceStatus && !r.dailyLog.hifzFromSurahId && !r.dailyLog.globalScore))
    : rows

  const findSurah = (id?: number | null) => surahs.find((s) => s.id === id)

  const isRtl = dir === "rtl"
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

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
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          />
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <NextIcon size={16} />
          </button>

          <select
            value={groupId}
            onChange={(e) => handleGroupChange(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
          >
            <option value="">{t("allGroups")}</option>
            {initialGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {L === "ar" && g.nameAr ? g.nameAr : g.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setOnlyEmpty((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition",
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

      {/* Résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="p-2 bg-tahfidz-green/10 rounded-lg"><Users size={18} className="text-tahfidz-green" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{rows.length}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("students")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg"><ClipboardList size={18} className="text-emerald-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.dailyLog?.attendanceStatus).length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("filledToday")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg"><CalendarDays size={18} className="text-red-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.dailyLog?.attendanceStatus === "ABSENT").length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("absents")}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"><Star size={18} className="text-yellow-600" /></div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {rows.filter((r) => r.readyForEvaluation).length}
            </p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">{t("readyToEvaluate")}</p>
          </div>
        </div>
      </div>

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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/60 border-b border-gray-100 dark:border-gray-800">
                  <th className="sticky start-0 z-10 bg-gray-50 dark:bg-gray-800/60 text-start px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[200px]">
                    {t("student")}
                  </th>
                  {SECTIONS.map((sec) => (
                    <th key={sec.key} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[140px]">
                      <div className="flex items-center gap-1.5">
                        <sec.icon size={14} className={sec.lightColor} />
                        {t(sec.key.toLowerCase())}
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[80px]">
                    {t("global")}
                  </th>
                  <th className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider min-w-[100px]">
                    {t("actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {displayRows.map((student) => {
                  const log = student.dailyLog
                  return (
                    <tr key={student.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition">
                      {/* Élève */}
                      <td className="sticky start-0 z-10 bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/30 px-4 py-3">
                        <Link
                          href={`/teacher/students/${student.id}`}
                          className="flex items-center gap-3 group/row rounded-lg transition"
                        >
                          <div className="w-9 h-9 rounded-lg gradient-tahfidz flex items-center justify-center overflow-hidden flex-shrink-0">
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
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover/row:text-tahfidz-green transition">
                              {L === "ar" && student.user.fullNameAr ? student.user.fullNameAr : student.user.fullName}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {student.group ? (L === "ar" && student.group.nameAr ? student.group.nameAr : student.group.name) : t("noGroup")}
                            </p>
                          </div>
                        </Link>
                      </td>

                      {/* Assiduité - clic rapide */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => cycleAttendance(student)}
                          className={cn(
                            "w-full text-center px-2 py-2 rounded-lg text-xs font-medium border transition min-h-[40px] flex items-center justify-center",
                            log?.attendanceStatus
                              ? attendanceBadge(log.attendanceStatus)!.classes
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.attendanceStatus ? attendanceBadge(log.attendanceStatus)!.label : t("fill")}
                        </button>
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
                            : t("fill")}
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
                            : t("fill")}
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
                            : t("fill")}
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
                            : t("fill")}
                        </button>
                      </td>

                      {/* Note globale */}
                      <td className="px-3 py-2">
                        <button
                          onClick={() => openLog(student, "GLOBAL")}
                          className={cn(
                            "w-full text-center px-2 py-2 rounded-lg text-xs font-bold border transition min-h-[40px]",
                            log?.globalScore !== null && log?.globalScore !== undefined
                              ? "bg-tahfidz-green/10 border-tahfidz-green/20 text-tahfidz-green"
                              : "border-dashed border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                          )}
                        >
                          {log?.globalScore !== null && log?.globalScore !== undefined ? `${log.globalScore}/20` : "—"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openLog(student, "GLOBAL")}
                            className="flex-1 px-2 py-2 text-[10px] font-medium bg-tahfidz-green text-white rounded-lg hover:bg-tahfidz-green/90 transition"
                          >
                            {t("openLog")}
                          </button>
                          {student.readyForEvaluation && (
                            <Link
                              href={`/teacher/evaluation/new?studentId=${student.id}${student.activeProgress ? `&progressId=${student.activeProgress.id}` : ""}`}
                              className="px-2 py-2 text-[10px] font-medium bg-tahfidz-gold text-white rounded-lg hover:bg-tahfidz-gold/90 transition"
                            >
                              {t("evaluate")}
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
        )}
      </div>

      {modal.open && modal.student && (
        <TeacherDailyLogModal
          studentId={modal.student.id}
          studentName={L === "ar" && modal.student.user.fullNameAr ? modal.student.user.fullNameAr : modal.student.user.fullName}
          date={date}
          defaultSection={modal.section}
          singleSection={modal.section !== "GLOBAL"}
          onClose={() => setModal({ open: false, student: null, section: "HIFZ" })}
          onSaved={loadData}
        />
      )}
    </div>
  )
}
