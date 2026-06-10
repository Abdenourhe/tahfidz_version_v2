"use client"
// ParentChildProfileClient.tsx — Page détail enfant, scroll unique sans onglets

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ArrowLeft, BookOpen, Star, Award, CalendarCheck, GraduationCap,
  Phone, Mail, RefreshCw, Loader2, CheckCircle2, RotateCcw, X, Clock,
  TrendingUp, Flame, ChevronRight
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { useSession } from "next-auth/react"
import { AvatarUploader } from "@/components/shared/AvatarUploader"
import { TeacherChat } from "@/components/parent/TeacherChat"

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
  teacher?: { user: { id: string; fullName: string; phone?: string | null; email: string } } | null
  _count: { memorizedSurahs: number; studentBadges: number }
}

function fmtDate(d: string, L: string, opts?: Intl.DateTimeFormatOptions) {
  return new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", opts ?? { day: "2-digit", month: "short", year: "numeric" })
}

function fmtAge(dob?: string | null, L: string = "fr"): string | null {
  if (!dob) return null
  const birth = new Date(dob); const now = new Date()
  let y = now.getFullYear() - birth.getFullYear()
  let m = now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) m--
  if (m < 0) { y--; m += 12 }
  if (y < 3) return null
  return m > 0 ? `${y}ans ${m}mois` : `${y}ans`
}

const STATUS_CFG: Record<string, { label: string; bg: string; color: string }> = {
  NOT_STARTED: { label: "Non commencé", bg: "bg-gray-100", color: "text-gray-500" },
  IN_PROGRESS: { label: "En cours", bg: "bg-blue-100", color: "text-blue-700" },
  READY_FOR_RECITATION: { label: "Prêt", bg: "bg-orange-100", color: "text-orange-700" },
  UNDER_REVIEW: { label: "Révision", bg: "bg-yellow-100", color: "text-yellow-700" },
  NEEDS_REVISION: { label: "À réviser", bg: "bg-red-100", color: "text-red-600" },
  MEMORIZED: { label: "Mémorisé", bg: "bg-green-100", color: "text-green-700" },
}

const DECISION_CFG: Record<string, { icon: typeof CheckCircle2; label: string; color: string }> = {
  APPROVED: { icon: CheckCircle2, label: "Validé", color: "text-green-600" },
  NEEDS_REVISION: { icon: RotateCcw, label: "À réviser", color: "text-yellow-600" },
  REJECTED: { icon: X, label: "À refaire", color: "text-red-500" },
}

