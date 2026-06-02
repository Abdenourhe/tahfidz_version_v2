"use client"
// src/components/student/VerseProgressTracker.tsx
// Suivi par numéro de verset (input direct) + boutons rapides + notification

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Loader2, CheckCircle2, Save, Bell } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Props {
  progressId:  string
  studentId:   string
  surahId:     number
  totalVerses: number
  currentVerse: number
  status:      string
  startedAt:   string
}

export function VerseProgressTracker({
  progressId, studentId, surahId, totalVerses, currentVerse, status,
}: Props) {
  const router  = useRouter()
  const { locale } = useLanguage()
  const t = useT("studentMemorizationTracker")
  const L = locale as "fr" | "en" | "ar"

  const [verse,    setVerse]    = useState(currentVerse)
  const [draft,    setDraft]    = useState(String(currentVerse))
  const [updating, setUpdating] = useState(false)
  const [savedAt,  setSavedAt]  = useState<Date | null>(null)
  const [notifying,setNotifying]= useState(false)
  const [notified, setNotified] = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Sync server value if it changed externally (after teacher validates)
  useEffect(() => {
    setVerse(currentVerse)
    setDraft(String(currentVerse))
  }, [currentVerse])

  const verseSafe = Math.max(0, Math.min(verse, totalVerses))
  const pct       = totalVerses > 0 ? Math.round((verseSafe / totalVerses) * 100) : 0
  const remaining = totalVerses - verseSafe
  const isComplete = verseSafe >= totalVerses

  const verseUnit = (n: number) => n === 1 ? t("verseSingular") : t("versePlural")

  // ─── Save verse to server ──────────────────────────────────────────────────
  const saveVerse = async (newVerse: number) => {
    const clamped = Math.max(0, Math.min(newVerse, totalVerses))
    if (clamped === verseSafe) return
    setUpdating(true); setError(null)
    try {
      const res = await fetch(`/api/progress/${progressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentVerse: clamped }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 100) || t("error"))
      }
      setVerse(clamped)
      setDraft(String(clamped))
      setSavedAt(new Date())
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"))
      setDraft(String(verseSafe))
    } finally {
      setUpdating(false)
    }
  }

  // ─── Quick increment buttons ───────────────────────────────────────────────
  const adjustBy = (delta: number) => {
    const next = Math.max(0, Math.min(verseSafe + delta, totalVerses))
    setDraft(String(next))
    saveVerse(next)
  }

  // ─── Manual input change with debounced save ───────────────────────────────
  const onDraftChange = (val: string) => {
    setDraft(val)
    setError(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const num = parseInt(val, 10)
    if (isNaN(num)) return
    if (num < 0 || num > totalVerses) {
      setError(t("errorVerseRange").replace("{{total}}", String(totalVerses)))
      return
    }
    debounceRef.current = setTimeout(() => saveVerse(num), 800)
  }

  // ─── Notify teacher ────────────────────────────────────────────────────────
  const notifyTeacher = async () => {
    setNotifying(true); setError(null)
    try {
      const res = await fetch(`/api/progress/${progressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "READY_FOR_RECITATION" }),
      })
      if (!res.ok) throw new Error(t("error"))
      setNotified(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"))
    } finally {
      setNotifying(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-4 space-y-4"
    >
      {/* ─── Saisie verset actuel ─── */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
              {t("currentProgress")}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {t("enterLastVerse")}
            </p>
          </div>

          {/* État de sauvegarde */}
          {updating && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> {t("saving")}
            </span>
          )}
          {savedAt && !updating && (
            <span className="text-xs text-tahfidz-green flex items-center gap-1 font-medium">
              <CheckCircle2 size={11} /> {t("savedTeacherNotified")}
            </span>
          )}
        </div>

        {/* Champ saisie + total */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
          <div className="flex-1 flex items-center gap-2">
            <label className="text-xs text-gray-500">{t("verseLabel")} :</label>
            <input
              type="number"
              value={draft}
              onChange={e => onDraftChange(e.target.value)}
              onBlur={() => {
                const num = parseInt(draft, 10)
                if (!isNaN(num) && num !== verseSafe) saveVerse(num)
                else setDraft(String(verseSafe))
              }}
              min={0} max={totalVerses}
              className="w-20 px-3 py-2 rounded-lg border-2 border-tahfidz-green/30 text-center text-base font-bold text-tahfidz-green focus:outline-none focus:border-tahfidz-green focus:ring-2 focus:ring-tahfidz-green/20 bg-white dark:bg-gray-900"
            />
            <span className="text-sm text-gray-500">{t("ofLabel")}</span>
            <span className="text-base font-bold text-gray-700 dark:text-gray-200">{totalVerses}</span>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">{t("remainingLabel")}</p>
            <p className="text-base font-bold text-orange-500">
              {remaining} {verseUnit(remaining)}
            </p>
          </div>
        </div>

        {/* Barre de progression visuelle */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{t("progressLabel")}</span>
            <span className="font-semibold text-tahfidz-green">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full gradient-tahfidz rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.7 }}
            />
          </div>
        </div>

        {/* Boutons rapides */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-gray-400 mr-1">{t("quickAdjust")} :</span>
          {[-5, -1, 1, 5].map((delta) => (
            <button
              key={delta}
              onClick={() => adjustBy(delta)}
              disabled={updating || (delta < 0 && verseSafe <= 0) || (delta > 0 && verseSafe >= totalVerses)}
              className="px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition font-medium"
            >
              {delta > 0 ? `+${delta}` : delta}
            </button>
          ))}
          <button
            onClick={() => saveVerse(totalVerses)}
            disabled={updating || verseSafe >= totalVerses}
            className="px-3 py-1.5 text-xs border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light disabled:opacity-40 transition font-semibold"
          >
            {t("allDone")} ✓
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg flex items-center gap-1.5">
          ⚠ {error}
        </p>
      )}

      {/* ─── Bouton "Prêt à réciter" ─── */}
      {status === "IN_PROGRESS" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex-wrap"
        >
          <p className="text-xs text-gray-400 flex-1 min-w-0">
            {isComplete
              ? t("allVersesMemorized")
              : t("remainingBeforeValidation")
                  .replace("{{count}}", String(remaining))
                  .replace("{{unit}}", verseUnit(remaining))}
          </p>

          {notified ? (
            <span className="flex items-center gap-1.5 text-xs text-tahfidz-green font-medium px-3 py-2 bg-tahfidz-green-light rounded-xl">
              <CheckCircle2 size={14} /> {t("teacherNotified")}
            </span>
          ) : (
            <button
              onClick={notifyTeacher}
              disabled={notifying || !isComplete}
              className="flex items-center gap-1.5 px-4 py-2 text-xs gradient-tahfidz text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold flex-shrink-0"
              title={!isComplete ? t("finishFirst") : t("requestValidation")}
            >
              {notifying ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
              {notifying ? t("sending") : t("readyToRecite")}
            </button>
          )}
        </motion.div>
      )}

      {status === "READY_FOR_RECITATION" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl text-sm text-orange-700 dark:text-orange-300"
        >
          <Loader2 size={14} className="animate-spin" />
          <span>{t("waitingValidation")}</span>
        </motion.div>
      )}

      {status === "NEEDS_REVISION" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm text-yellow-700 dark:text-yellow-300"
        >
          <span>↺</span>
          <span>{t("teacherRequestsRevision")}</span>
        </motion.div>
      )}
    </motion.div>
  )
}
