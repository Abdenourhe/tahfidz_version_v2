"use client"
import { useState, useEffect } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { createEvaluation } from "@/app/teacher/evaluations/actions"
import { XCircle, ChevronRight, ChevronLeft, Loader2, User, BookOpen, Award, CheckCircle } from "lucide-react"

interface Student {
  id: string
  user: { fullName: string; fullNameAr: string | null }
}

interface Assignment {
  id: string
  surah: { id: number; nameFr: string; nameAr: string; verseCount: number }
  versesFrom: number | null
  versesTo: number | null
  status: string
}

interface Props {
  open: boolean
  students: Student[]
  onClose: () => void
}

export function TeacherEvaluationModal({ open, students, onClose }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherEvaluations")

  const [step, setStep] = useState(1)
  const [selectedStudent, setSelectedStudent] = useState("")
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState("")

  const [scores, setScores] = useState({ tajwid: 75, makhraj: 75, waqf: 75, tarteel: 75 })
  const [notes, setNotes] = useState("")

  const [decision, setDecision] = useState<"APPROVED" | "NEEDS_REVISION" | "REJECTED">("APPROVED")
  const [reason, setReason] = useState("")

  const [submitting, setSubmitting] = useState(false)

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1)
      setSelectedStudent("")
      setAssignments([])
      setSelectedAssignment("")
      setScores({ tajwid: 75, makhraj: 75, waqf: 75, tarteel: 75 })
      setNotes("")
      setDecision("APPROVED")
      setReason("")
      setSubmitting(false)
    }
  }, [open])

  // Load assignments when student selected
  useEffect(() => {
    if (!selectedStudent) return
    setAssignmentsLoading(true)
    fetch("/api/memorization/assign")
      .then(r => r.json())
      .then(data => {
        const all = data.assignments || []
        const filtered = all.filter((a: any) => a.student?.user?.id === selectedStudent || a.studentId === selectedStudent)
        setAssignments(filtered.map((a: any) => ({
          id: a.id,
          surah: a.surah,
          versesFrom: a.versesFrom,
          versesTo: a.versesTo,
          status: a.status,
        })))
      })
      .finally(() => setAssignmentsLoading(false))
  }, [selectedStudent])

  if (!open) return null

  const selectedStudentObj = students.find(s => s.id === selectedStudent)
  const selectedAssignmentObj = assignments.find(a => a.id === selectedAssignment)

  const avgScore = Math.round((scores.tajwid + scores.makhraj + scores.waqf + scores.tarteel) / 4)

  const handleSubmit = async () => {
    if (!selectedAssignment || !selectedStudent) return
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append("progressId", selectedAssignment)
      formData.append("studentId", selectedStudent)
      formData.append("tajwid", String(scores.tajwid))
      formData.append("makhraj", String(scores.makhraj))
      formData.append("waqf", String(scores.waqf))
      formData.append("tarteel", String(scores.tarteel))
      formData.append("decision", decision)
      formData.append("notes", notes + (reason ? `\nRaison : ${reason}` : ""))
      await createEvaluation(formData)
      onClose()
      // Refresh page
      window.location.reload()
    } catch (e: any) {
      alert(e.message || "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  const canNext =
    (step === 1 && selectedStudent) ||
    (step === 2 && selectedAssignment) ||
    (step === 3 && true) ||
    (step === 4 && true)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("newEvaluationTitle")}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition">
            <XCircle size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? "bg-tahfidz-green" : "bg-gray-200 dark:bg-gray-700"}`} />
          ))}
        </div>

        <div className="p-6 space-y-4">
          {/* Step 1 : Student */}
          {step === 1 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <User size={16} /> {t("step1")}
              </label>
              <select
                value={selectedStudent}
                onChange={e => { setSelectedStudent(e.target.value); setSelectedAssignment("") }}
                className="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                <option value="">{L === "ar" ? "اختر طالباً..." : L === "en" ? "Select a student..." : "Sélectionner un élève..."}</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.user.fullName}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2 : Surah */}
          {step === 2 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <BookOpen size={16} /> {t("step2")}
              </label>
              {assignmentsLoading ? (
                <Loader2 className="animate-spin text-gray-400" size={20} />
              ) : assignments.length === 0 ? (
                <p className="text-sm text-gray-400">{L === "ar" ? "لا توجد سور معينة" : L === "en" ? "No surah assigned" : "Aucune sourate assignée"}</p>
              ) : (
                <div className="space-y-2">
                  {assignments.map(a => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAssignment(a.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition ${
                        selectedAssignment === a.id
                          ? "border-tahfidz-green bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green"
                          : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span className="font-medium">{L === "ar" ? a.surah.nameAr : a.surah.nameFr}</span>
                      <span className="text-xs text-gray-400 ml-2">(V. {a.versesFrom ?? 1}-{a.versesTo ?? a.surah.verseCount})</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3 : Scores */}
          {step === 3 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Award size={16} /> {t("step3")} — <span className="text-tahfidz-green font-bold">{avgScore}/100</span>
              </label>
              {[
                { key: "tajwid" as const, label: t("tajwid") },
                { key: "makhraj" as const, label: t("makhraj") },
                { key: "waqf" as const, label: t("waqf") },
                { key: "tarteel" as const, label: t("tarteel") },
              ].map(item => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{scores[item.key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={scores[item.key]}
                    onChange={e => setScores(prev => ({ ...prev, [item.key]: parseInt(e.target.value) }))}
                    className="w-full accent-tahfidz-green"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  rows={3}
                  placeholder={L === "ar" ? "ملاحظات..." : L === "en" ? "Notes..." : "Notes..."}
                />
              </div>
            </div>
          )}

          {/* Step 4 : Decision */}
          {step === 4 && (
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <CheckCircle size={16} /> {t("step4")}
              </label>
              <div className="space-y-2">
                {[
                  { value: "APPROVED" as const, label: t("approvedLabel"), color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20 border-green-200" },
                  { value: "NEEDS_REVISION" as const, label: t("revisionLabel"), color: "text-yellow-600", bg: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200" },
                  { value: "REJECTED" as const, label: t("rejectedLabel"), color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20 border-red-200" },
                ].map(d => (
                  <button
                    key={d.value}
                    onClick={() => setDecision(d.value)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition ${
                      decision === d.value ? `${d.bg} ${d.color} ring-2 ring-offset-1 ring-tahfidz-green` : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {decision !== "APPROVED" && (
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{L === "ar" ? "السبب" : L === "en" ? "Reason" : "Raison"}</label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                    rows={2}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 dark:border-gray-800">
          {step > 1 ? (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex items-center gap-1 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              <ChevronLeft size={16} /> {L === "ar" ? "رجوع" : L === "en" ? "Back" : "Retour"}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            >
              {t("cancel")}
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext}
              className="flex items-center gap-1 px-4 py-2 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-40"
            >
              {L === "ar" ? "التالي" : L === "en" ? "Next" : "Suivant"} <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 bg-tahfidz-green text-white text-sm font-medium rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
              {submitting ? t("evaluating") : t("evaluate")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
