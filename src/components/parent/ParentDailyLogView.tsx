"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { Loader2, BookOpen, RotateCcw, Headphones, GraduationCap, CalendarDays, MessageSquare, Save, CheckCircle2 } from "lucide-react"
import DailyLogSectionThread from "@/components/DailyLogSectionThread"
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

export default function ParentDailyLogView({ childId }: { childId: string }) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentDailyLog")

  const [logs, setLogs] = useState<Log[]>([])
  const [surahs, setSurahs] = useState<SurahMap>({})
  const [loading, setLoading] = useState(true)
  const [editObservation, setEditObservation] = useState<string | null>(null)
  const [obsText, setObsText] = useState("")
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logsRes, surahsRes] = await Promise.all([
        fetch(`/api/students/${childId}/daily-log?recent=true`),
        fetch("/api/surahs"),
      ])
      const logsData = await logsRes.json()
      const surahsData = await surahsRes.json()
      setLogs(logsData.logs || [])
      const map: SurahMap = {}
      ;(surahsData.surahs || []).forEach((s: any) => {
        map[s.id] = { nameAr: s.nameAr, nameFr: s.nameFr }
      })
      setSurahs(map)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  const saveObservation = async (log: Log) => {
    setSaving(true)
    try {
      await fetch(`/api/students/${childId}/daily-log`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: log.date.split("T")[0], parentObservation: obsText }),
      })
      setEditObservation(null)
      load()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarDays size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm text-gray-400">{t("noLogs")}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <div key={log.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header jour */}
          <div className="px-4 py-3 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-emerald-600" />
              <span className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                {formatDate(log.date, L)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {log.globalScore !== null && (
                <span className="text-xs font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border">
                  {log.globalScore}/20
                </span>
              )}
              <AttendanceBadge status={log.attendanceStatus} />
            </div>
          </div>

          <div className="p-4 space-y-3">
            {/* Hifz + Muraja + Talqin grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(log.hifzFromSurahId || log.hifzNote) && (
                <SectionCard icon={BookOpen} title={t("hifz")} color="text-emerald-600">
                  <VerseRange
                    fromSurah={log.hifzFromSurahId} fromVerse={log.hifzFromVerse}
                    toSurah={log.hifzToSurahId} toVerse={log.hifzToVerse}
                    surahs={surahs} note={log.hifzNote}
                  />
                  <DailyLogSectionThread studentId={childId} dailyLogId={log.id} section="HIFZ" sectionLabel={t("hifz")} />
                </SectionCard>
              )}
              {(log.murajaFromSurahId || log.murajaNote) && (
                <SectionCard icon={RotateCcw} title={t("muraja")} color="text-blue-600">
                  <VerseRange
                    fromSurah={log.murajaFromSurahId} fromVerse={log.murajaFromVerse}
                    toSurah={log.murajaToSurahId} toVerse={log.murajaToVerse}
                    surahs={surahs} note={log.murajaNote}
                  />
                  <DailyLogSectionThread studentId={childId} dailyLogId={log.id} section="MURAJA" sectionLabel={t("muraja")} />
                </SectionCard>
              )}
              {(log.talqinFromSurahId || log.talqinNote) && (
                <SectionCard icon={Headphones} title={t("talqin")} color="text-purple-600">
                  <VerseRange
                    fromSurah={log.talqinFromSurahId} fromVerse={log.talqinFromVerse}
                    toSurah={log.talqinToSurahId} toVerse={log.talqinToVerse}
                    surahs={surahs} note={log.talqinNote}
                  />
                  <DailyLogSectionThread studentId={childId} dailyLogId={log.id} section="TALQIN" sectionLabel={t("talqin")} />
                </SectionCard>
              )}
            </div>

            {/* Cours scientifique */}
            {(log.courseBook || log.courseFromPage || log.courseNote) && (
              <SectionCard icon={GraduationCap} title={t("course")} color="text-amber-600">
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  {log.courseBook && <span className="font-medium text-gray-700 dark:text-gray-200">{log.courseBook}</span>}
                  {log.courseFromPage && (
                    <>
                      <span className="text-gray-400">·</span>
                      <span className="text-xs">p. {log.courseFromPage}{log.courseToPage ? ` → ${log.courseToPage}` : ""}</span>
                    </>
                  )}
                </div>
                {log.courseNote && <p className="text-xs text-gray-500 mt-1 italic">{log.courseNote}</p>}
              </SectionCard>
            )}

            {/* Observations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {log.teacherObservation && (
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1">{t("teacherObs")}</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200">{log.teacherObservation}</p>
                </div>
              )}
              <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 border border-orange-100 dark:border-orange-800">
                <p className="text-xs font-bold text-orange-700 dark:text-orange-300 mb-1">{t("parentObs")}</p>
                {editObservation === log.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={obsText}
                      onChange={(e) => setObsText(e.target.value)}
                      className="w-full px-2 py-1.5 rounded border border-orange-200 dark:border-orange-700 bg-white dark:bg-gray-800 text-xs"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveObservation(log)}
                        disabled={saving}
                        className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 disabled:opacity-50"
                      >
                        {saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                        {t("save")}
                      </button>
                      <button
                        onClick={() => setEditObservation(null)}
                        className="px-2 py-1 border border-orange-200 text-orange-700 text-xs rounded"
                      >
                        {t("cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {log.parentObservation ? (
                      <p className="text-xs text-orange-800 dark:text-orange-200">{log.parentObservation}</p>
                    ) : (
                      <p className="text-xs text-orange-400 italic">{t("noParentObs")}</p>
                    )}
                    <button
                      onClick={() => {
                        setEditObservation(log.id)
                        setObsText(log.parentObservation || "")
                      }}
                      className="mt-1.5 flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700"
                    >
                      <MessageSquare size={10} /> {log.parentObservation ? t("edit") : t("add")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
