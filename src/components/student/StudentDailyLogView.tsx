"use client"
import { useState, useEffect, useCallback } from "react"
import { useT } from "@/contexts/LanguageContext"
import { Loader2, BookOpen, RotateCcw, Headphones, GraduationCap, CalendarDays } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface SurahMap {
  [id: number]: { nameAr: string; nameFr: string }
}

interface Log {
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
  attendanceStatus: string | null
  teacherObservation: string | null
  parentObservation: string | null
  globalScore: number | null
  createdBy: { fullName: string }
}

function SectionCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
      <div className={`flex items-center gap-1.5 text-xs font-bold mb-2 ${color}`}>
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  )
}

function VerseRange({
  fromSurah, fromVerse, toSurah, toVerse, surahs, note,
}: {
  fromSurah: number | null
  fromVerse: number | null
  toSurah: number | null
  toVerse: number | null
  surahs: SurahMap
  note: string | null
}) {
  const fromName = fromSurah ? (surahs[fromSurah]?.nameFr || "—") : "—"
  const toName = toSurah ? (surahs[toSurah]?.nameFr || "—") : "—"
  const same = fromSurah && toSurah && fromSurah === toSurah

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-gray-700 dark:text-gray-200">{fromName}</span>
        {fromVerse && <span className="text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border">{fromVerse}</span>}
        <span className="text-gray-400">→</span>
        {!same && <span className="font-medium text-gray-700 dark:text-gray-200">{toName}</span>}
        {toVerse && <span className="text-xs bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border">{toVerse}</span>}
      </div>
      {note && <p className="text-xs text-gray-500 italic">{note}</p>}
    </div>
  )
}

function AttendanceBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-xs text-gray-400">—</span>
  const map: Record<string, { label: string; cls: string }> = {
    PRESENT: { label: "Présent", cls: "bg-green-100 text-green-700 border-green-200" },
    ABSENT: { label: "Absent", cls: "bg-red-100 text-red-700 border-red-200" },
    LATE: { label: "Retard", cls: "bg-orange-100 text-orange-700 border-orange-200" },
    EXCUSED: { label: "Excusé", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  }
  const cfg = map[status] || { label: status, cls: "bg-gray-100 text-gray-600" }
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
}

export default function StudentDailyLogView({ studentId }: { studentId: string }) {
  const t = useT("studentDailyLog")

  const [logs, setLogs] = useState<Log[]>([])
  const [surahs, setSurahs] = useState<SurahMap>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, surahsRes] = await Promise.all([
        fetch(`/api/students/${studentId}/daily-log?recent=true`),
        fetch("/api/surahs"),
      ])
      const logsData = await logsRes.json()
      const surahsData = await surahsRes.json()
      setLogs(logsData.logs || [])
      const map: SurahMap = {}
      ;(surahsData.surahs || []).forEach((s: any) => { map[s.id] = { nameAr: s.nameAr, nameFr: s.nameFr } })
      setSurahs(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center">
        <CalendarDays size={32} className="mx-auto mb-2 text-gray-300" />
        <p className="text-gray-400 text-sm">{t("noLogs")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={16} className="text-tahfidz-green" />
              <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">
                {formatDate(log.date, { day: "2-digit", month: "long", year: "numeric" })}
              </span>
            </div>
            <AttendanceBadge status={log.attendanceStatus} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SectionCard icon={BookOpen} title={t("hifz")} color="text-tahfidz-green">
              <VerseRange fromSurah={log.hifzFromSurahId} fromVerse={log.hifzFromVerse} toSurah={log.hifzToSurahId} toVerse={log.hifzToVerse} surahs={surahs} note={log.hifzNote} />
            </SectionCard>
            <SectionCard icon={RotateCcw} title={t("muraja")} color="text-tahfidz-gold">
              <VerseRange fromSurah={log.murajaFromSurahId} fromVerse={log.murajaFromVerse} toSurah={log.murajaToSurahId} toVerse={log.murajaToVerse} surahs={surahs} note={log.murajaNote} />
            </SectionCard>
            <SectionCard icon={Headphones} title={t("talqin")} color="text-blue-600">
              <VerseRange fromSurah={log.talqinFromSurahId} fromVerse={log.talqinFromVerse} toSurah={log.talqinToSurahId} toVerse={log.talqinToVerse} surahs={surahs} note={log.talqinNote} />
            </SectionCard>
            <SectionCard icon={GraduationCap} title={t("course")} color="text-purple-600">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{log.courseBook || "—"}</p>
                {(log.courseFromPage || log.courseToPage) && (
                  <p className="text-xs text-gray-500">{t("pages")}: {log.courseFromPage || "?"} → {log.courseToPage || "?"}</p>
                )}
                {log.courseNote && <p className="text-xs text-gray-500 italic">{log.courseNote}</p>}
              </div>
            </SectionCard>
          </div>

          {log.globalScore !== null && (
            <div className="flex items-center gap-2 p-2 bg-tahfidz-green-light/20 rounded-lg">
              <span className="text-xs font-bold text-tahfidz-green">{t("globalScore")}: {log.globalScore}/20</span>
            </div>
          )}

          {log.teacherObservation && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs font-semibold text-gray-500 mb-1">{t("teacherObservation")}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{log.teacherObservation}</p>
            </div>
          )}

          {log.parentObservation && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-600 mb-1">{t("parentObservation")}</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{log.parentObservation}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
