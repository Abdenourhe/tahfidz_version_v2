"use client"
import { useState, useEffect } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { X, BookOpen, RotateCcw, Headphones, GraduationCap, CalendarDays, Save, Loader2, CheckCircle2 } from "lucide-react"
import DailyLogSectionThread from "@/components/DailyLogSectionThread"

interface Surah {
  id: number
  nameAr: string
  nameFr: string
  verseCount: number
}

interface Props {
  studentId: string
  studentName: string
  date?: string
  onClose: () => void
  onSaved?: () => void
}

function SurahSelect({ value, onChange, label, surahs, locale }: { value: string; onChange: (v: string) => void; label: string; surahs: Surah[]; locale: string }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
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
      <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        min={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
    </div>
  )
}

function Section({
  icon: Icon, title, color, children,
}: {
  icon: React.ElementType
  title: string
  color: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className={`px-4 py-2.5 flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${color} bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700`}>
        <Icon size={14} />
        {title}
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </div>
  )
}

export function TeacherDailyLogModal({ studentId, studentName, date: initialDate, onClose, onSaved }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherDailyLog")

  const [surahs, setSurahs] = useState<Surah[]>([])
  const [loadingSurahs, setLoadingSurahs] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const today = new Date().toISOString().split("T")[0]
  const [date, setDate] = useState(initialDate || today)

  const [form, setForm] = useState({
    hifzFromSurahId: "", hifzFromVerse: "", hifzToSurahId: "", hifzToVerse: "", hifzNote: "",
    murajaFromSurahId: "", murajaFromVerse: "", murajaToSurahId: "", murajaToVerse: "", murajaNote: "",
    talqinFromSurahId: "", talqinFromVerse: "", talqinToSurahId: "", talqinToVerse: "", talqinNote: "",
    courseBook: "", courseFromPage: "", courseToPage: "", courseNote: "",
    attendanceStatus: "PRESENT", teacherObservation: "", globalScore: "",
  })
  const [existingLogId, setExistingLogId] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/surahs")
      .then((r) => r.json())
      .then((d) => { setSurahs(d.surahs || []); setLoadingSurahs(false) })
      .catch(() => setLoadingSurahs(false))
  }, [])

  // Load existing log if any
  useEffect(() => {
    fetch(`/api/students/${studentId}/daily-log?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.log) {
          const log = d.log
          setExistingLogId(log.id)
          setForm({
            hifzFromSurahId: log.hifzFromSurahId?.toString() || "",
            hifzFromVerse: log.hifzFromVerse?.toString() || "",
            hifzToSurahId: log.hifzToSurahId?.toString() || "",
            hifzToVerse: log.hifzToVerse?.toString() || "",
            hifzNote: log.hifzNote || "",
            murajaFromSurahId: log.murajaFromSurahId?.toString() || "",
            murajaFromVerse: log.murajaFromVerse?.toString() || "",
            murajaToSurahId: log.murajaToSurahId?.toString() || "",
            murajaToVerse: log.murajaToVerse?.toString() || "",
            murajaNote: log.murajaNote || "",
            talqinFromSurahId: log.talqinFromSurahId?.toString() || "",
            talqinFromVerse: log.talqinFromVerse?.toString() || "",
            talqinToSurahId: log.talqinToSurahId?.toString() || "",
            talqinToVerse: log.talqinToVerse?.toString() || "",
            talqinNote: log.talqinNote || "",
            courseBook: log.courseBook || "",
            courseFromPage: log.courseFromPage?.toString() || "",
            courseToPage: log.courseToPage?.toString() || "",
            courseNote: log.courseNote || "",
            attendanceStatus: log.attendanceStatus || "PRESENT",
            teacherObservation: log.teacherObservation || "",
            globalScore: log.globalScore?.toString() || "",
          })
        } else {
          setExistingLogId(null)
          setForm({
            hifzFromSurahId: "", hifzFromVerse: "", hifzToSurahId: "", hifzToVerse: "", hifzNote: "",
            murajaFromSurahId: "", murajaFromVerse: "", murajaToSurahId: "", murajaToVerse: "", murajaNote: "",
            talqinFromSurahId: "", talqinFromVerse: "", talqinToSurahId: "", talqinToVerse: "", talqinNote: "",
            courseBook: "", courseFromPage: "", courseToPage: "", courseNote: "",
            attendanceStatus: "PRESENT", teacherObservation: "", globalScore: "",
          })
        }
      })
  }, [studentId, date])

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const body: any = { date }
      const num = (v: string) => (v ? parseInt(v, 10) : null)
      const addIf = (key: string, val: string) => { if (val) body[key] = num(val) || val }

      addIf("hifzFromSurahId", form.hifzFromSurahId)
      addIf("hifzFromVerse", form.hifzFromVerse)
      addIf("hifzToSurahId", form.hifzToSurahId)
      addIf("hifzToVerse", form.hifzToVerse)
      if (form.hifzNote) body.hifzNote = form.hifzNote

      addIf("murajaFromSurahId", form.murajaFromSurahId)
      addIf("murajaFromVerse", form.murajaFromVerse)
      addIf("murajaToSurahId", form.murajaToSurahId)
      addIf("murajaToVerse", form.murajaToVerse)
      if (form.murajaNote) body.murajaNote = form.murajaNote

      addIf("talqinFromSurahId", form.talqinFromSurahId)
      addIf("talqinFromVerse", form.talqinFromVerse)
      addIf("talqinToSurahId", form.talqinToSurahId)
      addIf("talqinToVerse", form.talqinToVerse)
      if (form.talqinNote) body.talqinNote = form.talqinNote

      if (form.courseBook) body.courseBook = form.courseBook
      addIf("courseFromPage", form.courseFromPage)
      addIf("courseToPage", form.courseToPage)
      if (form.courseNote) body.courseNote = form.courseNote

      body.attendanceStatus = form.attendanceStatus
      if (form.teacherObservation) body.teacherObservation = form.teacherObservation
      addIf("globalScore", form.globalScore)

      const method = existingLogId ? "PATCH" : "POST"
      const res = await fetch(`/api/students/${studentId}/daily-log`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Erreur")
      setSaved(true)
      setTimeout(() => { setSaved(false); onSaved?.(); onClose() }, 800)
    } catch (e) {
      console.error(e)
      alert(t("error"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("title")}</h2>
            <p className="text-xs text-gray-500">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Date + Global score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("date")}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("globalScore")}</label>
              <input
                type="number"
                min={0}
                max={20}
                value={form.globalScore}
                onChange={(e) => update("globalScore", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm"
              />
            </div>
          </div>

          {loadingSurahs ? (
            <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <>
              {/* Hifz */}
              <Section icon={BookOpen} title={t("hifz")} color="text-emerald-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SurahSelect surahs={surahs} locale={L} value={form.hifzFromSurahId} onChange={(v) => update("hifzFromSurahId", v)} label={t("fromSurah")} />
                  <VerseInput value={form.hifzFromVerse} onChange={(v) => update("hifzFromVerse", v)} label={t("fromVerse")} />
                  <SurahSelect surahs={surahs} locale={L} value={form.hifzToSurahId} onChange={(v) => update("hifzToSurahId", v)} label={t("toSurah")} />
                  <VerseInput value={form.hifzToVerse} onChange={(v) => update("hifzToVerse", v)} label={t("toVerse")} />
                </div>
                <textarea
                  value={form.hifzNote}
                  onChange={(e) => update("hifzNote", e.target.value)}
                  placeholder={t("note")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                  rows={3}
                />
                {existingLogId && <DailyLogSectionThread studentId={studentId} dailyLogId={existingLogId} section="HIFZ" sectionLabel={t("hifz")} />}
              </Section>

              {/* Muraja */}
              <Section icon={RotateCcw} title={t("muraja")} color="text-blue-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SurahSelect surahs={surahs} locale={L} value={form.murajaFromSurahId} onChange={(v) => update("murajaFromSurahId", v)} label={t("fromSurah")} />
                  <VerseInput value={form.murajaFromVerse} onChange={(v) => update("murajaFromVerse", v)} label={t("fromVerse")} />
                  <SurahSelect surahs={surahs} locale={L} value={form.murajaToSurahId} onChange={(v) => update("murajaToSurahId", v)} label={t("toSurah")} />
                  <VerseInput value={form.murajaToVerse} onChange={(v) => update("murajaToVerse", v)} label={t("toVerse")} />
                </div>
                <textarea
                  value={form.murajaNote}
                  onChange={(e) => update("murajaNote", e.target.value)}
                  placeholder={t("note")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  rows={3}
                />
                {existingLogId && <DailyLogSectionThread studentId={studentId} dailyLogId={existingLogId} section="MURAJA" sectionLabel={t("muraja")} />}
              </Section>

              {/* Talqin */}
              <Section icon={Headphones} title={t("talqin")} color="text-purple-600">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <SurahSelect surahs={surahs} locale={L} value={form.talqinFromSurahId} onChange={(v) => update("talqinFromSurahId", v)} label={t("fromSurah")} />
                  <VerseInput value={form.talqinFromVerse} onChange={(v) => update("talqinFromVerse", v)} label={t("fromVerse")} />
                  <SurahSelect surahs={surahs} locale={L} value={form.talqinToSurahId} onChange={(v) => update("talqinToSurahId", v)} label={t("toSurah")} />
                  <VerseInput value={form.talqinToVerse} onChange={(v) => update("talqinToVerse", v)} label={t("toVerse")} />
                </div>
                <textarea
                  value={form.talqinNote}
                  onChange={(e) => update("talqinNote", e.target.value)}
                  placeholder={t("note")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
                  rows={3}
                />
                {existingLogId && <DailyLogSectionThread studentId={studentId} dailyLogId={existingLogId} section="TALQIN" sectionLabel={t("talqin")} />}
              </Section>

              {/* Cours scientifique */}
              <Section icon={GraduationCap} title={t("course")} color="text-amber-600">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-1">{t("book")}</label>
                    <input
                      type="text"
                      value={form.courseBook}
                      onChange={(e) => update("courseBook", e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <VerseInput value={form.courseFromPage} onChange={(v) => update("courseFromPage", v)} label={t("fromPage")} />
                  <VerseInput value={form.courseToPage} onChange={(v) => update("courseToPage", v)} label={t("toPage")} />
                </div>
                <textarea
                  value={form.courseNote}
                  onChange={(e) => update("courseNote", e.target.value)}
                  placeholder={t("note")}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
                  rows={3}
                />
                {existingLogId && <DailyLogSectionThread studentId={studentId} dailyLogId={existingLogId} section="COURSE" sectionLabel={t("course")} />}
              </Section>

              {/* Assiduité */}
              <Section icon={CalendarDays} title={t("attendance")} color="text-red-600">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">{t("status")}</label>
                    <select
                      value={form.attendanceStatus}
                      onChange={(e) => update("attendanceStatus", e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    >
                      <option value="PRESENT">{t("present")}</option>
                      <option value="ABSENT">{t("absent")}</option>
                      <option value="LATE">{t("late")}</option>
                      <option value="EXCUSED">{t("excused")}</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1.5">{t("teacherObservation")}</label>
                    <textarea
                      value={form.teacherObservation}
                      onChange={(e) => update("teacherObservation", e.target.value)}
                      placeholder={t("observationPlaceholder")}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
                      rows={3}
                    />
                  </div>
                </div>
                {existingLogId && <DailyLogSectionThread studentId={studentId} dailyLogId={existingLogId} section="ATTENDANCE" sectionLabel={t("attendance")} />}
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {t("cancel")}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loadingSurahs}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {saved ? <CheckCircle2 size={16} /> : saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saved ? t("saved") : saving ? t("saving") : t("save")}
          </button>
        </div>
      </div>
    </div>
  )
}
