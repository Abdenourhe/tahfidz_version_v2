"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { Plus, BookOpen, Calendar, X, Loader2, Trash2, Edit3 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface StudentOption {
  id: string
  fullName: string
}

interface SurahOption {
  id: number
  nameFr: string
  nameAr: string
  verseCount: number
}

interface Assignment {
  id: string
  student: { user: { fullName: string; fullNameAr?: string | null } }
  surah: { id: number; nameFr: string; nameAr: string; verseCount: number }
  versesFrom: number | null
  versesTo: number | null
  dueDate: Date | null
  status: string
  currentVerse: number
  completionPercentage: number
  notes: string | null
}

export default function TeacherMemorizationPanel() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherMemorizationPanel")

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [surahs, setSurahs] = useState<SurahOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    studentId: "",
    surahId: "",
    versesFrom: "",
    versesTo: "",
    dueDate: "",
    notes: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [aRes, sRes, qRes] = await Promise.all([
        fetch("/api/memorization/assign"),
        fetch("/api/students"),
        fetch("/api/surahs"),
      ])
      const aData = await aRes.json()
      const sData = await sRes.json()
      const qData = await qRes.json()
      setAssignments(aData.assignments || [])
      setStudents((sData.students || []).map((s: any) => ({ id: s.id, fullName: s.user?.fullName || "" })))
      setSurahs(qData.surahs || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const surah = surahs.find((s) => s.id === Number(form.surahId))
      const res = await fetch("/api/memorization/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          surahId: Number(form.surahId),
          versesFrom: form.versesFrom ? Number(form.versesFrom) : undefined,
          versesTo: form.versesTo ? Number(form.versesTo) : undefined,
          dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      setShowForm(false)
      setForm({ studentId: "", surahId: "", versesFrom: "", versesTo: "", dueDate: "", notes: "" })
      load()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete") || "Supprimer ?")) return
    const res = await fetch(`/api/memorization/assign?id=${id}`, { method: "DELETE" })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert(err.error || "Erreur")
    }
    load()
  }

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      ASSIGNED: "bg-blue-100 text-blue-700",
      IN_PROGRESS: "bg-amber-100 text-amber-700",
      MEMORIZED: "bg-emerald-100 text-emerald-700",
      NEEDS_REVISION: "bg-red-100 text-red-700",
    }
    return map[status] || "bg-gray-100 text-gray-600"
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("myAssignments")}</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-tahfidz-green text-white rounded-lg text-sm hover:opacity-90"
        >
          <Plus size={14} /> {t("assignSurah")}
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg">{t("assignSurah")}</h4>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t("student")}</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                >
                  <option value="">{t("chooseStudent")}</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("surah")}</label>
                <select
                  value={form.surahId}
                  onChange={(e) => setForm({ ...form, surahId: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                >
                  <option value="">{t("chooseSurah")}</option>
                  {surahs.map((s) => (
                    <option key={s.id} value={s.id}>
                      {L === "ar" ? s.nameAr : `${s.id}. ${s.nameFr}`} ({s.verseCount} {t("verses")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("versesFrom")}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.versesFrom}
                    onChange={(e) => setForm({ ...form, versesFrom: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    placeholder="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("versesTo")}</label>
                  <input
                    type="number"
                    min={1}
                    value={form.versesTo}
                    onChange={(e) => setForm({ ...form, versesTo: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("dueDate")}</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("notes")}</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  rows={2}
                  placeholder={t("notesPlaceholder")}
                />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-tahfidz-green text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" size={18} /> : t("assign")}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 text-left font-medium">{t("student")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("surah")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("progress")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("status")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {assignments.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                  {L === "ar" && a.student.user.fullNameAr ? a.student.user.fullNameAr : a.student.user.fullName}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <BookOpen size={13} className="text-tahfidz-green" />
                    {L === "ar" ? a.surah.nameAr : a.surah.nameFr}
                    <span className="text-xs text-gray-400">
                      ({a.versesFrom ?? 1}-{a.versesTo ?? a.surah.verseCount})
                    </span>
                  </div>
                  {a.dueDate && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                      <Calendar size={11} />
                      {formatDate(a.dueDate, L)}
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="w-32 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-tahfidz-green rounded-full transition-all"
                      style={{ width: `${a.completionPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{a.completionPercentage}%</span>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                    {t(`status_${a.status}`) || a.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-gray-400 hover:text-red-500 p-1"
                    title={t("delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400 text-sm">
                  {t("noAssignments")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
