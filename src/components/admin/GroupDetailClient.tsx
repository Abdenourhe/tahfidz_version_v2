"use client"
// src/components/admin/GroupDetailClient.tsx

import Link from "next/link"
import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { ArrowLeft, CalendarCheck, Users, Pencil, Check, X, Loader2 } from "lucide-react"
import { GroupStudentList } from "@/components/admin/GroupStudentList"
import { GroupRename } from "@/components/admin/GroupRename"


interface Props {
  group: any
}

const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

export function GroupDetailClient({ group }: Props) {
  const { locale } = useLanguage()
  const router = useRouter()
  const L = locale as "fr" | "en" | "ar"

  const [editingSchedule, setEditingSchedule] = useState(false)
  const [scheduleEdit, setScheduleEdit]       = useState<Record<string, string>>({})
  const [savingSchedule, setSavingSchedule]   = useState(false)
  const [scheduleError, setScheduleError]     = useState<string | null>(null)

    const t = useT("groupDetailClient")

  const DAY_LABELS: Record<string, { fr: string; en: string; ar: string }> = {
    monday:    { fr: "Lundi",    en: "Monday",    ar: "الإثنين" },
    tuesday:   { fr: "Mardi",    en: "Tuesday",   ar: "الثلاثاء" },
    wednesday: { fr: "Mercredi", en: "Wednesday", ar: "الأربعاء" },
    thursday:  { fr: "Jeudi",    en: "Thursday",  ar: "الخميس" },
    friday:    { fr: "Vendredi", en: "Friday",    ar: "الجمعة" },
    saturday:  { fr: "Samedi",   en: "Saturday",  ar: "السبت" },
    sunday:    { fr: "Dimanche", en: "Sunday",    ar: "الأحد" },
  }
  const dayLabel = (day: string) => DAY_LABELS[day]?.[L] ?? DAY_LABELS[day]?.fr ?? day

  const levelLabel = (lvl: string) => {
    if (lvl === "beginner") return t("beginner")
    if (lvl === "intermediate") return t("intermediate")
    if (lvl === "advanced") return t("advanced")
    return lvl
  }

  const lc = {
    label: levelLabel(group.level),
    color: group.level === "beginner"
      ? "bg-green-100 text-green-700"
      : group.level === "intermediate"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-red-100 text-red-700",
  }

  const schedule = useMemo(() => (group.schedule as Record<string, string> | null) ?? {}, [group.schedule])
  const capacityPct = Math.round((group._count.students / group.maxCapacity) * 100)
  const avgStars = group.students.length > 0
    ? Math.round(group.students.reduce((a: number, s: any) => a + s.totalStars, 0) / group.students.length)
    : 0
  const totalMemorized = group.students.reduce((a: number, s: any) => a + s._count.memorizedSurahs, 0)

  // ── Schedule editing ──────────────────────────────────────────────────────
  const startEditSchedule = useCallback(() => {
    setScheduleEdit({ ...schedule })
    setScheduleError(null)
    setEditingSchedule(true)
  }, [schedule])

  const toggleDay = (day: string) => {
    setScheduleEdit(prev => {
      const next = { ...prev }
      if (next[day] !== undefined) {
        delete next[day]
      } else {
        next[day] = "08:00"
      }
      return next
    })
  }

  const setTime = (day: string, time: string) => {
    setScheduleEdit(prev => ({ ...prev, [day]: time }))
  }

  const saveSchedule = async () => {
    setSavingSchedule(true)
    setScheduleError(null)
    try {
      const res = await fetch(`/api/groups/${group.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: scheduleEdit }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setScheduleError(data.error ?? "Erreur lors de la sauvegarde")
        return
      }
      setEditingSchedule(false)
      router.refresh()
    } catch {
      setScheduleError("Erreur réseau")
    } finally {
      setSavingSchedule(false)
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/groups" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{group.name}</h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${lc.color}`}>{lc.label}</span>
            <span className={`text-xs px-2.5 py-1 rounded-full ${group.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {group.isActive ? t("active") : t("inactive")}
            </span>
            <GroupRename groupId={group.id} initialName={group.name} initialNameAr={group.nameAr} />
          </div>
          {group.nameAr && <p className="arabic text-gray-500 dark:text-gray-400 mt-0.5">{group.nameAr}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">{t("info")}</h3>

            {/* Teacher */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg mb-3">
              <p className="text-xs text-blue-400 mb-0.5">{t("teacher")}</p>
              <p className="font-semibold text-blue-800 dark:text-blue-300">{group.teacher.user.fullName}</p>
              {group.teacher.user.fullNameAr && (
                <p className="arabic text-xs text-blue-500">{group.teacher.user.fullNameAr}</p>
              )}
              <Link href={`/admin/teachers/${group.teacherId}`}
                className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                {t("viewProfile")} →
              </Link>
            </div>

            {/* Capacity bar */}
            <div className="mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                <span>{t("occupation")}</span>
                <span className={capacityPct >= 90 ? "text-red-500 font-medium" : "font-medium"}>
                  {group._count.students}/{group.maxCapacity}
                </span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${capacityPct >= 90 ? "bg-red-400" : capacityPct >= 70 ? "bg-yellow-400" : "bg-tahfidz-green"}`}
                  style={{ width: `${Math.min(capacityPct, 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-tahfidz-green">{totalMemorized}</p>
                <p className="text-xs text-gray-400">{t("memorized")}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5 text-center">
                <p className="text-lg font-bold text-tahfidz-gold">⭐{avgStars}</p>
                <p className="text-xs text-gray-400">{t("avgStars")}</p>
              </div>
            </div>

            {/* ── Schedule ─────────────────────────────────────────────── */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">📅 {t("schedule")}</p>
                {!editingSchedule && (
                  <button
                    onClick={startEditSchedule}
                    className="flex items-center gap-1 text-xs text-tahfidz-green hover:underline"
                  >
                    <Pencil size={11} /> {t("editSchedule")}
                  </button>
                )}
              </div>

              {/* View mode */}
              {!editingSchedule && (
                Object.keys(schedule).length > 0 ? (
                  <div className="space-y-1.5">
                    {ALL_DAYS.filter(d => schedule[d]).map(day => (
                      <div key={day} className="flex justify-between text-xs bg-gray-50 dark:bg-gray-800 px-2.5 py-1.5 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300 font-medium">{dayLabel(day)}</span>
                        <span className="text-gray-400 font-mono">{schedule[day]}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-300 italic">{t("noSchedule")}</p>
                )
              )}

              {/* Edit mode */}
              {editingSchedule && (
                <div className="space-y-2">
                  {ALL_DAYS.map(day => {
                    const checked = scheduleEdit[day] !== undefined
                    return (
                      <div key={day} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`day-${day}`}
                          checked={checked}
                          onChange={() => toggleDay(day)}
                          className="rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green"
                        />
                        <label htmlFor={`day-${day}`} className="text-xs text-gray-600 dark:text-gray-300 w-20 cursor-pointer">
                          {dayLabel(day)}
                        </label>
                        {checked && (
                          <input
                            type="time"
                            value={scheduleEdit[day] ?? "08:00"}
                            onChange={e => setTime(day, e.target.value)}
                            className="text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-tahfidz-green"
                          />
                        )}
                      </div>
                    )
                  })}

                  {scheduleError && (
                    <p className="text-xs text-red-500 mt-1">{scheduleError}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={saveSchedule}
                      disabled={savingSchedule}
                      className="flex items-center gap-1 px-3 py-1.5 bg-tahfidz-green text-white text-xs rounded-lg hover:bg-tahfidz-green/90 disabled:opacity-60 transition"
                    >
                      {savingSchedule ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      {t("saveSchedule")}
                    </button>
                    <button
                      onClick={() => setEditingSchedule(false)}
                      disabled={savingSchedule}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-60 transition"
                    >
                      <X size={12} /> {t("cancel")}
                    </button>
                  </div>
                </div>
              )}
            </div>
            {/* ──────────────────────────────────────────────────────────── */}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-2">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 text-sm">{t("actions")}</h3>
            <Link href={`/admin/attendance?groupId=${group.id}`}
              className="flex items-center gap-2 px-4 py-2.5 bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green rounded-lg hover:bg-tahfidz-green/20 dark:hover:bg-emerald-900/30 transition text-sm font-medium">
              <CalendarCheck size={16} /> {t("attendance")}
            </Link>
            <Link href={`/admin/students/new`}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-sm font-medium">
              <Users size={16} /> {t("addStudent")}
            </Link>
          </div>
        </div>

        <div className="lg:col-span-2">
          <GroupStudentList students={group.students} groupId={group.id} groupName={group.name} />
        </div>
      </div>
    </div>
  )
}
