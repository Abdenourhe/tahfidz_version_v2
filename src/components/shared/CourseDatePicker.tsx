"use client"
// src/components/shared/CourseDatePicker.tsx
// Calendrier custom : jours de cours cliquables, autres jours grisés.

import { useState, useEffect, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

export function displayLocalDate(dateStr: string, locale: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export function formatLocalDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function dateToNoonIso(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0)).toISOString()
}

export function nextCourseDate(schedule?: Record<string, string> | null) {
  if (!schedule) return null
  const days = Object.keys(schedule)
  if (days.length === 0) return null
  const today = new Date()
  for (let i = 0; i <= 60; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    if (days.includes(DAY_KEYS[d.getDay()])) return formatLocalDate(d)
  }
  return null
}

interface MultiSchedule {
  id: string
  label: string
  schedule: Record<string, string>
  color: string
}

interface CourseDatePickerProps {
  value: string
  onChange: (date: string) => void
  schedule?: Record<string, string> | null
  multiSchedule?: MultiSchedule[]
  locale: string
  labels?: {
    courseDay?: string
    weeklySchedule?: string
    noCourseDays?: string
    day?: (dayKey: string) => string
  }
}

export function CourseDatePicker({ value, onChange, schedule, multiSchedule, locale, labels }: CourseDatePickerProps) {
  const scheduleMap = schedule || {}
  const courseDays = Object.keys(scheduleMap)

  const parseDate = (str: string) => {
    if (!str) return null
    const [y, m, d] = str.split("-").map(Number)
    return new Date(y, m - 1, d)
  }

  const selectedDate = useMemo(() => parseDate(value), [value])
  const today = new Date()
  const [viewDate, setViewDate] = useState(() => selectedDate || today)

  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    }
  }, [value, selectedDate])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const isCourseDay = (dayOfWeek: number) => courseDays.includes(DAY_KEYS[dayOfWeek])
  const courseTime = (dayOfWeek: number) => scheduleMap[DAY_KEYS[dayOfWeek]]

  const hasMulti = !!multiSchedule && multiSchedule.length > 0
  const multiCourseGroups = (dayOfWeek: number) =>
    hasMulti ? multiSchedule!.filter((ms) => Object.keys(ms.schedule).includes(DAY_KEYS[dayOfWeek])) : []

  const monthLabel = viewDate.toLocaleDateString(
    locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR",
    { month: "long", year: "numeric" }
  )

  const weekDays =
    locale === "ar"
      ? ["ح", "ن", "ث", "ر", "خ", "ج", "س"]
      : locale === "en"
      ? ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]
      : ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"]

  const days: { day: number; date: Date; isCurrentMonth: boolean }[] = []
  const prevMonthDays = new Date(year, month, 0).getDate()
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false })
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ day: i, date: new Date(year, month, i), isCurrentMonth: true })
  }
  const remaining = (7 - (days.length % 7)) % 7
  for (let i = 1; i <= remaining; i++) {
    days.push({ day: i, date: new Date(year, month + 1, i), isCurrentMonth: false })
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 bg-white dark:bg-gray-900 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map((d) => (
          <div key={d} className="text-[10px] font-semibold text-gray-400 uppercase py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((item, idx) => {
          const dayIdx = item.date.getDay()
          const groupsForDay = multiCourseGroups(dayIdx)
          const isCourse = hasMulti ? groupsForDay.length > 0 : isCourseDay(dayIdx)
          const clickable = item.isCurrentMonth && (hasMulti ? groupsForDay.length > 0 : courseDays.length === 0 || isCourse)
          const selected = value === formatLocalDate(item.date)
          const isToday = formatLocalDate(item.date) === formatLocalDate(today)
          const time = hasMulti
            ? groupsForDay.map((g) => `${g.label}: ${g.schedule[DAY_KEYS[dayIdx]]}`).join(" · ")
            : courseTime(dayIdx)
          return (
            <button
              key={idx}
              type="button"
              disabled={!clickable}
              title={clickable && (time || groupsForDay.length > 0)
                ? `${labels?.courseDay ?? "Jour de cours"}${time ? ` · ${time}` : ""}`
                : undefined}
              onClick={() => clickable && onChange(formatLocalDate(item.date))}
              className={cn(
                "relative h-8 rounded-lg text-xs font-medium flex items-center justify-center transition",
                selected
                  ? "bg-tahfidz-green text-white shadow-sm"
                  : clickable
                  ? "text-gray-700 dark:text-gray-200 hover:opacity-80"
                  : "text-gray-300 dark:text-gray-600 cursor-not-allowed",
                !selected && clickable && isToday && "ring-2 ring-tahfidz-green/40 text-tahfidz-green",
                !item.isCurrentMonth && "opacity-30"
              )}
              style={
                selected || !clickable
                  ? undefined
                  : groupsForDay.length === 1
                  ? { backgroundColor: `${groupsForDay[0].color}25` }
                  : groupsForDay.length > 1
                  ? { backgroundColor: "#e5e7eb40" }
                  : undefined
              }
            >
              {item.day}
              {groupsForDay.length > 0 && !selected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-0.5">
                  {groupsForDay.slice(0, 3).map((g) => (
                    <span key={g.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: g.color }} />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {hasMulti ? (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            {labels?.weeklySchedule ?? "Horaires"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {multiSchedule!.map((ms) => (
              <span
                key={ms.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px]"
                style={{ backgroundColor: `${ms.color}20`, color: ms.color }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ms.color }} />
                {ms.label}
              </span>
            ))}
          </div>
        </div>
      ) : courseDays.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-1">
            {labels?.weeklySchedule ?? "Horaire hebdomadaire"}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {courseDays.map((d) => (
              <span
                key={d}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-tahfidz-green/10 dark:bg-tahfidz-green/20 text-[10px] text-tahfidz-green-dark dark:text-tahfidz-green-light"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-tahfidz-green" />
                {(labels?.day ? labels.day(d) : d)} {scheduleMap[d] && `· ${scheduleMap[d]}`}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
