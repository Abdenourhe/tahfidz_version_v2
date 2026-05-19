"use client"
// src/app/teacher/progress/page.tsx

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Loader2, Plus, Search } from "lucide-react"
import { statusLabel } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"

interface Surah { id: number; nameFr: string; nameAr: string; verseCount: number; juzNumber: number; difficultyLevel: number }
interface Student { id: string; user: { fullName: string }; group: { name: string } | null }
interface Progress {
  id: string
  studentId: string
  surahId: number
  status: string
  completionPercentage: number
  currentVerse: number
  surah: { nameFr: string; nameAr: string; verseCount: number }
}

export default function TeacherProgressPage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const { data: session } = useSession()

  const T = {
    title:        { fr: "Suivi mémorisation",       en: "Memorization tracking", ar: "متابعة الحفظ" },
    subtitle:     { fr: "Assigner des sourates et mettre à jour la progression",
                    en: "Assign surahs and update progress",
                    ar: "تعيين السور وتحديث التقدم" },
    selectStudent:{ fr: "Sélectionner un élève",    en: "Select a student",      ar: "اختيار طالب" },
    search:       { fr: "Rechercher…",              en: "Search…",               ar: "بحث…" },
    noStudent:    { fr: "Aucun élève",              en: "No students",           ar: "لا يوجد طلاب" },
    progress:     { fr: "Progression",              en: "Progress",              ar: "التقدم" },
    of:           { fr: "de",                       en: "of",                    ar: "من" },
    noProgress:   { fr: "Aucune sourate assignée",  en: "No surah assigned",     ar: "لا توجد سور معينة" },
    selectFirst:  { fr: "Sélectionnez un élève",    en: "Select a student",      ar: "اختر طالباً" },
    assign:       { fr: "Assigner une sourate",     en: "Assign a surah",        ar: "تعيين سورة" },
    searchSurah:  { fr: "Nom, numéro…",             en: "Name, number…",         ar: "اسم، رقم…" },
    selectFirst2: { fr: "Sélectionnez un élève d'abord", en: "Select a student first", ar: "اختر طالباً أولاً" },
    allAssigned:  { fr: "Toutes les sourates sont déjà assignées", en: "All surahs already assigned", ar: "تم تعيين جميع السور" },
    assigned:     { fr: "Sourate assignée !",       en: "Surah assigned!",       ar: "تم تعيين السورة!" },
    toReview:     { fr: "→ En révision",            en: "→ Under review",        ar: "→ قيد المراجعة" },
    noGroup:      { fr: "Sans groupe",               en: "No group",              ar: "بلا مجموعة" },
    memorized:    { fr: "✓ Mémorisé",               en: "✓ Memorized",           ar: "✓ محفوظ" },
    revision:     { fr: "↺ Révision",               en: "↺ Revision",            ar: "↺ مراجعة" },
    approve:      { fr: "✓ Approuver",              en: "✓ Approve",             ar: "✓ تصديق" },
    verse:        { fr: "versets",                  en: "verses",                ar: "آيات" },
    juz:          { fr: "Juz",                      en: "Juz",                   ar: "جزء" },
    started:      { fr: "Commencé le",              en: "Started on",            ar: "بدأ في" },
  }
  const t = (k: keyof typeof T) => T[k][L] ?? T[k].fr

  const [students, setStudents] = useState<Student[]>([])
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedStudent, setSelectedStudent] = useState("")
  const [studentProgress, setStudentProgress] = useState<Progress[]>([])
  const [search, setSearch] = useState("")
  const [surahSearch, setSurahSearch] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/students").then(r => r.json()).then(d => setStudents(d.students || []))
    fetch("/api/surahs").then(r => r.json()).then(d => setSurahs(d.surahs || []))
  }, [])

  useEffect(() => {
    if (!selectedStudent) return
    fetch(`/api/progress?studentId=${selectedStudent}`)
      .then(r => r.json())
      .then(d => setStudentProgress(d.progress || []))
  }, [selectedStudent])

  const assignSurah = async (surahId: number) => {
    if (!selectedStudent) return
    setAssigning(true)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent, surahId, status: "IN_PROGRESS" }),
      })
      const d = await fetch(`/api/progress?studentId=${selectedStudent}`).then(r => r.json())
      setStudentProgress(d.progress || [])
      setSuccessMsg(t("assigned"))
      setTimeout(() => setSuccessMsg(null), 2000)
    } finally {
      setAssigning(false)
    }
  }

  const updateStatus = async (progressId: string, surahId: number, newStatus: string) => {
    if (!selectedStudent) return
    setUpdating(progressId)
    try {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedStudent, surahId, status: newStatus }),
      })
      const d = await fetch(`/api/progress?studentId=${selectedStudent}`).then(r => r.json())
      setStudentProgress(d.progress || [])
    } finally {
      setUpdating(null)
    }
  }

  const filteredStudents = students.filter(s =>
    s.user.fullName.toLowerCase().includes(search.toLowerCase())
  )

  const currentStudent = students.find(s => s.id === selectedStudent)
  const progressSurahIds = new Set(studentProgress.map(p => p.surahId))

  const filteredSurahs = surahs.filter(s =>
    !progressSurahIds.has(s.id) &&
    (s.nameFr.toLowerCase().includes(surahSearch.toLowerCase()) ||
     s.nameAr.includes(surahSearch) ||
     s.id.toString().includes(surahSearch))
  )

  const fmtDate = (d: string) => new Date(d).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", { day: "2-digit", month: "short" })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-300 text-sm font-medium">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sélection élève */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{t("selectStudent")}</h2>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder={t("search")}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredStudents.map(s => (
              <button key={s.id} onClick={() => setSelectedStudent(s.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition ${selectedStudent === s.id ? "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-semibold" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"}`}>
                <p className="font-medium">{s.user.fullName}</p>
                <p className="text-xs text-gray-400">{s.group?.name ?? t("noGroup")}</p>
              </button>
            ))}
            {filteredStudents.length === 0 && <p className="text-xs text-gray-400 text-center py-4">{t("noStudent")}</p>}
          </div>
        </div>

        {/* Progression actuelle */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {currentStudent ? `${t("progress")} ${t("of")} ${currentStudent.user.fullName}` : t("progress")}
          </h2>

          {!selectedStudent ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("selectFirst")}</p>
          ) : studentProgress.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("noProgress")}</p>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {studentProgress.map(prog => {
                const sl = statusLabel(prog.status)
                const nextStatuses: { value: string; label: string }[] = prog.status === "IN_PROGRESS"
                  ? [{ value: "UNDER_REVIEW", label: t("toReview") }, { value: "MEMORIZED", label: t("memorized") }]
                  : prog.status === "UNDER_REVIEW"
                  ? [{ value: "MEMORIZED", label: t("memorized") }, { value: "NEEDS_REVISION", label: t("revision") }]
                  : prog.status === "READY_FOR_RECITATION" || prog.status === "PENDING_TEACHER_APPROVAL"
                  ? [{ value: "MEMORIZED", label: t("approve") }, { value: "NEEDS_REVISION", label: t("revision") }]
                  : []

                return (
                  <div key={prog.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{prog.surah.nameFr}</span>
                      <span className="arabic text-xs text-tahfidz-green">{prog.surah.nameAr}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`}>{sl.label}</span>
                      <span className="text-xs text-gray-400">{Math.round(prog.completionPercentage)}%</span>
                    </div>
                    <div className="progress-bar mb-2">
                      <div className="progress-bar-fill" style={{ width: `${prog.completionPercentage}%` }} />
                    </div>
                    {nextStatuses.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-1">
                        {nextStatuses.map(ns => (
                          <button key={ns.value} onClick={() => updateStatus(prog.id, prog.surahId, ns.value)} disabled={updating === prog.id}
                            className="text-xs px-2.5 py-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-tahfidz-green hover:text-tahfidz-green transition disabled:opacity-50">
                            {ns.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
