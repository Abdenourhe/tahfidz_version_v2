"use client"
// src/app/admin/attendance/page.tsx — Export only with proper download

import { useState, useEffect } from "react"
import { CalendarCheck, Loader2, Download, Calendar, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Group {
  id: string
  name: string
  _count?: { students: number }
  teacher: { user: { fullName: string } }
}

type Preset = "day" | "week" | "month" | "custom"

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 200)
}

export default function AdminAttendancePage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

  const [groups,    setGroups]    = useState<Group[]>([])
  const [selGroup,  setSelGroup]  = useState("")
  const [preset,    setPreset]    = useState<Preset>("week")
  const [dateFrom,  setDateFrom]  = useState("")
  const [dateTo,    setDateTo]    = useState("")
  const [busyOne,   setBusyOne]   = useState(false)
  const [busyAll,   setBusyAll]   = useState(false)
  const [progress,  setProgress]  = useState<{ current: number; total: number; group: string } | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [success,   setSuccess]   = useState<string | null>(null)

    const t = useT("attendance")

  const PRESETS = [
    { id: "day" as Preset,    label: t("day"),    icon: "📅", desc: t("dayDesc") },
    { id: "week" as Preset,   label: t("week"),   icon: "📆", desc: t("weekDesc") },
    { id: "month" as Preset,  label: t("month"),  icon: "🗓️", desc: t("monthDesc") },
    { id: "custom" as Preset, label: t("custom"), icon: "⚙️", desc: t("customDesc") },
  ]

  const computeDates = (p: Preset) => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]
    let from = todayStr
    if (p === "week") {
      const d = new Date(today); d.setDate(d.getDate() - 6)
      from = d.toISOString().split("T")[0]
    } else if (p === "month") {
      const d = new Date(today); d.setDate(d.getDate() - 29)
      from = d.toISOString().split("T")[0]
    }
    return { from, to: todayStr }
  }

  useEffect(() => {
    fetch("/api/groups")
      .then(r => r.json())
      .then(d => {
        const g = d.groups || []
        setGroups(g)
        if (g.length > 0) setSelGroup(g[0].id)
      })
      .catch(() => setError(t("errorGroups")))
  }, [])

  useEffect(() => {
    if (preset !== "custom") {
      const { from, to } = computeDates(preset)
      setDateFrom(from)
      setDateTo(to)
    }
  }, [preset])

  const resetMsgs = () => { setError(null); setSuccess(null) }

  const exportOne = async () => {
    resetMsgs()
    if (!selGroup) { setError(t("errorSelect")); return }
    if (!dateFrom || !dateTo) { setError(t("errorPeriod")); return }
    if (new Date(dateFrom) > new Date(dateTo)) { setError(t("errorDate")); return }

    const group = groups.find(g => g.id === selGroup)
    setBusyOne(true)

    try {
      const params = new URLSearchParams({
        groupId:  selGroup,
        dateFrom: `${dateFrom}T00:00:00.000Z`,
        dateTo:   `${dateTo}T23:59:59.999Z`,
      })

      const res = await fetch(`/api/attendance/export?${params}`, {
        headers: { Accept: "text/csv" },
      })

      if (!res.ok) {
        let msg = `Erreur ${res.status}`
        try {
          const ct = res.headers.get("content-type") || ""
          if (ct.includes("json")) {
            const j = await res.json()
            msg = j.error || msg
          } else {
            const t = await res.text()
            if (t) msg = t.slice(0, 150)
          }
        } catch {}
        throw new Error(msg)
      }

      const blob = await res.blob()
      if (blob.size === 0) throw new Error(t("errorEmpty"))

      const filename = `presences_${(group?.name || "groupe").replace(/[^\w\-]/g, "_")}_${dateFrom}_${dateTo}.csv`
      triggerDownload(blob, filename)
      setSuccess(`✓ ${filename} ${t("successMsg")}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorDownload"))
    } finally {
      setBusyOne(false)
    }
  }

  const exportAll = async () => {
    resetMsgs()
    if (!dateFrom || !dateTo) { setError(t("errorPeriod")); return }
    if (groups.length === 0)  { setError(t("errorNoGroup")); return }

    setBusyAll(true)
    let ok = 0; let fail = 0; const errors: string[] = []

    try {
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i]
        setProgress({ current: i + 1, total: groups.length, group: g.name })

        try {
          const params = new URLSearchParams({
            groupId:  g.id,
            dateFrom: `${dateFrom}T00:00:00.000Z`,
            dateTo:   `${dateTo}T23:59:59.999Z`,
          })
          const res = await fetch(`/api/attendance/export?${params}`)
          if (!res.ok) {
            errors.push(`${g.name}: ${res.status}`)
            fail++; continue
          }
          const blob = await res.blob()
          if (blob.size === 0) { errors.push(`${g.name}: vide`); fail++; continue }

          const filename = `presences_${g.name.replace(/[^\w\-]/g, "_")}_${dateFrom}_${dateTo}.csv`
          triggerDownload(blob, filename)
          ok++
          await new Promise(r => setTimeout(r, 800))
        } catch (e) {
          errors.push(`${g.name}: ${e instanceof Error ? e.message : "erreur"}`)
          fail++
        }
      }

      if (fail === 0)  setSuccess(`✓ ${ok} ${t("files")} ${t("successMsg")}`)
      else if (ok > 0) setSuccess(`${ok} succès, ${fail} échec${fail > 1 ? "s" : ""}`)
      else             setError(`Aucun fichier téléchargé. ${errors.slice(0,2).join(" | ")}`)
    } finally {
      setProgress(null)
      setBusyAll(false)
    }
  }

  const currentGroup = groups.find(g => g.id === selGroup)
  const fmt = (d: string) => d ? new Date(`${d}T12:00:00`).toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" }
  ) : "—"
  const busy = busyOne || busyAll

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          <Calendar size={17} className="text-tahfidz-green" /> {t("periodTitle")}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {PRESETS.map(p => (
            <button key={p.id} onClick={() => setPreset(p.id)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition text-center ${
                preset === p.id
                  ? "border-tahfidz-green bg-tahfidz-green-light text-tahfidz-green"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
              }`}>
              <span className="text-xl">{p.icon}</span>
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-xs text-gray-400">{p.desc}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("from")}</label>
            <input type="date" value={dateFrom}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => { setDateFrom(e.target.value); setPreset("custom") }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("to")}</label>
            <input type="date" value={dateTo}
              max={new Date().toISOString().split("T")[0]}
              onChange={e => { setDateTo(e.target.value); setPreset("custom") }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
          </div>
        </div>

        <p className="mt-3 text-xs text-gray-400">
          📅 {t("periodRange")} : <strong className="text-gray-600 dark:text-gray-300">{fmt(dateFrom)}</strong> → <strong className="text-gray-600 dark:text-gray-300">{fmt(dateTo)}</strong>
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
          <CalendarCheck size={17} className="text-tahfidz-green" /> {t("groupTitle")}
        </h2>

        <select value={selGroup} onChange={e => setSelGroup(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
          {groups.length === 0 ? (
            <option>{t("noGroup")}</option>
          ) : (
            groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.teacher.user.fullName}{g._count ? ` (${g._count.students} ${t("files").split(" ")[0] === "fichiers" ? "élèves" : "students"})` : ""}
              </option>
            ))
          )}
        </select>

        {currentGroup && (
          <div className="mt-3 p-3 bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-lg text-sm text-gray-700 dark:text-gray-300">
            📋 {t("groupInfo")} : <strong>{currentGroup.name}</strong> · {t("teacher")} : <strong>{currentGroup.teacher.user.fullName}</strong>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Download size={17} className="text-tahfidz-green" /> {t("downloadTitle")}
        </h2>

        {progress && (
          <div className="p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
            <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 mb-1.5">
              <span className="font-medium">{t("progressMsg")} {progress.current}/{progress.total}</span>
              <span className="truncate ml-2 max-w-xs">{progress.group}</span>
            </div>
            <div className="h-1.5 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${(progress.current / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        <button onClick={exportOne} disabled={busy || !selGroup}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 gradient-tahfidz text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition text-sm">
          {busyOne ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {busyOne ? t("generating") : `${t("downloadOne")}${currentGroup ? ` (${currentGroup.name})` : ""}`}
        </button>

        {groups.length > 1 && (
          <button onClick={exportAll} disabled={busy || groups.length === 0}
            className="w-full flex items-center justify-center gap-2 px-6 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 font-medium rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 disabled:opacity-50 transition text-sm">
            {busyAll ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
            {busyAll
              ? `${t("progressMsg")} ${progress?.current ?? 0}/${progress?.total ?? 0}`
              : t("downloadAll")}
          </button>
        )}
      </div>
    </div>
  )
}
