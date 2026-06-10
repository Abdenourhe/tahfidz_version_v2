"use client"
// ParentChildProfileClient.tsx — Page détail enfant, design harmonisé & moderne

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, BookOpen, Star, Award, CalendarCheck, GraduationCap,
  Phone, Mail, TrendingUp, RefreshCw, Loader2,
  CheckCircle2, RotateCcw, X, Clock, MapPin, Flame, Sparkles
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Progress {
  id: string; surahId: number; currentVerse: number; completionPercentage: number
  status: string; startedAt: string; updatedAt: string
  surah: { nameFr: string; nameAr: string; verseCount: number; juzNumber: number }
  evaluation?: { finalScore: number; decision: string; evaluatedAt: string } | null
}
interface Evaluation {
  id: string; finalScore: number; decision: string; teacherNotes?: string | null
  memorizationScore: number; tajweedScore: number; fluencyScore: number; makharijScore: number
  evaluatedAt: string
  progress: { surah: { nameFr: string; nameAr: string } }
  teacher: { user: { fullName: string } }
}
interface Attendance {
  id: string; date: string; status: string; notes?: string | null
}
interface Badge {
  id: string; badge: { icon: string; name: string; rarity: string }; earnedAt: string
}
interface Student {
  id: string; totalStars: number; currentStreak: number; longestStreak: number
  studentCode: string; dateOfBirth?: string | null; enrollmentDate: string; emergencyPhone?: string | null
  user: { fullName: string; fullNameAr?: string | null; email: string; phone?: string | null; gender?: string | null; avatar?: string | null }
  group?: { name: string; nameAr?: string | null; level: string } | null
  teacher?: { user: { fullName: string; phone?: string | null; email: string } } | null
  _count: { memorizedSurahs: number; studentBadges: number }
}

function formatAge(dob?: string | null, L: string = "fr"): string | null {
  if (!dob) return null
  const birth = new Date(dob); const now = new Date()
  let y = now.getFullYear() - birth.getFullYear()
  let m = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) m--
  if (m < 0) { y--; m += 12 }
  if (y < 3) return null
  const yearsLabel = L === "ar" ? "سنة" : L === "en" ? "yrs" : "ans"
  const monthsLabel = L === "ar" ? "شهر" : L === "en" ? "mo" : "mois"
  return m > 0 ? `${y} ${yearsLabel} ${m} ${monthsLabel}` : `${y} ${yearsLabel}`
}

function fmtDate(d: string, L: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", opts ?? { day: "2-digit", month: "short", year: "numeric" })
}

