"use client"
// src/app/teacher/evaluations/page.tsx — FIXED JSON + synchro élève/enseignant

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
  ClipboardList, Plus, Star, Pencil, Check, X, RotateCcw,
  Loader2, CheckCircle2, Bell, Calendar, Trash2, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"

interface Ev {
  id: string
  memorizationScore: number; tajweedScore: number; fluencyScore: number; makharijScore: number
  finalScore: number; decision: string; teacherNotes?: string | null; evaluatedAt: string
  student: { id: string; user: { fullName: string } }
  progress: { id: string; surah: { nameFr: string; nameAr: string }; status: string; currentVerse: number; completionPercentage: number }
}
interface Exam {
  id: string; title: string; titleAr?: string | null
  examDate: string; duration: number; description?: string | null
  group: { name: string }
}
interface PendingProg {
  id: string; studentId: string; currentVerse: number; completionPercentage: number
  surah: { nameFr: string; nameAr: string; verseCount: number }
  student: { id: string; user: { fullName: string } }
}
interface Group { id: string; name: string; students: { id: string; user: { fullName: string } }[] }

async function safeFetch(url: string): Promise<{ ok: boolean; data: unknown }> {
  try {
    const res = await fetch(url)
    const text = await res.text()
    if (!text.trim()) return { ok: res.ok, data: {} }
    const data = JSON.parse(text)
    return { ok: res.ok, data }
  } catch {
    return { ok: false, data: {} }
  }
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const color = value >= 75 ? "text-green-600" : value >= 60 ? "text-yellow-600" : "text-red-500"
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-xs font-medium text-gray-600">{label}</span>
        <span className={`text-sm font-bold tabular-nums ${color}`}>{value}<span className="text-gray-300 text-xs font-normal">/100</span></span>
      </div>
      <input type="range" min={0} max={100} step={5} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-gray-100 accent-tahfidz-green" />
      <div className="flex justify-between text-xs text-gray-300"><span>0</span><span>50</span><span>100</span></div>
    </div>
  )
}

