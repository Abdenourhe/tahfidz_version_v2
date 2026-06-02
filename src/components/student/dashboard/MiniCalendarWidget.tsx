"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"
import { useT } from "@/contexts/LanguageContext"

interface Attendance {
  id: string
  date: Date
  status: string
}

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-500",
  LATE: "bg-yellow-500",
  EXCUSED: "bg-blue-500",
  ABSENT: "bg-red-500",
}

export function MiniCalendarWidget({ attendances }: { attendances: Attendance[] }) {
  const t = useT("studentDashboardClient")
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const attMap = new Map<string, string>()
  attendances.forEach((a) => {
    const d = new Date(a.date)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    attMap.set(key, a.status)
  })

  const monthLabel = currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })

  const prev = () => setCurrentMonth(new Date(year, month - 1, 1))
  const next = () => setCurrentMonth(new Date(year, month + 1, 1))

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">{t("calendarTitle")}</h3>
        <div className="flex items-center gap-1">
          <button onClick={prev} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronLeft size={14} /></button>
          <span className="text-xs text-gray-500 capitalize">{monthLabel}</span>
          <button onClick={next} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-1">
        {["D","L","M","M","J","V","S"].map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />
          const key = `${year}-${month}-${day}`
          const status = attMap.get(key)
          const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
          return (
            <div
              key={i}
              className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-medium ${
                status ? `${STATUS_COLORS[status]} text-white` : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              } ${isToday ? "ring-2 ring-tahfidz-green" : ""}`}
            >
              {day}
            </div>
          )
        })}
      </div>
      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{t("presentShort")}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />{t("lateShort")}</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{t("absentShort")}</span>
      </div>
    </div>
  )
}
