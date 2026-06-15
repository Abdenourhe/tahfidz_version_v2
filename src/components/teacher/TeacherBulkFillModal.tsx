"use client"
// src/components/teacher/TeacherBulkFillModal.tsx

import { useState, useMemo, useEffect } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { X, Loader2, CheckCircle2, CalendarDays, BookOpen, RotateCcw, Headphones, GraduationCap, Star } from "lucide-react"
import { cn } from "@/lib/utils"

interface Surah {
  id: number
  nameAr: string
  nameFr: string
  verseCount: number
}

type BulkSection = "ATTENDANCE" | "HIFZ" | "MURAJA" | "TALQIN" | "COURSE" | "GLOBAL_SCORE"

interface Props {
  section: BulkSection
  date: string
  groupId: string
  surahs: Surah[]
  onClose: () => void
  onApplied: () => void
}

const SECTION_META: Record<BulkSection, { icon: React.ElementType; labelKey: string; color: string }> = {
  ATTENDANCE: { icon: CalendarDays, labelKey: "attendanceTitle", color: "text-red-600" },
  HIFZ:       { icon: BookOpen,    labelKey: "hifzTitle",       color: "text-emerald-600" },
  MURAJA:     { icon: RotateCcw,   labelKey: "murajaTitle",     color: "text-blue-600" },
  TALQIN:     { icon: Headphones,  labelKey: "talqinTitle",     color: "text-purple-600" },
  COURSE:     { icon: GraduationCap, labelKey: "courseTitle",   color: "text-amber-600" },
  GLOBAL_SCORE: { icon: Star,      labelKey: "globalScoreTitle", color: "text-gray-700 dark:text-gray-200" },
}

function SurahSelect({ value, onChange, label, surahs, locale }: { value: string; onChange: (v: string) => void; label: string; surahs: Surah[]; locale: string }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20"
      >
        <option value="">—</option>
        {surahs.map((s) => (
          <option key={s.id} value={s.id}>
            {locale === "ar" ? s.nameAr : s.nameFr}
          </option>
        ))}
      </select>
    </div>
  )
}

function VerseInput({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20"
      />
    </div>
  )
}