function EvalCard({ ev, onUpdated, t, L }: { ev: Ev; onUpdated: () => void; t: (k: string) => string; L: string }) {
  const [open, setOpen] = useState(false)
  const [memo, setMemo] = useState(ev.memorizationScore)
  const [taj, setTaj] = useState(ev.tajweedScore)
  const [flu, setFlu] = useState(ev.fluencyScore)
  const [mak, setMak] = useState(ev.makharijScore)
  const [notes, setNotes] = useState(ev.teacherNotes || "")
  const [dec, setDec] = useState(ev.decision)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const score = Math.round(memo * 0.4 + taj * 0.3 + flu * 0.2 + mak * 0.1)
  const sColor = score >= 75 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-500"
  const sBg = score >= 75 ? "bg-green-50 border-green-200" : score >= 60 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"

  const DECISIONS = {
    APPROVED:       { label: L === "ar" ? "مُصادَق" : L === "en" ? "Approved" : "Approuvé", icon: Check, cls: "text-green-700 bg-green-50 border-green-300" },
    NEEDS_REVISION: { label: L === "ar" ? "مراجعة" : L === "en" ? "Revision" : "Révision", icon: RotateCcw, cls: "text-yellow-700 bg-yellow-50 border-yellow-300" },
    REJECTED:       { label: L === "ar" ? "مرفوض" : L === "en" ? "Rejected" : "Rejeté", icon: X, cls: "text-red-700 bg-red-50 border-red-300" },
  }

  const dCfg = DECISIONS[dec as keyof typeof DECISIONS] ?? DECISIONS.NEEDS_REVISION

  const save = async () => {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/evaluations/${ev.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memorizationScore: memo, tajweedScore: taj, fluencyScore: flu, makharijScore: mak, teacherNotes: notes, decision: dec, revisionRequired: dec !== "APPROVED" }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setSaved(true); setOpen(false); onUpdated()
      setTimeout(() => setSaved(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
    } finally { setSaving(false) }
  }

  const cancel = () => {
    setMemo(ev.memorizationScore); setTaj(ev.tajweedScore)
    setFlu(ev.fluencyScore); setMak(ev.makharijScore)
    setNotes(ev.teacherNotes || ""); setDec(ev.decision)
    setOpen(false); setError(null)
  }

  const fDate = (d: string) => new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "short", year: "numeric" })
  const origDcfg = DECISIONS[ev.decision as keyof typeof DECISIONS] ?? DECISIONS.NEEDS_REVISION

  return (
    <div className={`bg-white rounded-xl border transition-all duration-200 ${open ? "border-tahfidz-green shadow-md" : "border-gray-100 hover:shadow-sm"}`}>
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl gradient-tahfidz flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">{ev.student.user.fullName.charAt(0)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm">{ev.student.user.fullName}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span>{ev.progress.surah.nameFr}</span>
            <span className="arabic text-tahfidz-green">{ev.progress.surah.nameAr}</span>
            <span className="text-gray-200">·</span>
            <span>{fDate(ev.evaluatedAt)}</span>
            <span className="text-gray-200">·</span>
            <span>{ev.progress.currentVerse} {t("verses")} · {Math.round(ev.progress.completionPercentage)}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <p className={`text-base font-bold ${ev.finalScore >= 75 ? "text-tahfidz-green" : ev.finalScore >= 60 ? "text-yellow-600" : "text-red-500"}`}>{ev.finalScore}/100</p>
            <div className="flex gap-0.5 justify-end mt-0.5">
              {[...Array(5)].map((_, i) => <Star key={i} size={9} className={i < Math.round(ev.finalScore/20) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />)}
            </div>
          </div>
          <span className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg border text-xs font-medium ${origDcfg.cls}`}>
            <origDcfg.icon size={11} />{origDcfg.label}
          </span>
          {saved && <span className="text-xs text-tahfidz-green font-medium flex items-center gap-1"><CheckCircle2 size={12} />{t("updated")}</span>}
          <button onClick={() => setOpen(!open)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${open ? "bg-tahfidz-green text-white border-tahfidz-green" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Pencil size={11} />{open ? t("close") : t("edit")}{open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-gray-100 space-y-4 pt-4">
          {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><X size={13} />{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Slider label={t("memorization")} value={memo} onChange={setMemo} />
            <Slider label={t("tajweed")} value={taj} onChange={setTaj} />
            <Slider label={t("fluency")} value={flu} onChange={setFlu} />
            <Slider label={t("makharij")} value={mak} onChange={setMak} />
          </div>
          <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${sBg}`}>
            <div><p className="text-xs text-gray-400">{t("calculatedScore")}</p><p className={`text-3xl font-bold tabular-nums ${sColor}`}>{score}<span className="text-lg text-gray-300">/100</span></p></div>
            <div className="flex gap-1">{[...Array(5)].map((_, i) => <Star key={i} size={18} className={i < Math.round(score/20) ? "text-yellow-400 fill-yellow-400" : "text-gray-100 fill-gray-100"} />)}</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t("notes")}</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder={t("notesPlaceholder")}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">{t("finalDecision")}</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DECISIONS).map(([v, c]) => (
                <button key={v} onClick={() => setDec(v)}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-xs font-semibold transition ${dec === v ? c.cls + " ring-2 ring-offset-1 ring-current/30" : "border-gray-200 text-gray-400 hover:border-gray-300 bg-white"}`}>
                  <c.icon size={13} />{c.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={cancel} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition">{t("cancel")}</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition flex items-center justify-center gap-2">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {saving ? t("updating") : t("validateNotify")}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ExamScheduler({ groups, onCreated, t, L }: { groups: Group[]; onCreated: () => void; t: (k: string) => string; L: string }) {
  const [title, setTitle] = useState("")
  const [titleAr, setTitleAr] = useState("")
  const [desc, setDesc] = useState("")
  const [groupId, setGroupId] = useState(groups[0]?.id || "")
  const [date, setDate] = useState("")
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (groups[0]) setGroupId(groups[0].id) }, [groups])

  const submit = async () => {
    if (!title.trim()) { setError(t("titleRequired")); return }
    if (!groupId) { setError(t("selectGroup")); return }
    if (!date) { setError(t("dateRequired")); return }
    let examDateISO: string
    try {
      const d = new Date(date)
      if (isNaN(d.getTime())) throw new Error()
      examDateISO = d.toISOString()
    } catch { setError(t("invalidDate")); return }

    setSaving(true); setError(null)
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), titleAr: titleAr.trim() || undefined, description: desc.trim() || undefined, groupId, examDate: examDateISO, duration }),
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`)
      setSaved(true); setTitle(""); setTitleAr(""); setDesc(""); setDate(""); setDuration(60)
      onCreated()
      setTimeout(() => setSaved(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("serverError"))
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-white rounded-xl border border-purple-200 p-5 space-y-4">
      <h3 className="font-semibold text-gray-800 flex items-center gap-2 text-sm">
        <Calendar size={16} className="text-purple-600" /> {t("scheduleExam")}
      </h3>
      {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"><X size={13} className="flex-shrink-0" />{error}</div>}
      {saved && <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"><CheckCircle2 size={13} />{t("examScheduled")}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("titleFr")} *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t("titlePlaceholder")}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("titleAr")}</label>
          <input value={titleAr} onChange={e => setTitleAr(e.target.value)} dir="rtl" placeholder={t("titleArPlaceholder")}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm arabic focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("group")} *</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-400">
            <option value="">{t("selectGroup")}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.students.length} {t("students")})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("duration")}</label>
          <input type="number" value={duration} onChange={e => setDuration(Math.max(10, Number(e.target.value)))} min={10} max={240}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("dateTime")} *</label>
          <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">{t("instructions")}</label>
          <textarea rows={2} value={desc} onChange={e => setDesc(e.target.value)} placeholder={t("instructionsPlaceholder")}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-400" />
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-gray-400 flex items-center gap-1"><Bell size={11} />{t("autoNotify")}</p>
        <button onClick={submit} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 disabled:opacity-60 transition">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Calendar size={14} />}
          {saving ? t("scheduling") : t("scheduleExam")}
        </button>
      </div>
    </div>
  )
}

