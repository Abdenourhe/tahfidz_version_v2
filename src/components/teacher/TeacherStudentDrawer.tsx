"use client"
// src/components/teacher/TeacherStudentDrawer.tsx
// Drawer latéral avec la fiche complète d'un élève depuis le tableau mémorisation.

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn, formatDate, statusLabel, scoreToGrade, formatAge } from "@/lib/utils"
import {
  X, Star, BookOpen, CalendarCheck, Award, NotebookPen, Phone, Mail,
  GraduationCap, User, Globe, Languages, ExternalLink, Trash2, Loader2,
} from "lucide-react"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { TeacherDailyLogModal } from "@/components/teacher/TeacherDailyLogModal"

interface Surah {
  id: number
  nameFr: string
  nameAr: string
  verseCount: number
}

interface Assignment {
  id: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null }
  }
  surah: Surah
  versesFrom: number | null
  versesTo: number | null
  dueDate: string | null
  status: string
  currentVerse: number
  completionPercentage: number
  notes: string | null
}

interface StudentApi {
  id: string
  dateOfBirth: string | null
  emergencyPhone: string | null
  nationality: string | null
  spokenLanguages: string | null
  totalStars: number
  currentStreak: number
  user: {
    id: string
    fullName: string
    fullNameAr?: string | null
    email: string | null
    phone: string | null
    gender: string | null
    avatar: string | null
  }
  group: { id: string; name: string; level: string } | null
  teacher: { user: { fullName: string; phone: string | null; email: string | null } } | null
  parentLinks: {
    id: string
    relation: string
    parent: {
      nationality: string | null
      spokenLanguages: string | null
      user: { fullName: string; fullNameAr?: string | null; phone: string | null; email: string | null }
    }
  }[]
  memorizationProgress: {
    id: string
    status: string
    completionPercentage: number
    currentVerse: number
    startVerse: number
    endVerse: number
    versesFrom: number | null
    versesTo: number | null
    dueDate: string | null
    surah: Surah
    evaluation: { finalScore: number; decision: string } | null
    statusHistory: { status: string; changedAt: string }[]
  }[]
  attendances: { date: string; status: string }[]
  studentBadges: { earnedAt: string; badge: { icon: string; name: string; rarity: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  open: boolean
  onClose: () => void
  studentId: string
  assignments?: Assignment[]
  onAssignmentsChange?: () => void
}

const ATT_STYLE: Record<string, string> = {
  PRESENT: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  LATE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  EXCUSED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ABSENT: "bg-red-100 text-red-500 dark:bg-red-900/30 dark:text-red-300",
}
const ATT_ICON: Record<string, string> = { PRESENT: "✓", LATE: "~", EXCUSED: "E", ABSENT: "✗" }

export function TeacherStudentDrawer({ open, onClose, studentId, assignments: propAssignments, onAssignmentsChange }: Props) {
  const { locale, dir } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherStudentDetailClient")
  const tm = useT("teacherMemorizationPanel")

  const [student, setStudent] = useState<StudentApi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [logModal, setLogModal] = useState<Assignment | null>(null)

  useLockBodyScroll(open)

  const load = useCallback(async () => {
    if (!open || !studentId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/students/${studentId}`)
      if (!res.ok) throw new Error("Élève introuvable")
      const data = await res.json()
      setStudent(data.student)
    } catch (e: any) {
      setError(e.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }, [open, studentId])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm(tm("confirmDelete") || "Supprimer ?")) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/memorization/assign?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Erreur")
      } else {
        onAssignmentsChange?.()
        load()
      }
    } finally {
      setDeletingId(null)
    }
  }

  const inProgressAssignments = propAssignments
    ? propAssignments.filter((a) => a.status !== "MEMORIZED")
    : student?.memorizationProgress.filter((p) => p.status !== "MEMORIZED") || []

  const memorizedAssignments = propAssignments
    ? propAssignments.filter((a) => a.status === "MEMORIZED")
    : student?.memorizationProgress.filter((p) => p.status === "MEMORIZED") || []

  const totalAtt = student?.attendances.length || 0
  const presentAtt = student?.attendances.filter((a) => a.status === "PRESENT" || a.status === "LATE").length || 0
  const attRate = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : 0

  const relationLabel = (rel: string) => {
    if (rel === "father") return t("father")
    if (rel === "mother") return t("mother")
    return t("guardian")
  }

  const nationalityLabel = (code?: string | null) => {
    if (!code) return ""
    const map: Record<string, Record<string, string>> = {
      fr: { DZ: "Algérien(ne)", MA: "Marocain(e)", TN: "Tunisien(ne)", EG: "Égyptien(ne)", SA: "Saoudien(ne)", AE: "Émirien(ne)", QA: "Qatari(e)", KW: "Koweïtien(ne)", LB: "Libanais(e)", SY: "Syrien(ne)", IQ: "Irakien(ne)", JO: "Jordanien(ne)", PS: "Palestinien(ne)", SD: "Soudanais(e)", LY: "Libyen(ne)", MR: "Mauritanien(ne)", SO: "Somalien(ne)", TR: "Turc/Turque", CA: "Canadien(ne)", OTHER: "Autre" },
      en: { DZ: "Algerian", MA: "Moroccan", TN: "Tunisian", EG: "Egyptian", SA: "Saudi", AE: "Emirati", QA: "Qatari", KW: "Kuwaiti", LB: "Lebanese", SY: "Syrian", IQ: "Iraqi", JO: "Jordanian", PS: "Palestinian", SD: "Sudanese", LY: "Libyan", MR: "Mauritanian", SO: "Somali", TR: "Turkish", CA: "Canadian", OTHER: "Other" },
      ar: { DZ: "جزائري(ة)", MA: "مغربي(ة)", TN: "تونسي(ة)", EG: "مصري(ة)", SA: "سعودي(ة)", AE: "إماراتي(ة)", QA: "قطري(ة)", KW: "كويتي(ة)", LB: "لبناني(ة)", SY: "سوري(ة)", IQ: "عراقي(ة)", JO: "أردني(ة)", PS: "فلسطيني(ة)", SD: "سوداني(ة)", LY: "ليبي(ة)", MR: "موريتاني(ة)", SO: "صومالي(ة)", TR: "تركي(ة)", CA: "كندي(ة)", OTHER: "أخرى" },
    }
    return map[L]?.[code] ?? code
  }

  const languageLabel = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      fr: { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" },
      en: { ar: "Arabic", fr: "French", en: "English", other: "Other" },
      ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية", other: "أخرى" },
    }
    return map[L]?.[key] ?? key
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: dir === "rtl" ? "-100%" : "100%" }}
            animate={{ x: 0 }}
            exit={{ x: dir === "rtl" ? "-100%" : "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "relative z-10 flex flex-col overflow-hidden bg-white dark:bg-gray-900 shadow-2xl",
              "h-full w-[calc(100%-1.5rem)] max-w-md rounded-l-2xl border-l border-gray-200 dark:border-gray-800",
              "sm:w-[520px] sm:max-w-none sm:rounded-l-none"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{t("title")}</h2>
              <div className="flex items-center gap-2">
                <Link
                  href={`/teacher/students/${studentId}`}
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-500 hover:text-tahfidz-green hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  title={t("fullProfile")}
                >
                  <ExternalLink size={18} />
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {loading && (
                <div className="flex justify-center py-12">
                  <Loader2 className="animate-spin text-tahfidz-green" size={28} />
                </div>
              )}

              {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 text-sm text-center">
                  {error}
                </div>
              )}

              {!loading && student && (
                <>
                  {/* Carte identité */}
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center flex-shrink-0 overflow-hidden">
                      <AvatarLightbox
                        src={student.user.avatar}
                        alt={student.user.fullName}
                        fallback={<span className="text-white font-bold text-2xl">{student.user.fullName.charAt(0)}</span>}
                        className="w-full h-full"
                        imgClassName="w-full h-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{student.user.fullName}</h3>
                      {student.user.fullNameAr && <p className="arabic text-sm text-gray-500 dark:text-gray-400">{student.user.fullNameAr}</p>}
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800">
                          <GraduationCap size={12} /> {student.group?.name ?? "—"}
                        </span>
                        {student.user.gender && (
                          <span className="capitalize">{student.user.gender.toLowerCase()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coordonnées */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                    {student.user.phone && (
                      <a href={`tel:${student.user.phone}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-tahfidz-green">
                        <Phone size={14} /> {student.user.phone}
                      </a>
                    )}
                    {student.user.email && (
                      <a href={`mailto:${student.user.email}`} className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-tahfidz-green">
                        <Mail size={14} /> {student.user.email}
                      </a>
                    )}
                    {student.dateOfBirth && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <User size={14} /> {formatAge(student.dateOfBirth)}
                      </div>
                    )}
                    {student.nationality && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Globe size={14} /> {nationalityLabel(student.nationality)}
                      </div>
                    )}
                    {student.spokenLanguages && (
                      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                        <Languages size={14} /> {student.spokenLanguages.split(",").map((k) => languageLabel(k.trim())).filter(Boolean).join(" · ")}
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { icon: Star, label: t("stars"), value: student.totalStars, color: "text-tahfidz-gold" },
                      { icon: BookOpen, label: t("memorized2"), value: student._count.memorizedSurahs, color: "text-tahfidz-green" },
                      { icon: CalendarCheck, label: `${t("attendance")} ${attRate}%`, value: `${presentAtt}/${totalAtt}`, color: "text-blue-600" },
                      { icon: Award, label: t("badges"), value: student.studentBadges.length, color: "text-purple-600" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-3 text-center">
                        <s.icon size={18} className={`${s.color} mx-auto mb-1`} />
                        <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[10px] text-gray-400">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Parents */}
                  {student.parentLinks.length > 0 && (
                    <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl p-4">
                      <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 mb-3">👨‍👩‍👦 {t("contacts")}</p>
                      <div className="space-y-3">
                        {student.parentLinks.map((link) => (
                          <div key={link.id} className="bg-white dark:bg-gray-900 rounded-lg p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-800 dark:text-gray-200">{link.parent.user.fullName}</p>
                              <span className="text-[10px] bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-1.5 py-0.5 rounded">
                                {relationLabel(link.relation)}
                              </span>
                            </div>
                            {link.parent.user.phone && (
                              <a href={`tel:${link.parent.user.phone}`} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                                📱 {link.parent.user.phone}
                              </a>
                            )}
                            <a href={`mailto:${link.parent.user.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                              ✉️ {link.parent.user.email}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Présences récentes */}
                  {student.attendances.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">{t("recentAtt")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {student.attendances.map((att, i) => (
                          <div
                            key={i}
                            title={formatDate(att.date, { weekday: "long", day: "numeric", month: "short" })}
                            className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold", ATT_STYLE[att.status] ?? "bg-gray-100")}
                          >
                            {ATT_ICON[att.status] ?? "?"}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assignations en cours */}
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
                      {t("inProgress2")} ({inProgressAssignments.length})
                    </h4>
                    {inProgressAssignments.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">{t("noProgress")}</p>
                    ) : (
                      <div className="space-y-3">
                        {(propAssignments || student.memorizationProgress).map((a: any) => {
                          if (a.status === "MEMORIZED") return null
                          const sl = statusLabel(a.status)
                          const isProp = "student" in a
                          return (
                            <div key={a.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-800 dark:text-gray-200">{a.surah.nameFr}</span>
                                  <span className="arabic text-xs text-tahfidz-green">{a.surah.nameAr}</span>
                                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", sl.bg, sl.color)}>{sl.label}</span>
                                </div>
                                <div className="flex items-center gap-0.5">
                                  {a.status !== "MEMORIZED" && (
                                    <>
                                      <Link
                                        href={`/teacher/evaluation/new?studentId=${studentId}${a.id ? `&progressId=${a.id}` : ""}`}
                                        title={tm("evaluate")}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-gold hover:bg-white dark:hover:bg-gray-700 transition"
                                      >
                                        <BookOpen size={15} />
                                      </Link>
                                      <button
                                        onClick={() => isProp ? setLogModal(a as Assignment) : setLogModal({
                                          id: a.id,
                                          student: { id: studentId, user: { fullName: student.user.fullName, fullNameAr: student.user.fullNameAr } },
                                          surah: a.surah,
                                          versesFrom: a.versesFrom ?? a.startVerse,
                                          versesTo: a.versesTo ?? a.endVerse,
                                          dueDate: a.dueDate, status: a.status,
                                          currentVerse: a.currentVerse, completionPercentage: a.completionPercentage, notes: null,
                                        })}
                                        title={tm("fillInDailyLog") || "Carnet"}
                                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-gray-700 transition"
                                      >
                                        <NotebookPen size={15} />
                                      </button>
                                    </>
                                  )}
                                  <button
                                    onClick={() => handleDelete(a.id)}
                                    disabled={deletingId === a.id}
                                    title={tm("delete")}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 transition disabled:opacity-50"
                                  >
                                    {deletingId === a.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                                  </button>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-tahfidz-green rounded-full" style={{ width: `${a.completionPercentage}%` }} />
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>{a.versesFrom ?? a.startVerse}-{a.versesTo ?? a.endVerse} {t("verse")}</span>
                                <span>{Math.round(a.completionPercentage)}%</span>
                              </div>
                              {a.dueDate && (
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {t("dueDate")} : {formatDate(a.dueDate, L)}
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assignations mémorisées */}
                  {memorizedAssignments.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("memorized3")} ({memorizedAssignments.length}) ✓</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {memorizedAssignments.map((a: any) => {
                          const grade = a.evaluation ? scoreToGrade(a.evaluation.finalScore) : null
                          return (
                            <div key={a.id} className="flex items-center gap-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg">
                              <span className="text-tahfidz-green text-base">✓</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{a.surah.nameFr}</p>
                                <p className="arabic text-xs text-tahfidz-green">{a.surah.nameAr}</p>
                              </div>
                              {grade && <span className={cn("text-xs font-bold flex-shrink-0", grade.color)}>{a.evaluation.finalScore}/100</span>}
                              <button
                                onClick={() => handleDelete(a.id)}
                                disabled={deletingId === a.id}
                                title={tm("delete")}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-gray-700 transition disabled:opacity-50"
                              >
                                {deletingId === a.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Modal carnet */}
            {logModal && (
              <TeacherDailyLogModal
                studentId={studentId}
                studentName={L === "ar" && student?.user.fullNameAr ? student.user.fullNameAr : student?.user.fullName || ""}
                date={new Date().toISOString().split("T")[0]}
                defaultSection="HIFZ"
                singleSection={true}
                lastLog={{}}
                memorizationAssignments={[{
                  id: logModal.id,
                  surahId: logModal.surah.id,
                  status: logModal.status,
                  completionPercentage: logModal.completionPercentage,
                  currentVerse: logModal.currentVerse,
                  startVerse: logModal.versesFrom ?? 1,
                  endVerse: logModal.versesTo ?? logModal.surah.verseCount,
                  surah: logModal.surah,
                }]}
                defaultMemorizationProgressId={logModal.id}
                onClose={() => setLogModal(null)}
                onSaved={() => {
                  setLogModal(null)
                  onAssignmentsChange?.()
                  load()
                }}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
