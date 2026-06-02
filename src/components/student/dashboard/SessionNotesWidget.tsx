"use client"

import { FileText, Star } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Evaluation {
  id: string
  sourah: string | null
  notes: string | null
  tajweedScore: number | null
  memorizationScore: number | null
  fluencyScore: number | null
  session: { meetingName: string; scheduledAt: Date } | null
}

export function SessionNotesWidget({ evaluations }: { evaluations: Evaluation[] }) {
  const t = useT("studentDashboardClient")
  if (evaluations.length === 0) return null

  const ev = evaluations[0]
  const avg = ev.tajweedScore && ev.memorizationScore && ev.fluencyScore
    ? Math.round((ev.tajweedScore + ev.memorizationScore + ev.fluencyScore) / 3)
    : null

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("sessionNotes")}</h3>
        <FileText size={16} className="text-tahfidz-green" />
      </div>
      <div className="space-y-3">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-400 mb-1">{ev.session?.meetingName || ""}</p>
          {ev.sourah && <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{ev.sourah}</p>}
          {ev.notes && <p className="text-xs text-gray-500 mt-1 line-clamp-3">{ev.notes}</p>}
          {avg !== null && (
            <div className="flex items-center gap-1 mt-2">
              <Star size={12} className="text-tahfidz-gold" />
              <span className="text-xs font-bold text-tahfidz-gold">{avg}/20</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
