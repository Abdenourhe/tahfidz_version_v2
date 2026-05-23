"use client"
// src/components/student/StudentAttendanceClient.tsx

import { useLanguage, useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"

interface Attendance {
  id: string
  date: Date
  status: string
  notes: string | null
}

interface Props {
  attendances: Attendance[]
  total: number
  present: number
  absent: number
  excused: number
  rate: number
  byMonth: Record<string, Attendance[]>
}

export function StudentAttendanceClient({ attendances, total, present, absent, excused, rate, byMonth }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("studentAttendanceClient")

  const statusConfig: Record<string, { label: string; icon: string; color: string; bg: string }> = {
    PRESENT: { label: L === "ar" ? "حاضر" : L === "en" ? "Present" : "Présent", icon: "✓", color: "text-green-700", bg: "bg-green-100" },
    ABSENT:  { label: L === "ar" ? "غائب" : L === "en" ? "Absent" : "Absent", icon: "✗", color: "text-red-700", bg: "bg-red-100" },
    LATE:    { label: L === "ar" ? "متأخر" : L === "en" ? "Late" : "Retard", icon: "~", color: "text-yellow-700", bg: "bg-yellow-100" },
    EXCUSED: { label: L === "ar" ? "معذور" : L === "en" ? "Excused" : "Excusé", icon: "E", color: "text-blue-700", bg: "bg-blue-100" },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-1">
            <div className="text-center">
              <div className={`text-4xl font-bold ${rate >= 80 ? "text-tahfidz-green" : rate >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                {rate}%
              </div>
              <p className="text-sm text-gray-500 mt-1">{t("rate")}</p>
            </div>
          </div>
          {[
            { label: t("present"), value: present, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
            { label: t("absent"), value: absent, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
            { label: t("excused"), value: excused, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>{t("attendanceRate")}</span>
            <span className="font-semibold">{present}/{total}</span>
          </div>
          <div className="progress-bar">
            <div className={`h-full rounded-full transition-all duration-700 ${rate >= 80 ? "bg-tahfidz-green" : rate >= 60 ? "bg-yellow-400" : "bg-red-400"}`}
              style={{ width: `${rate}%` }} />
          </div>
        </div>
      </div>

      {Object.entries(byMonth).map(([month, atts]) => {
        const monthPresent = atts.filter(a => a.status === "PRESENT" || a.status === "LATE").length
        const monthRate = Math.round((monthPresent / atts.length) * 100)

        return (
          <div key={month} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200 capitalize">{month}</h2>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${monthRate >= 80 ? "text-tahfidz-green" : monthRate >= 60 ? "text-yellow-600" : "text-red-500"}`}>
                  {monthRate}%
                </span>
                <span className="text-xs text-gray-400">{monthPresent}/{atts.length} {t("sessions")}</span>
              </div>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap gap-2">
                {atts.map(att => {
                  const sc = statusConfig[att.status] ?? statusConfig.ABSENT
                  return (
                    <div key={att.id}
                      title={`${sc.label} — ${formatDate(att.date, { weekday: "long", day: "numeric", month: "long" })}${att.notes ? ` — ${att.notes}` : ""}`}
                      className={`flex flex-col items-center gap-0.5 p-2 rounded-lg ${sc.bg} min-w-[44px]`}>
                      <span className={`text-sm font-bold ${sc.color}`}>{sc.icon}</span>
                      <span className="text-xs text-gray-500">{formatDate(att.date, { day: "2-digit" })}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}

      {total === 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noAtt")}</p>
          <p className="text-sm text-gray-400">{t("waitSessions")}</p>
        </div>
      )}
    </div>
  )
}