export function TeacherBulkFillModal({ section, date, groupId, surahs: initialSurahs, onClose, onApplied }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherBulkFill")
  const meta = SECTION_META[section]
  const SectionIcon = meta.icon

  const [saving, setSaving] = useState(false)

  // Formulaires par section
  const [attendanceStatus, setAttendanceStatus] = useState<"PRESENT" | "ABSENT" | "LATE" | "EXCUSED">("PRESENT")

  const [hifz, setHifz] = useState({ fromSurah: "", fromVerse: "", toSurah: "", toVerse: "" })
  const [muraja, setMuraja] = useState({ fromSurah: "", fromVerse: "", toSurah: "", toVerse: "" })
  const [talqin, setTalqin] = useState({ fromSurah: "", fromVerse: "", toSurah: "", toVerse: "" })
  const [course, setCourse] = useState({ book: "", fromPage: "", toPage: "" })
  const [globalScore, setGlobalScore] = useState("")

  const [allSurahs, setAllSurahs] = useState<Surah[]>(initialSurahs)
  const [note, setNote] = useState("")

  useEffect(() => {
    fetch("/api/surahs")
      .then((r) => r.json())
      .then((d) => { if (d.surahs?.length) setAllSurahs(d.surahs) })
      .catch(() => {})
  }, [])

  const attendanceOptions: { value: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"; label: string; classes: string }[] = useMemo(
    () => [
      { value: "PRESENT", label: t("present"), classes: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
      { value: "LATE",    label: t("late"),    classes: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
      { value: "EXCUSED", label: t("excused"), classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
      { value: "ABSENT",  label: t("absent"),  classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    ],
    [t]
  )

  const buildPayload = () => {
    switch (section) {
      case "ATTENDANCE":
        return { attendanceStatus }
      case "HIFZ":
        return {
          hifzFromSurahId: hifz.fromSurah ? parseInt(hifz.fromSurah) : null,
          hifzFromVerse: hifz.fromVerse ? parseInt(hifz.fromVerse) : null,
          hifzToSurahId: hifz.toSurah ? parseInt(hifz.toSurah) : null,
          hifzToVerse: hifz.toVerse ? parseInt(hifz.toVerse) : null,
        }
      case "MURAJA":
        return {
          murajaFromSurahId: muraja.fromSurah ? parseInt(muraja.fromSurah) : null,
          murajaFromVerse: muraja.fromVerse ? parseInt(muraja.fromVerse) : null,
          murajaToSurahId: muraja.toSurah ? parseInt(muraja.toSurah) : null,
          murajaToVerse: muraja.toVerse ? parseInt(muraja.toVerse) : null,
        }
      case "TALQIN":
        return {
          talqinFromSurahId: talqin.fromSurah ? parseInt(talqin.fromSurah) : null,
          talqinFromVerse: talqin.fromVerse ? parseInt(talqin.fromVerse) : null,
          talqinToSurahId: talqin.toSurah ? parseInt(talqin.toSurah) : null,
          talqinToVerse: talqin.toVerse ? parseInt(talqin.toVerse) : null,
        }
      case "COURSE":
        return {
          courseBook: course.book || null,
          courseFromPage: course.fromPage ? parseInt(course.fromPage) : null,
          courseToPage: course.toPage ? parseInt(course.toPage) : null,
        }
      case "GLOBAL_SCORE":
        return { globalScore: globalScore ? parseInt(globalScore) : null }
      default:
        return {}
    }
  }

  const isValid = () => {
    if (section === "GLOBAL_SCORE") {
      const n = globalScore === "" ? null : parseInt(globalScore)
      return n === null || (n >= 0 && n <= 20)
    }
    return true
  }

  const handleApply = async () => {
    if (!isValid()) {
      alert(t("scoreRange"))
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/teacher/students/bulk-fill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          section,
          groupId,
          value: buildPayload(),
          note,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onApplied()
    } catch (e) {
      console.error(e)
      alert(t("error"))
    } finally {
      setSaving(false)
    }
  }

  const renderForm = () => {
    switch (section) {
      case "ATTENDANCE":
        return (
          <div className="grid grid-cols-2 gap-2">
            {attendanceOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAttendanceStatus(opt.value)}
                className={cn(
                  "px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2",
                  opt.classes,
                  attendanceStatus === opt.value ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-900" : "opacity-80 hover:opacity-100"
                )}
              >
                {attendanceStatus === opt.value && <CheckCircle2 size={14} />}
                {opt.label}
              </button>
            ))}
          </div>
        )
      case "HIFZ":
      case "MURAJA":
      case "TALQIN":
        {
          const state = section === "HIFZ" ? hifz : section === "MURAJA" ? muraja : talqin
          const setState = section === "HIFZ" ? setHifz : section === "MURAJA" ? setMuraja : setTalqin
          return (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <SurahSelect label={t("fromSurah")} value={state.fromSurah} onChange={(v) => setState((s) => ({ ...s, fromSurah: v }))} surahs={allSurahs} locale={L} />
                <VerseInput label={t("fromVerse")} value={state.fromVerse} onChange={(v) => setState((s) => ({ ...s, fromVerse: v }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SurahSelect label={t("toSurah")} value={state.toSurah} onChange={(v) => setState((s) => ({ ...s, toSurah: v }))} surahs={allSurahs} locale={L} />
                <VerseInput label={t("toVerse")} value={state.toVerse} onChange={(v) => setState((s) => ({ ...s, toVerse: v }))} />
              </div>
            </div>
          )
        }
      case "COURSE":
        return (
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{t("book")}</label>
              <input
                type="text"
                value={course.book}
                onChange={(e) => setCourse((c) => ({ ...c, book: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <VerseInput label={t("fromPage")} value={course.fromPage} onChange={(v) => setCourse((c) => ({ ...c, fromPage: v }))} />
              <VerseInput label={t("toPage")} value={course.toPage} onChange={(v) => setCourse((c) => ({ ...c, toPage: v }))} />
            </div>
          </div>
        )
      case "GLOBAL_SCORE":
        return (
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{t("globalScore")}</label>
            <input
              type="number"
              min={0}
              max={20}
              value={globalScore}
              onChange={(e) => setGlobalScore(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20"
            />
            <p className="text-[10px] text-gray-400 mt-1">{t("scoreHint")}</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <SectionIcon size={18} className={meta.color} />
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{t("title")} — {t(meta.labelKey)}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">{t("description")}</p>
          {!groupId && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 text-xs text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
              <span className="font-bold">⚠</span>
              {t("selectGroup")}
            </div>
          )}
          {renderForm()}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1">{t("note")}</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green/20 resize-none"
              placeholder={t("notePlaceholder")}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleApply}
            disabled={saving || !isValid() || !groupId}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-tahfidz-green text-white hover:bg-tahfidz-green-dark transition disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            {saving ? t("applying") : t("apply")}
          </button>
        </div>
      </div>
    </div>
  )
}