const ATT_CFG: Record<string, { label: string; short: string; cls: string; dot: string }> = {
  PRESENT: { label: "Présent", short: "✓", cls: "bg-green-100 text-green-700", dot: "bg-green-500" },
  LATE:    { label: "Retard",  short: "~", cls: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  EXCUSED: { label: "Excusé",  short: "E", cls: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  ABSENT:  { label: "Absent",  short: "✗", cls: "bg-red-100 text-red-500", dot: "bg-red-500" },
}

function SectionTitle({ icon: Icon, title, count }: { icon: any; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon size={14} className="text-gray-400" />
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">{title}</h3>
      {count !== undefined && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full font-bold">{count}</span>}
    </div>
  )
}

export function ParentChildProfileClient({ studentId }: { studentId: string }) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentChildProfileClient_2")
  const { data: session } = useSession()
  const parentUserId = session?.user?.id

  const [student, setStudent] = useState<Student | null>(null)
  const [studentAvatar, setStudentAvatar] = useState<string | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastSync, setLastSync] = useState<Date>(new Date())

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const [studRes, progRes, evalRes, attRes] = await Promise.all([
        fetch(`/api/students/${studentId}`),
        fetch(`/api/progress?studentId=${studentId}`),
        fetch(`/api/evaluations?studentId=${studentId}&limit=10`),
        fetch(`/api/attendance?studentId=${studentId}&dateFrom=${(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0] })()}T00:00:00Z`),
      ])
      const [studData, progData, evalData, attData] = await Promise.all([
        studRes.ok ? studRes.json() : null,
        progRes.ok ? progRes.json() : null,
        evalRes.ok ? evalRes.json() : null,
        attRes.ok ? attRes.json() : null,
      ])
      if (studData?.student) {
        setStudent(studData.student)
        setStudentAvatar(studData.student.user.avatar || null)
        setBadges(studData.student.studentBadges || [])
      }
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

  const LEVEL_LABEL: Record<string, string> = { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" }

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
        <Link href="/parent/dashboard" className="mt-4 inline-block text-tahfidz-green hover:underline text-sm">{t("back")}</Link>
      </div>
    )
  }

  const u = student.user

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Link href="/parent/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition">
          <ArrowLeft size={16} /> {t("backProfile")}
        </Link>
        <button onClick={() => load(true)} disabled={refreshing}
          className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition disabled:opacity-50">
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* ── Hero ── */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <AvatarUploader
            currentAvatar={studentAvatar}
            name={u.fullName}
            size={96}
            uploadUrl={`/api/students/${studentId}/avatar`}
            onUploaded={(url) => setStudentAvatar(url)}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{u.fullName}</h1>
            {u.fullNameAr && <p className="arabic text-gray-500 dark:text-gray-400 text-sm">{u.fullNameAr}</p>}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {student.group && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-bold">
                  <BookOpen size={10} /> {student.group.name}
                </span>
              )}
              {student.group?.level && (
                <span className="text-[11px] px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 font-medium">
                  {LEVEL_LABEL[student.group.level] ?? student.group.level}
                </span>
              )}
              {fmtAge(student.dateOfBirth, L) && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 font-medium">
                  <Clock size={10} /> {fmtAge(student.dateOfBirth, L)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-tahfidz-gold bg-tahfidz-gold-light dark:bg-yellow-900/20 px-2 py-1 rounded-lg">
                <Star size={11} className="fill-tahfidz-gold" /> {student.totalStars}
              </span>
              {student.currentStreak > 0 && (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
                  <Flame size={11} /> {student.currentStreak}j
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          {[
            { v: student._count.memorizedSurahs, l: t("memorized"), c: "text-emerald-600" },
            { v: inProgress.length, l: t("inProgress"), c: "text-blue-600" },
            { v: `${attRate}%`, l: t("attendance30"), c: attRate >= 80 ? "text-emerald-600" : attRate >= 60 ? "text-amber-600" : "text-red-500" },
            { v: avgScore ? `${avgScore}/100` : "—", l: t("avgScore"), c: "text-purple-600" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <p className={`text-base sm:text-lg font-bold ${s.c}`}>{s.v}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Enseignant ── */}
      {student.teacher && (
        <div className="bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-900/10 dark:to-gray-900 rounded-2xl border border-emerald-100/60 dark:border-emerald-800/30 p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tahfidz-green to-emerald-600 flex items-center justify-center text-white text-lg font-bold shadow-sm">
                {student.teacher.user.fullName.charAt(0).toUpperCase()}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-base font-bold text-gray-900 dark:text-gray-100">{student.teacher.user.fullName}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 text-tahfidz-green font-semibold tracking-wide">ENSEIGNANT</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> En ligne
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {student.teacher.user.phone && (
              <a href={`tel:${student.teacher.user.phone}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-green-50 hover:text-green-700 hover:border-green-200 transition">
                <Phone size={14} /> Appeler
              </a>
            )}
            <a href={`mailto:${student.teacher.user.email}`} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition">
              <Mail size={14} /> Email
            </a>
            {parentUserId && (
              <div className="flex-1">
                <TeacherChat
                  teacherUserId={student.teacher.user.id}
                  teacherName={student.teacher.user.fullName}
                  parentUserId={parentUserId}
                  childName={student.user.fullName}
                  studentId={studentId}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mémorisation en cours ── */}
      <div>
        <SectionTitle icon={TrendingUp} title={t("inProgress2") || "En cours"} count={inProgress.length} />
        {inProgress.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">{t("noMem")}</p>
        ) : (
          <div className="space-y-3">
            {inProgress.map(prog => {
              const sl = STATUS_CFG[prog.status] ?? STATUS_CFG.IN_PROGRESS
              const ev = prog.evaluation
              const dec = ev?.decision ? DECISION_CFG[ev.decision] : null
              const pct = Math.round(prog.completionPercentage)
              return (
                <div key={prog.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-gray-100">{prog.surah.nameFr}</p>
                        <p className="arabic text-tahfidz-green text-sm">{prog.surah.nameAr}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${sl.bg} ${sl.color} font-bold`}>{sl.label}</span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">Juz {prog.surah.juzNumber} · {prog.surah.verseCount} versets</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-bold text-tahfidz-green">{pct}%</p>
                      <p className="text-[10px] text-gray-400">{prog.currentVerse}/{prog.surah.verseCount}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full gradient-tahfidz rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  {ev && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                      {dec && <dec.icon size={12} className={dec.color} />}
                      <span className={`text-[11px] font-bold ${dec?.color ?? "text-gray-500"}`}>{dec?.label}</span>
                      <span className="text-[11px] text-gray-400">· {ev.finalScore}/100 · {fmtDate(ev.evaluatedAt, L, { day: "2-digit", month: "short" })}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Mémorisées ── */}
      {memorized.length > 0 && (
        <div>
          <SectionTitle icon={CheckCircle2} title={t("memorized2") || "Mémorisées"} count={memorized.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {memorized.map(prog => (
              <div key={prog.id} className="flex items-center gap-3 p-3 bg-emerald-50/60 dark:bg-emerald-900/10 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <span className="text-emerald-500 text-lg">✓</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</p>
                  <p className="arabic text-[11px] text-emerald-600">{prog.surah.nameAr}</p>
                </div>
                {prog.evaluation && <p className="text-sm font-bold text-emerald-600">{prog.evaluation.finalScore}/100</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Évaluations récentes ── */}
      <div>
        <SectionTitle icon={Star} title={t("evaluations") || "Évaluations"} count={evaluations.length} />
        {evaluations.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">{t("noEval")}</p>
        ) : (
          <div className="space-y-3">
            {evaluations.slice(0, 5).map(ev => {
              const dec = DECISION_CFG[ev.decision] ?? DECISION_CFG.NEEDS_REVISION
              const pct = ev.finalScore
              const sColor = pct >= 75 ? "text-emerald-600" : pct >= 60 ? "text-amber-600" : "text-red-500"
              const sBg = pct >= 75 ? "bg-emerald-50 border-emerald-200" : pct >= 60 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"
              return (
                <div key={ev.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 dark:text-gray-100">{ev.progress.surah.nameFr} <span className="arabic text-tahfidz-green text-sm">{ev.progress.surah.nameAr}</span></p>
                      <p className="text-[11px] text-gray-400">{ev.teacher.user.fullName} · {fmtDate(ev.evaluatedAt, L)}</p>
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${sBg}`}>
                      <dec.icon size={12} className={dec.color} />
                      <span className={`text-[11px] font-bold ${dec.color}`}>{dec.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`text-center px-4 py-2 rounded-xl border-2 ${sBg}`}>
                      <p className={`text-xl font-bold ${sColor}`}>{pct}</p>
                      <p className="text-[9px] text-gray-400">/100</p>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      {[
                        { l: "Mém", v: ev.memorizationScore },
                        { l: "Tajwîd", v: ev.tajweedScore },
                        { l: "Fluidité", v: ev.fluencyScore },
                        { l: "Makharij", v: ev.makharijScore },
                      ].map(s => (
                        <div key={s.l} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 text-center">
                          <p className={`text-xs font-bold ${s.v >= 75 ? "text-emerald-600" : s.v >= 60 ? "text-amber-600" : "text-red-500"}`}>{s.v}</p>
                          <p className="text-[9px] text-gray-400">{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {ev.teacherNotes && (
                    <p className="mt-2 text-xs text-gray-500 italic border-l-2 border-tahfidz-green pl-3">« {ev.teacherNotes} »</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Présences ── */}
      <div>
        <SectionTitle icon={CalendarCheck} title={t("attendance") || "Présences"} count={attendances.length} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {Object.entries(ATT_CFG).map(([status, cfg]) => {
            const count = attendances.filter(a => a.status === status).length
            return (
              <div key={status} className={`rounded-xl p-2.5 text-center border ${cfg.cls} bg-opacity-30`}>
                <span className={`inline-block w-2 h-2 rounded-full ${cfg.dot} mb-1`} />
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[9px] font-bold">{cfg.label}</p>
              </div>
            )
          })}
        </div>
        {attendances.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">{t("noAtt")}</p>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
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

      {/* ── Badges ── */}
      <div>
        <SectionTitle icon={Award} title={t("badges") || "Badges"} count={badges.length} />
        {badges.length === 0 ? (
          <p className="text-sm text-gray-400 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">{t("noBadge")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {badges.map(sb => (
              <div key={sb.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center shadow-sm">
                <p className="text-3xl mb-2">{sb.badge.icon}</p>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{sb.badge.name}</p>
                <p className={`text-[10px] mt-0.5 font-bold ${sb.badge.rarity === "LEGENDARY" ? "text-yellow-600" : sb.badge.rarity === "EPIC" ? "text-purple-600" : sb.badge.rarity === "RARE" ? "text-blue-600" : "text-gray-400"}`}>{sb.badge.rarity.toLowerCase()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