export default function TeacherEvaluationsPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const T = {
    title:          { fr: "Évaluations & Examens",  en: "Evaluations & Exams",   ar: "التقييمات والاختبارات" },
    readyRecite:    { fr: "élève(s) prêt(s) à réciter", en: "student(s) ready to recite", ar: "طالب/طلاب جاهزون للتسميع" },
    sync:           { fr: "Synchro auto",             en: "Auto sync",             ar: "مزامنة تلقائية" },
    refresh:        { fr: "Actualiser",               en: "Refresh",               ar: "تحديث" },
    newEval:        { fr: "Nouvelle évaluation",      en: "New evaluation",        ar: "تقييم جديد" },
    evaluations:    { fr: "Évaluations",              en: "Evaluations",           ar: "التقييمات" },
    pending:        { fr: "En attente",               en: "Pending",               ar: "في الانتظار" },
    exams:          { fr: "Examens planifiés",        en: "Scheduled exams",     ar: "الاختبارات المجدولة" },
    all:            { fr: "Toutes",                   en: "All",                   ar: "الكل" },
    approved:       { fr: "Approuvées",               en: "Approved",              ar: "مُصادَقة" },
    revision:       { fr: "Révision",                 en: "Revision",              ar: "مراجعة" },
    rejected:       { fr: "À refaire",                en: "To redo",               ar: "لإعادة" },
    noEval:         { fr: "Aucune évaluation",        en: "No evaluations",        ar: "لا توجد تقييمات" },
    createFirst:    { fr: "Créer une première évaluation", en: "Create first evaluation", ar: "إنشاء تقييم أول" },
    noPending:      { fr: "Aucun élève en attente",   en: "No pending students",   ar: "لا يوجد طلاب في الانتظار" },
    pendingDesc:    { fr: "Les élèves apparaissent ici quand ils signalent être prêts à réciter",
                      en: "Students appear here when they signal being ready to recite",
                      ar: "يظهر الطلاب هنا عندما يشيرون إلى استعدادهم للتسميع" },
    pendingNotify:  { fr: "élève(s) attend(ent) votre validation",
                      en: "student(s) awaiting your validation",
                      ar: "طالب/طلاب ينتظرون تصديقك" },
    verses:         { fr: "versets",                  en: "verses",                ar: "آيات" },
    updated:        { fr: "Mis à jour",               en: "Updated",               ar: "تم التحديث" },
    close:          { fr: "Fermer",                   en: "Close",                 ar: "إغلاق" },
    edit:           { fr: "Modifier",                   en: "Edit",                  ar: "تعديل" },
    memorization:   { fr: "Mémorisation (×0.4)",      en: "Memorization (×0.4)",   ar: "الحفظ (×0.4)" },
    tajweed:        { fr: "Tajweed (×0.3)",           en: "Tajweed (×0.3)",        ar: "التجويد (×0.3)" },
    fluency:        { fr: "Fluidité (×0.2)",            en: "Fluency (×0.2)",        ar: "الطلاقة (×0.2)" },
    makharij:       { fr: "Makharij (×0.1)",            en: "Makharij (×0.1)",       ar: "المخارج (×0.1)" },
    calculatedScore:{ fr: "Score calculé",            en: "Calculated score",      ar: "الدرجة المحسوبة" },
    notes:          { fr: "Notes / Observations",       en: "Notes / Observations",  ar: "ملاحظات / مراقبات" },
    notesPlaceholder:{ fr: "Conseils, points à améliorer, encouragements…",
                       en: "Tips, points to improve, encouragement…",
                       ar: "نصائح، نقاط للتحسين، تشجيع…" },
    finalDecision:  { fr: "Décision finale",            en: "Final decision",        ar: "القرار النهائي" },
    cancel:         { fr: "Annuler",                    en: "Cancel",                ar: "إلغاء" },
    updating:       { fr: "Mise à jour…",               en: "Updating…",             ar: "جارٍ التحديث…" },
    validateNotify: { fr: "Valider et notifier l'élève", en: "Validate and notify student", ar: "تصديق وإشعار الطالب" },
    scheduleExam:   { fr: "Planifier un nouvel examen", en: "Schedule new exam",     ar: "جدولة اختبار جديد" },
    titleRequired:  { fr: "Le titre est requis",        en: "Title is required",     ar: "العنوان مطلوب" },
    selectGroup:    { fr: "Sélectionnez un groupe",     en: "Select a group",        ar: "اختر مجموعة" },
    dateRequired:   { fr: "La date et l'heure sont requises", en: "Date and time are required", ar: "التاريخ والوقت مطلوبان" },
    invalidDate:    { fr: "Format de date invalide",    en: "Invalid date format",   ar: "صيغة التاريخ غير صالحة" },
    serverError:    { fr: "Erreur serveur",             en: "Server error",          ar: "خطأ في الخادم" },
    titleFr:        { fr: "Titre (français)",           en: "Title (French)",        ar: "العنوان (فرنسي)" },
    titleAr:        { fr: "Titre (arabe)",              en: "Title (Arabic)",        ar: "العنوان (عربي)" },
    titlePlaceholder:{ fr: "ex: Examen mensuel — Juz 30", en: "e.g. Monthly exam — Juz 30", ar: "مثال: اختبار شهري — جزء 30" },
    titleArPlaceholder:{ fr: "اختبار شهري",             en: "Monthly exam",          ar: "اختبار شهري" },
    duration:       { fr: "Durée (minutes)",            en: "Duration (minutes)",    ar: "المدة (دقائق)" },
    dateTime:       { fr: "Date et heure",              en: "Date and time",         ar: "التاريخ والوقت" },
    instructions:   { fr: "Instructions (optionnel)",   en: "Instructions (optional)", ar: "تعليمات (اختياري)" },
    instructionsPlaceholder:{ fr: "Sourates concernées, matériaux autorisés…",
                              en: "Surahs concerned, allowed materials…",
                              ar: "السور المعنية، المواد المسموحة…" },
    autoNotify:     { fr: "Élèves + parents notifiés automatiquement",
                      en: "Students + parents notified automatically",
                      ar: "يتم إشعار الطلاب وأولياء الأمور تلقائياً" },
    scheduling:     { fr: "Planification…",             en: "Scheduling…",           ar: "جارٍ الجدولة…" },
    examScheduled:  { fr: "Examen planifié · Élèves et parents notifiés !",
                      en: "Exam scheduled · Students and parents notified!",
                      ar: "تم جدولة الاختبار · تم إشعار الطلاب وأولياء الأمور!" },
    loading:        { fr: "Chargement…",                en: "Loading…",              ar: "جارٍ التحميل…" },
    past:           { fr: "Passé",                      en: "Past",                  ar: "منتهٍ" },
    upcoming:       { fr: "À venir",                    en: "Upcoming",              ar: "قادم" },
    delete:         { fr: "Supprimer",                  en: "Delete",                ar: "حذف" },
    evaluate:       { fr: "Évaluer",                     en: "Evaluate",              ar: "تقييم" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const [evaluations, setEvaluations] = useState<Ev[]>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [pending, setPending] = useState<PendingProg[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [filter, setFilter] = useState("")
  const [tab, setTab] = useState<"evals" | "pending" | "exams">("evals")
  const [deletingExam, setDeletingExam] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [d1, d2, d3, d4] = await Promise.all([
      safeFetch("/api/evaluations?limit=50"),
      safeFetch("/api/exams"),
      safeFetch("/api/progress?status=READY_FOR_RECITATION"),
      safeFetch("/api/groups?mine=true"),
    ])
    setEvaluations((d1.data as any)?.evaluations || [])
    setExams((d2.data as any)?.exams || [])
    setPending((d3.data as any)?.progress || [])
    setGroups((d4.data as any)?.groups || [])
    setLastRefresh(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => { const id = setInterval(load, 30_000); return () => clearInterval(id) }, [load])

  const deleteExam = async (id: string) => {
    setDeletingExam(id)
    try {
      await fetch(`/api/exams?id=${id}`, { method: "DELETE" })
      setExams(prev => prev.filter(e => e.id !== id))
    } finally { setDeletingExam(null) }
  }

  const filtered = filter ? evaluations.filter(e => e.decision === filter) : evaluations

  const fmtDT = (d: string) => new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", {
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  })

  const tabConfig = [
    { id: "evals", label: t("evaluations"), count: evaluations.length, cls: "text-tahfidz-green border-tahfidz-green" },
    { id: "pending", label: t("pending"), count: pending.length, cls: "text-orange-500 border-orange-500", urgent: pending.length > 0 },
    { id: "exams", label: t("exams"), count: exams.length, cls: "text-purple-600 border-purple-600" },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          {pending.length > 0 ? (
            <button onClick={() => setTab("pending")}
              className="text-sm text-orange-600 mt-1 font-medium flex items-center gap-1 hover:text-orange-700 transition animate-pulse">
              <Bell size={14} />{pending.length} {t("readyRecite")} →
            </button>
          ) : (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <RefreshCw size={11} /> {t("sync")} · {lastRefresh.toLocaleTimeString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading} title={t("refresh")}
            className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50">
            <RefreshCw size={15} className={`text-gray-500 ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link href="/teacher/evaluation/new"
            className="flex items-center gap-2 px-4 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition">
            <Plus size={15} />{t("newEval")}
          </Link>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabConfig.map(ta => (
          <button key={ta.id} onClick={() => setTab(ta.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap -mb-px ${tab === ta.id ? ta.cls : "text-gray-500 border-transparent hover:text-gray-700"}`}>
            {ta.urgent && <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
            {ta.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${tab === ta.id ? "bg-current/10" : "bg-gray-100 text-gray-500"}`}>{ta.count}</span>
          </button>
        ))}
      </div>

      {loading && evaluations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-2 border-tahfidz-green border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">{t("loading")}</p>
        </div>
      ) : (
        <>
          {tab === "evals" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {[
                  { v: "", l: `${t("all")} (${evaluations.length})` },
                  { v: "APPROVED", l: `✓ ${t("approved")} (${evaluations.filter(e => e.decision === "APPROVED").length})` },
                  { v: "NEEDS_REVISION", l: `↺ ${t("revision")} (${evaluations.filter(e => e.decision === "NEEDS_REVISION").length})` },
                  { v: "REJECTED", l: `✗ ${t("rejected")} (${evaluations.filter(e => e.decision === "REJECTED").length})` },
                ].map(f => (
                  <button key={f.v} onClick={() => setFilter(f.v)}
                    className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition ${filter === f.v ? "bg-tahfidz-green text-white border-tahfidz-green" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                    {f.l}
                  </button>
                ))}
              </div>
              {filtered.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
                  <ClipboardList size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 font-medium">{t("noEval")}</p>
                  <Link href="/teacher/evaluation/new" className="mt-3 inline-block text-sm text-tahfidz-green hover:underline font-medium">{t("createFirst")} →</Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {filtered.map(ev => <EvalCard key={ev.id} ev={ev} onUpdated={load} t={t as (k: string) => string} L={L} />)}
                </div>
              )}
            </div>
          )}

          {tab === "pending" && (
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
                  <CheckCircle2 size={36} className="mx-auto mb-3 text-gray-300" />
   
                  <p className="text-gray-500 font-medium">{t("noPending")}</p>
                  <p className="text-sm text-gray-400 mt-1">{t("pendingDesc")}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pending.map(prog => (
                    <div key={prog.id} className="bg-white rounded-xl border border-orange-200 p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <Bell size={18} className="text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">{prog.student.user.fullName}</p>
                        <p className="text-xs text-gray-500">{prog.surah.nameFr} — <span className="arabic">{prog.surah.nameAr}</span></p>
                      </div>
                      <a href={`/teacher/evaluation/new?studentId=${prog.student.id}&progressId=${prog.id}`}
                        className="px-4 py-2 bg-tahfidz-green text-white text-xs font-semibold rounded-lg hover:bg-tahfidz-green-dark transition">
                        {t("evaluate")}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
