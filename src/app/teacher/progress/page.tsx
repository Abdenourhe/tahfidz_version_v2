"use client"
// src/app/teacher/progress/page.tsx

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Loader2, Plus, Search, BookOpen } from "lucide-react"
import { statusLabel } from "@/lib/utils"
import { useLanguage, useT } from "@/contexts/LanguageContext"

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
  const searchParams = useSearchParams() ?? new URLSearchParams()
  const urlStudentId = searchParams.get("studentId")

  const t = useT("progressX")

  const [students, setStudents] = useState<Student[]>([])
  const [surahs, setSurahs] = useState<Surah[]>([])
  const [selectedStudent, setSelectedStudent] = useState(urlStudentId || "")
  const [studentProgress, setStudentProgress] = useState<Progress[]>([])
  const [search, setSearch] = useState("")
  const [surahSearch, setSurahSearch] = useState("")
  const [assigning, setAssigning] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/students").then(r => r.json()),
      fetch("/api/surahs").then(r => r.json()),
    ]).then(([sd, qd]) => {
      setStudents(sd.students || [])
      setSurahs(qd.surahs || [])
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    if (!selectedStudent) {
      setStudentProgress([])
      return
    }
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <Loader2 size={28} className="animate-spin text-tahfidz-green" />
      </div>
    )
  }

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
        {/* ── Colonne 1 : Sélection élève ── */}
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

        {/* ── Colonne 2 : Progression actuelle ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {currentStudent ? `${t("progress")} — ${currentStudent.user.fullName}` : t("progress")}
          </h2>

          {!selectedStudent ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("selectFirst")}</p>
          ) : studentProgress.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">{t("noProgress")}</p>
            </div>
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

        {/* ── Colonne 3 : Assigner une sourah ── */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            {t("assign")}
          </h2>

          {!selectedStudent ? (
            <p className="text-sm text-gray-400 text-center py-8">{t("selectFirst")}</p>
          ) : (
            <>
              <div className="relative mb-3">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={surahSearch} onChange={e => setSurahSearch(e.target.value)}
                  placeholder={t("searchSurah") || "Rechercher une sourah..."}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
              </div>

              <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
                {filteredSurahs.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    {progressSurahIds.size === 0 ? t("noProgress") : t("allAssigned")}
                  </p>
                ) : (
                  filteredSurahs.map(s => (
                    <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{s.id}. {s.nameFr}</p>
                        <p className="arabic text-xs text-tahfidz-green">{s.nameAr}</p>
                        <p className="text-[10px] text-gray-400">{s.verseCount} versets</p>
                      </div>
                      <button
                        onClick={() => assignSurah(s.id)}
                        disabled={assigning}
                        className="flex items-center gap-1 text-xs px-2.5 py-1.5 bg-tahfidz-green text-white rounded-lg hover:opacity-90 transition disabled:opacity-50 flex-shrink-0"
                      >
                        {assigning ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                        {t("assign")}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
