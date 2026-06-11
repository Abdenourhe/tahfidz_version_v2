"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { BookOpen, Loader2, Save, Pencil, Users } from "lucide-react"
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

export default function ParentMemorizationView({ childId, showTitle = true }: { childId: string; showTitle?: boolean }) {
  const t = useT("parentMemorizationView")
  const { locale } = useLanguage()
  const L = (locale as "fr" | "en" | "ar") ?? "fr"

  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/memorization/assign?studentId=${childId}`)
      const data = await res.json()
      setAssignments(data.assignments || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showTitle && <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("memorization")}</h3>}
        {!showTitle && <div />}
        <button
          onClick={() => setEditMode(!editMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          <Pencil size={13} /> {editMode ? t("viewMode") : t("modifyChildProgress")}
        </button>
      </div>

      {assignments.map((a) => (
        <div key={a.id} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-tahfidz-green" />
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              {L === "ar" ? a.surah.nameAr : a.surah.nameFr}
            </h4>
            <span className="text-xs text-gray-400">
              ({a.versesFrom ?? 1}-{a.versesTo ?? a.surah.verseCount})
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{t("progress")}</span>
              <span className="font-medium text-tahfidz-green">{a.completionPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-tahfidz-green rounded-full transition-all" style={{ width: `${a.completionPercentage}%` }} />
            </div>
          </div>

          {a.dueDate && (
            <p className="text-xs text-gray-500">{t("dueDate")}: {formatDate(a.dueDate, L)}</p>
          )}

          {editMode && (
            <EditProgressForm assignment={a} onUpdated={load} t={t} L={L} />
          )}
        </div>
      ))}

      {assignments.length === 0 && (
        <p className="text-center text-gray-400 py-6 text-sm">{t("noAssignments")}</p>
      )}
    </div>
  )
}

function EditProgressForm({
  assignment: a,
  onUpdated,
  t,
  L: _L,
}: {
  assignment: Assignment
  onUpdated: () => void
  t: (k: string) => string
  L: string
}) {
  const fromV = a.versesFrom ?? 1
  const toV = a.versesTo ?? a.surah.verseCount
  const total = toV - fromV + 1
  const [versesMemorized, setVersesMemorized] = useState(Math.min(total, Math.max(0, a.currentVerse - fromV)))
  const [quality, setQuality] = useState("GOOD")
  const [notes, setNotes] = useState(a.notes || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch("/api/memorization/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: a.id, versesMemorized, quality, notes }),
      })
      onUpdated()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const qualityOptions = [
    { key: "EXCELLENT", label: t("excellent"), icon: "⭐", color: "bg-emerald-100 text-emerald-700" },
    { key: "GOOD", label: t("good"), icon: "👍", color: "bg-green-100 text-green-700" },
    { key: "NEEDS_WORK", label: t("needsWork"), icon: "⚠️", color: "bg-yellow-100 text-yellow-700" },
    { key: "POOR", label: t("poor"), icon: "❌", color: "bg-red-100 text-red-700" },
  ]

  const pct = Math.round((versesMemorized / total) * 100)

  return (
    <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
      <div className="flex items-center gap-2 text-xs text-amber-600">
        <Users size={12} /> {t("lastUpdatedBy")}: {t("parent")}
      </div>
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
      </div>
      <div className="flex flex-wrap gap-2">
        {qualityOptions.map((q) => (
          <button
            key={q.key}
            onClick={() => setQuality(q.key)}
            className={`px-2.5 py-1 rounded-lg text-xs border transition ${
              quality === q.key ? q.color + " ring-1" : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700"
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
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-tahfidz-green text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
        {t("updateProgress")}
      </button>
    </div>
  )
}
