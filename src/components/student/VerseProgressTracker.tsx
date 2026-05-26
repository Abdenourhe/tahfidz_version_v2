"use client"
// src/components/student/VerseProgressTracker.tsx
// Suivi par numéro de verset (input direct) + boutons rapides + notification

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Loader2, CheckCircle2, Save, Bell } from "lucide-react"

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

  // ─── Save verse to server ──────────────────────────────────────────────────
  const saveVerse = async (newVerse: number) => {
    const clamped = Math.max(0, Math.min(newVerse, totalVerses))
    if (clamped === verseSafe) return  // no change
    setUpdating(true); setError(null)
    try {
      const res = await fetch(`/api/progress/${progressId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentVerse: clamped }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt.slice(0, 100) || "Erreur de mise à jour")
      }
      setVerse(clamped)
      setDraft(String(clamped))
      setSavedAt(new Date())
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
      setDraft(String(verseSafe))  // revert on error
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
      setError(`Le verset doit être entre 0 et ${totalVerses}`)
      return
    }
    // Debounce server save by 800ms after user stops typing
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
      if (!res.ok) throw new Error("Erreur notification")
      setNotified(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur")
    } finally {
      setNotifying(false)
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* ─── Saisie verset actuel ─── */}
      <div>
        <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
          <div>
            <p className="text-xs font-medium text-gray-600">
              Mon avancement actuel
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Saisissez le numéro du dernier verset que vous avez mémorisé
            </p>
          </div>

          {/* État de sauvegarde */}
          {updating && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Loader2 size={11} className="animate-spin" /> Enregistrement…
            </span>
          )}
          {savedAt && !updating && (
            <span className="text-xs text-tahfidz-green flex items-center gap-1 font-medium">
              <CheckCircle2 size={11} /> Sauvegardé · enseignant notifié
            </span>
          )}
        </div>

        {/* Champ saisie + total */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
          <div className="flex-1 flex items-center gap-2">
            <label className="text-xs text-gray-500">Verset :</label>
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
              className="w-20 px-3 py-2 rounded-lg border-2 border-tahfidz-green/30 text-center text-base font-bold text-tahfidz-green focus:outline-none focus:border-tahfidz-green focus:ring-2 focus:ring-tahfidz-green/20 bg-white"
            />
            <span className="text-sm text-gray-500">sur</span>
            <span className="text-base font-bold text-gray-700">{totalVerses}</span>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400">Restant</p>
            <p className="text-base font-bold text-orange-500">
              {remaining} verset{remaining > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Barre de progression visuelle (lecture seule) */}
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Progression</span>
            <span className="font-semibold text-tahfidz-green">{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full gradient-tahfidz rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Boutons rapides */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <span className="text-xs text-gray-400 mr-1">Ajustement rapide :</span>
          <button onClick={() => adjustBy(-5)} disabled={updating || verseSafe <= 0}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium">
            −5
          </button>
          <button onClick={() => adjustBy(-1)} disabled={updating || verseSafe <= 0}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium">
            −1
          </button>
          <button onClick={() => adjustBy(1)} disabled={updating || verseSafe >= totalVerses}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium">
            +1
          </button>
          <button onClick={() => adjustBy(5)} disabled={updating || verseSafe >= totalVerses}
            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition font-medium">
            +5
          </button>
          <button onClick={() => saveVerse(totalVerses)} disabled={updating || verseSafe >= totalVerses}
            className="px-3 py-1.5 text-xs border border-tahfidz-green text-tahfidz-green rounded-lg hover:bg-tahfidz-green-light disabled:opacity-40 transition font-semibold">
            Tout terminé ✓
          </button>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg flex items-center gap-1.5">
          ⚠ {error}
        </p>
      )}

      {/* ─── Bouton "Prêt à réciter" ─── */}
      {status === "IN_PROGRESS" && (
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 flex-wrap">
          <p className="text-xs text-gray-400 flex-1 min-w-0">
            {isComplete
              ? "🎉 Tous les versets sont mémorisés ! Signalez-le à votre enseignant."
              : `Encore ${remaining} verset${remaining > 1 ? "s" : ""} avant de demander la validation.`}
          </p>

          {notified ? (
            <span className="flex items-center gap-1.5 text-xs text-tahfidz-green font-medium px-3 py-2 bg-tahfidz-green-light rounded-xl">
              <CheckCircle2 size={14} /> Enseignant notifié
            </span>
          ) : (
            <button
              onClick={notifyTeacher}
              disabled={notifying || !isComplete}
              className="flex items-center gap-1.5 px-4 py-2 text-xs gradient-tahfidz text-white rounded-xl hover:opacity-90 transition disabled:opacity-50 font-semibold flex-shrink-0"
              title={!isComplete ? "Terminez tous les versets d'abord" : "Demander la validation de l'enseignant"}
            >
              {notifying ? <Loader2 size={12} className="animate-spin" /> : <Bell size={12} />}
              {notifying ? "Envoi…" : "Je suis prêt à réciter"}
            </button>
          )}
        </div>
      )}

      {status === "READY_FOR_RECITATION" && (
        <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm text-orange-700">
          <Loader2 size={14} className="animate-spin" />
          <span>En attente de validation par votre enseignant</span>
        </div>
      )}

      {status === "NEEDS_REVISION" && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
          <span>↺</span>
          <span>L'enseignant demande une révision. Continuez votre travail !</span>
        </div>
      )}
    </div>
  )
}