function VerseUpdater({ progressId, totalVerses, currentVerse, onUpdated }: {
  progressId: string; totalVerses: number; currentVerse: number; onUpdated: () => void
}) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentChildProfileClient_1")
  const [draft, setDraft] = useState(String(currentVerse))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { setDraft(String(currentVerse)) }, [currentVerse])

  const save = async (newVerse: number) => {
    const clamped = Math.max(0, Math.min(newVerse, totalVerses))
    if (clamped === currentVerse) return
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/progress/${progressId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentVerse: clamped }),
      })
      if (!res.ok) throw new Error(t("error"))
      setDraft(String(clamped))
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      onUpdated()
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error")); setDraft(String(currentVerse))
    } finally { setSaving(false) }
  }

  const adjust = (delta: number) => {
    const next = Math.max(0, Math.min(currentVerse + delta, totalVerses))
    setDraft(String(next)); save(next)
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">📝 {t("update")}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 rounded-xl px-3 py-2">
          <span className="text-xs text-gray-500">{t("verse")}</span>
          <input type="number" value={draft} min={0} max={totalVerses}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { const n = parseInt(draft); if (!isNaN(n)) save(n) }}
            className="w-14 text-center text-sm font-bold text-tahfidz-green bg-transparent border-none outline-none focus:ring-0" />
          <span className="text-xs text-gray-400">/ {totalVerses}</span>
        </div>
        {[-5, -1, +1, +5].map(d => (
          <button key={d} onClick={() => adjust(d)} disabled={saving}
            className="px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition font-medium">
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
        <button onClick={() => save(totalVerses)} disabled={saving || currentVerse >= totalVerses}
          className="px-2.5 py-1.5 text-xs border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light disabled:opacity-40 transition font-medium">
          {t("all")} ✓
        </button>
        {saving && <Loader2 size={14} className="animate-spin text-tahfidz-green" />}
        {saved && <span className="text-xs text-tahfidz-green font-medium">✓ {t("saved")}</span>}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

export function ParentChildProfileClient({ studentId }: { studentId: string }) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentChildProfileClient_2")

  const [student, setStudent] = useState<Student | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [tab, setTab] = useState<"progress" | "evaluations" | "attendance" | "badges">("progress")

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [studRes, progRes, evalRes, attRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/progress?studentId=${studentId}`),
        fetch(`/api/evaluations?studentId=${studentId}&limit=20`),
        fetch(`/api/attendance?studentId=${studentId}&dateFrom=${(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0] })()}T00:00:00Z`),
      ])
      const [studData, progData, evalData, attData] = await Promise.all([
        studRes.ok ? studRes.json() : null,
        progRes.ok ? progRes.json() : null,
        evalRes.ok ? evalRes.json() : null,
        attRes.ok ? attRes.json() : null,
      ])
      if (studData?.student) { setStudent(studData.student); setBadges(studData.student.studentBadges || []) }
      if (progData?.progress) setProgress(progData.progress)
      if (evalData?.evaluations) setEvaluations(evalData.evaluations)
      if (attData?.attendances) setAttendances(attData.attendances)
      setLastSync(new Date())
    } finally { setLoading(false); setRefreshing(false) }
  }, [studentId])

  useEffect(() => { load() }, [load])
  useEffect(() => { const id = setInterval(() => load(true), 60_000); return () => clearInterval(id) }, [load])

  const memorized = progress.filter(p => p.status === "MEMORIZED")
  const inProgress = progress.filter(p => p.status !== "MEMORIZED")
  const presentCnt = attendances.filter(a => a.status === "PRESENT" || a.status === "LATE").length
  const attRate = attendances.length > 0 ? Math.round((presentCnt / attendances.length) * 100) : 0
  const avgScore = evaluations.length > 0 ? Math.round(evaluations.reduce((a, e) => a + e.finalScore, 0) / evaluations.length) : null

  const LEVEL_LABEL: Record<string, string> = {
    beginner: t("beginner"), intermediate: t("intermediate"), advanced: t("advanced"),
  }

  const STATUS_LABEL: Record<string, { label: string; bg: string; color: string }> = {
    NOT_STARTED:   { label: L === "ar" ? "لم يبدأ" : L === "en" ? "Not started" : "Non commencé", bg: "bg-gray-100", color: "text-gray-500" },
    IN_PROGRESS:   { label: L === "ar" ? "جارٍ" : L === "en" ? "In progress" : "En cours", bg: "bg-blue-100", color: "text-blue-700" },
    READY_FOR_RECITATION: { label: L === "ar" ? "جاهز" : L === "en" ? "Ready" : "Prêt", bg: "bg-orange-100", color: "text-orange-700" },
    UNDER_REVIEW:  { label: L === "ar" ? "قيد المراجعة" : L === "en" ? "Under review" : "En révision", bg: "bg-yellow-100", color: "text-yellow-700" },
    NEEDS_REVISION:{ label: L === "ar" ? "مراجعة" : L === "en" ? "Needs revision" : "À réviser", bg: "bg-red-100", color: "text-red-600" },
    MEMORIZED:     { label: L === "ar" ? "محفوظ ✓" : L === "en" ? "Memorized ✓" : "Mémorisé ✓", bg: "bg-green-100", color: "text-green-700" },
  }

  const DECISION_CFG: Record<string, { icon: typeof CheckCircle2; label: string; color: string }> = {
    APPROVED:       { icon: CheckCircle2, label: t("approved"), color: "text-green-600" },
    NEEDS_REVISION: { icon: RotateCcw,   label: t("revision"),  color: "text-yellow-600" },
    REJECTED:       { icon: X,            label: t("redo"),      color: "text-red-500" },
  }

  const ATT_CFG: Record<string, { label: string; short: string; cls: string; dot: string }> = {
    PRESENT: { label: t("present"), short: "✓", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
    LATE:    { label: t("late"),    short: "~", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
    EXCUSED: { label: t("excused"), short: "E", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
    ABSENT:  { label: t("absent"),  short: "✗", cls: "bg-red-100 text-red-500", dot: "bg-red-500" },
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-tahfidz-green border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">{t("loading")}</p>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400">{t("notFound")}</p>
        <Link href="/parent/profile" className="mt-4 inline-block text-tahfidz-green hover:underline text-sm">{t("back")}</Link>
      </div>
    )
  }

  const user = student.user

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between">
        <Link href="/parent/profile" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={16} /> {t("backProfile")}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
            {lastSync.toLocaleTimeString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          <button onClick={() => load(true)} disabled={refreshing}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-50">
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ── Hero card ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl gradient-tahfidz flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
            {user.avatar ? (
              <Image src={user.avatar} alt={user.fullName} width={96} height={96} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-3xl sm:text-4xl">{user.fullName.charAt(0)}</span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{user.fullName}</h1>
            {user.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-sm mt-0.5">{user.fullNameAr}</p>}

            <div className="flex flex-wrap items-center gap-2 mt-2">
              {student.group && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-semibold">
                  <BookOpen size={11} /> {student.group.name}
                </span>
              )}
              {student.group?.level && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                  {LEVEL_LABEL[student.group.level] ?? student.group.level}
                </span>
              )}
              {formatAge(student.dateOfBirth, L) && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium">
                  <Clock size={11} /> {formatAge(student.dateOfBirth, L)}
                </span>
              )}
            </div>

            {/* Stars + streak */}
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-tahfidz-gold bg-tahfidz-gold-light dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                <Star size={12} className="fill-tahfidz-gold" /> {student.totalStars}
              </span>
              {student.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                  <Flame size={12} /> {student.currentStreak}j
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: BookOpen, value: student._count.memorizedSurahs, label: t("memorized"), color: "text-tahfidz-green", bg: "bg-tahfidz-green-light", border: "border-emerald-200" },
          { icon: TrendingUp, value: inProgress.length, label: t("inProgress"), color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { icon: CalendarCheck, value: `${attRate}%`, label: t("attendance30"), color: attRate >= 80 ? "text-emerald-600" : attRate >= 60 ? "text-amber-600" : "text-red-500", bg: attRate >= 80 ? "bg-emerald-50" : attRate >= 60 ? "bg-amber-50" : "bg-red-50", border: attRate >= 80 ? "border-emerald-200" : attRate >= 60 ? "border-amber-200" : "border-red-200" },
          { icon: Sparkles, value: avgScore ? `${avgScore}/100` : "—", label: t("avgScore"), color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border ${s.border} ${s.bg} dark:bg-opacity-10 p-3 text-center transition hover:shadow-sm`}>
            <s.icon size={16} className={`mx-auto mb-1 ${s.color}`} />
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Teacher contact chip ── */}
      {student.teacher && (
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <GraduationCap size={16} className="text-tahfidz-green" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t("teacher")}</p>
            <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">{student.teacher.user.fullName}</p>
          </div>
          <div className="flex gap-2">
            {student.teacher.user.phone && (
              <a href={`tel:${student.teacher.user.phone}`}
                className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-green-600 hover:bg-green-50 transition">
                <Phone size={14} />
              </a>
            )}
            <a href={`mailto:${student.teacher.user.email}`}
              className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-blue-600 hover:bg-blue-50 transition">
              <Mail size={14} />
            </a>
          </div>
        </div>
      )}

      {/* ── Tabs (pill style) ── */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[
          { id: "progress" as const, label: t("memorization"), count: inProgress.length, icon: TrendingUp },
          { id: "evaluations" as const, label: t("evaluations"), count: evaluations.length, icon: Star },
          { id: "attendance" as const, label: t("attendance"), count: attendances.length, icon: CalendarCheck },
          { id: "badges" as const, label: t("badges"), count: badges.length, icon: Award },
        ].map(ta => {
          const isActive = tab === ta.id
          return (
            <button key={ta.id} onClick={() => setTab(ta.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold border-2 transition-all duration-200 whitespace-nowrap active:scale-95 ${
                isActive
                  ? "bg-tahfidz-green text-white border-tahfidz-green shadow-sm"
                  : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}>
              <ta.icon size={13} />
              {ta.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>{ta.count}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab: Mémorisation ── */}
      {tab === "progress" && (
        <div className="space-y-3">
          {inProgress.length === 0 && memorized.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <BookOpen size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">{t("noMem")}</p>
            </div>
          ) : (
            <>
              {inProgress.length > 0 && (
                <div className="space-y-3">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("inProgress2")} ({inProgress.length})</p>
                  {inProgress.map(prog => {
                    const sl = STATUS_LABEL[prog.status] ?? STATUS_LABEL.IN_PROGRESS
                    const ev = prog.evaluation
                    const dec = ev?.decision ? DECISION_CFG[ev.decision] : null
                    const pct = Math.round(prog.completionPercentage)
                    return (
                      <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-bold text-gray-900 dark:text-gray-100">{prog.surah.nameFr}</p>
                              <p className="arabic text-tahfidz-green text-sm">{prog.surah.nameAr}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${sl.bg} ${sl.color} font-bold`}>{sl.label}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              Juz {prog.surah.juzNumber} · {prog.surah.verseCount} {t("verse")} · {t("started")} {fmtDate(prog.startedAt, L, { day: "2-digit", month: "short" })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xl font-bold text-tahfidz-green">{pct}%</p>
                            <p className="text-[10px] text-gray-400">{prog.currentVerse}/{prog.surah.verseCount}</p>
                          </div>
                        </div>
                        <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full gradient-tahfidz rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        {ev && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                            {dec && <dec.icon size={12} className={dec.color} />}
                            <span className={`text-[11px] font-bold ${dec?.color ?? "text-gray-500"}`}>{dec?.label}</span>
                            <span className="text-[11px] text-gray-400">·</span>
                            <span className={`text-[11px] font-bold ${ev.finalScore >= 75 ? "text-tahfidz-green" : ev.finalScore >= 60 ? "text-yellow-600" : "text-red-500"}`}>{ev.finalScore}/100</span>
                            <span className="text-[11px] text-gray-400">· {fmtDate(ev.evaluatedAt, L, { day: "2-digit", month: "short" })}</span>
                          </div>
                        )}
                        <VerseUpdater progressId={prog.id} totalVerses={prog.surah.verseCount} currentVerse={prog.currentVerse} onUpdated={() => load(true)} />
                      </div>
                    )
                  })}
                </div>
              )}
              {memorized.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("memorized2")} ({memorized.length})</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {memorized.map(prog => (
                      <div key={prog.id} className="flex items-center gap-3 p-3 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                        <span className="text-emerald-500 text-lg flex-shrink-0">✓</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                          <p className="arabic text-[11px] text-emerald-600">{prog.surah.nameAr}</p>
                        </div>
                        {prog.evaluation && (
                          <p className="text-sm font-bold text-emerald-600 flex-shrink-0">{prog.evaluation.finalScore}/100</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Tab: Évaluations ── */}
      {tab === "evaluations" && (
        <div className="space-y-3">
          {evaluations.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <Star size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">{t("noEval")}</p>
            </div>
          ) : evaluations.map(ev => {
            const dec = DECISION_CFG[ev.decision] ?? DECISION_CFG.NEEDS_REVISION
            const pct = ev.finalScore
            const sColor = pct >= 75 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"
            const sBg = pct >= 75 ? "bg-emerald-50 border-emerald-200" : pct >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
            return (
              <div key={ev.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{ev.progress.surah.nameFr}</p>
                      <p className="arabic text-tahfidz-green text-sm">{ev.progress.surah.nameAr}</p>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t("by")} {ev.teacher.user.fullName} · {fmtDate(ev.evaluatedAt, L)}</p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${sBg}`}>
                    <dec.icon size={12} className={dec.color} />
                    <span className={`text-xs font-bold ${dec.color}`}>{dec.label}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  <div className={`sm:col-span-2 text-center p-3 rounded-xl border-2 ${sBg}`}>
                    <p className={`text-2xl font-bold ${sColor}`}>{pct}</p>
                    <p className="text-[10px] text-gray-400">/100</p>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[...Array(5)].map((_, i) => <Star key={i} size={9} className={i < Math.round(pct / 20) ? "text-yellow-400 fill-yellow-400" : "text-gray-200 fill-gray-200"} />)}
                    </div>
                  </div>
                  <div className="sm:col-span-3 grid grid-cols-2 gap-1.5">
                    {[
                      { l: t("memorization"), v: ev.memorizationScore },
                      { l: t("tajweed"), v: ev.tajweedScore },
                      { l: t("fluency"), v: ev.fluencyScore },
                      { l: t("makharij"), v: ev.makharijScore },
                    ].map(s => (
                      <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-center">
                        <p className={`text-sm font-bold ${s.v >= 75 ? "text-emerald-600" : s.v >= 60 ? "text-amber-600" : "text-red-500"}`}>{s.v}</p>
                        <p className="text-[10px] text-gray-400 truncate">{s.l}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {ev.teacherNotes && (
                  <p className="mt-3 text-xs text-gray-500 italic border-l-2 border-tahfidz-green pl-3">« {ev.teacherNotes} »</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Tab: Présences ── */}
      {tab === "attendance" && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(ATT_CFG).map(([status, cfg]) => {
              const count = attendances.filter(a => a.status === status).length
              return (
                <div key={status} className={`rounded-xl p-3 text-center border ${cfg.cls} bg-opacity-30`}>
                  <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot} mb-1`} />
                  <p className="text-xl font-bold">{count}</p>
                  <p className="text-[10px] font-bold">{cfg.label}</p>
                </div>
              )
            })}
          </div>

          {attendances.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <CalendarCheck size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">{t("noAtt")}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">{t("attendance30")}</p>
              <div className="flex flex-wrap gap-1.5">
                {attendances.map(att => {
                  const cfg = ATT_CFG[att.status] ?? ATT_CFG.ABSENT
                  return (
                    <div key={att.id}
                      title={`${cfg.label} — ${fmtDate(att.date, L, { weekday: "long", day: "2-digit", month: "short" })}${att.notes ? ` — ${att.notes}` : ""}`}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-help transition hover:scale-110 ${cfg.cls}`}>
                      {cfg.short}
                    </div>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
                {Object.entries(ATT_CFG).map(([, cfg]) => (
                  <span key={cfg.label} className="flex items-center gap-1 text-[10px]">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} /> {cfg.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Badges ── */}
      {tab === "badges" && (
        <div>
          {badges.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-10 text-center">
              <Award size={28} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-gray-400">{t("noBadge")}</p>
              <p className="text-xs text-gray-300 mt-1">{t("badgeDesc")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {badges.map(sb => (
                <div key={sb.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center hover:shadow-sm transition shadow-sm">
                  <p className="text-3xl mb-2">{sb.badge.icon}</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{sb.badge.name}</p>
                  <p className={`text-[10px] mt-0.5 font-bold ${sb.badge.rarity === "LEGENDARY" ? "text-yellow-600" : sb.badge.rarity === "EPIC" ? "text-purple-600" : sb.badge.rarity === "RARE" ? "text-blue-600" : "text-gray-400"}`}>{sb.badge.rarity.toLowerCase()}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{fmtDate(sb.earnedAt, L, { day: "2-digit", month: "short" })}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
