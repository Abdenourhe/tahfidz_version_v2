"use client"

import { CheckCircle2, Circle, BookOpen, Video, CalendarCheck } from "lucide-react"
import { useState } from "react"
import { useT } from "@/contexts/LanguageContext"

interface Progress {
  id: string
  surah: { nameFr: string; nameAr: string }
  status: string
}

export function DailyTasksWidget({ inProgress, hasUpcomingHalaqa }: { inProgress: Progress[]; hasUpcomingHalaqa: boolean }) {
  const t = useT("studentDashboardClient")
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tasks = [
    ...inProgress.map((p) => ({
      id: p.id,
      label: `${t("revise")} ${p.surah.nameFr}`,
      icon: BookOpen,
      done: checked.has(p.id),
    })),
    ...(hasUpcomingHalaqa
      ? [{ id: "halaqa", label: t("prepareHalaqa"), icon: Video, done: checked.has("halaqa") }]
      : []),
    { id: "daily", label: t("dailyConnection"), icon: CalendarCheck, done: checked.has("daily") },
  ]

  if (tasks.length === 0) return null

  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("tasksTitle")}</h3>
        <span className="text-xs text-tahfidz-green font-medium">{doneCount}/{tasks.length}</span>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => toggle(task.id)}
            className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left text-sm transition ${
              task.done ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 line-through opacity-70" : "hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
            }`}
          >
            {task.done ? <CheckCircle2 size={16} className="text-green-500 shrink-0" /> : <Circle size={16} className="text-gray-300 shrink-0" />}
            <task.icon size={14} className="text-gray-400 shrink-0" />
            <span className="flex-1">{task.label}</span>
          </button>
        ))}
      </div>
      {doneCount === tasks.length && (
        <p className="text-xs text-green-600 mt-3 text-center font-medium">🎉 {t("allTasksDone")}</p>
      )}
    </div>
  )
}
