"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { BookOpen, Loader2, CheckCircle2, Save } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Assignment {
  id: string
  surah: { id: number; nameFr: string; nameAr: string; verseCount: number }
  versesFrom: number | null
  versesTo: number | null
  dueDate: Date | null
  status: string
  currentVerse: number
  completionPercentage: number
  notes: string | null
}

export default function StudentMemorizationTracker() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("studentMemorizationTracker")

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/memorization/assign")
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (id: string, versesMemorized: number, quality: string, notes: string) => {
    setSaving(id)
    try {
      const res = await fetch("/api/memorization/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: id, versesMemorized, quality, notes }),
      })
      if (res.ok) load()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      {assignments.map((a) => (
        <AssignmentCard key={a.id} assignment={a} L={L} t={t} saving={saving} onUpdate={handleUpdate} />
      ))}
      {assignments.length === 0 && (
        <p className="text-center text-gray-400 py-6 text-sm">{t("noAssignments")}</p>
      )}
    </div>
  )
}

function AssignmentCard({
  assignment: a,
  L,
  t,
  saving,
  onUpdate,
}: {
  assignment: Assignment
  L: string
  t: (k: string) => string
  saving: string | null
  onUpdate: (id: string, v: number, q: string, n: string) => void
}) {
  const fromV = a.versesFrom ?? 1
  const toV = a.versesTo ?? a.surah.verseCount
  const total = toV - fromV + 1
  const [versesMemorized, setVersesMemorized] = useState(Math.min(total, Math.max(0, a.currentVerse - fromV)))
  const [quality, setQuality] = useState("GOOD")
  const [notes, setNotes] = useState(a.notes || "")

  useEffect(() => {
    setVersesMemorized(Math.min(total, Math.max(0, a.currentVerse - fromV)))
  }, [a.currentVerse, fromV, total])

  const pct = Math.round((versesMemorized / total) * 100)

  const qualityOptions = [
    { key: "EXCELLENT", label: t("excellent"), icon: "⭐", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { key: "GOOD", label: t("good"), icon: "👍", color: "bg-green-100 text-green-700 border-green-200" },
    { key: "NEEDS_WORK", label: t("needsWork"), icon: "⚠️", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    { key: "POOR", label: t("poor"), icon: "❌", color: "bg-red-100 text-red-700 border-red-200" },
  ]

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={16} className="text-tahfidz-green" />
          <h4 className="font-semibold text-gray-900 dark:text-gray-100">
            {L === "ar" ? a.surah.nameAr : a.surah.nameFr}
          </h4>
          <span className="text-xs text-gray-400">
            {fromV}-{toV} / {a.surah.verseCount} {t("verses")}
          </span>
        </div>
        {a.status === "MEMORIZED" && <CheckCircle2 size={16} className="text-emerald-500" />}
      </div>

      {a.dueDate && (
        <p className="text-xs text-gray-500">{t("dueDate")}: {formatDate(a.dueDate, L)}</p>
      )}

      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span>{t("versesMemorized")}: {versesMemorized} / {total}</span>
          <span className="font-medium text-tahfidz-green">{pct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={total}
          value={versesMemorized}
          onChange={(e) => setVersesMemorized(Number(e.target.value))}
          className="w-full accent-tahfidz-green"
        />
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {qualityOptions.map((q) => (
          <button
            key={q.key}
            onClick={() => setQuality(q.key)}
            className={`px-2.5 py-1 rounded-lg text-xs border transition ${
              quality === q.key ? q.color + " ring-1 ring-offset-1" : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700"
            }`}
          >
            {q.icon} {q.label}
          </button>
        ))}
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder={t("notesPlaceholder")}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
        rows={2}
      />

      <button
        onClick={() => onUpdate(a.id, versesMemorized, quality, notes)}
        disabled={saving === a.id}
        className="w-full py-2 bg-tahfidz-green text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {saving === a.id ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
        {t("updateProgress")}
      </button>
    </div>
  )
}
