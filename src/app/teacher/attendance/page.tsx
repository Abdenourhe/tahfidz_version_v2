"use client"
// src/app/teacher/attendance/page.tsx — Teacher attendance with download

import { useState, useEffect, useCallback } from "react"
import {
  CalendarCheck, Save, Loader2, Check, Clock, BookOpen, X,
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, AlertCircle, CheckCircle2
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"

interface Student { id: string; user: { fullName: string; fullNameAr?: string | null } }
interface Group   { id: string; name: string; students: Student[] }

export default function TeacherAttendancePage() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"

    const t = useT("attendance")

  const STATUS_OPTIONS = [
    { value: "PRESENT", label: t("present"), icon: Check,    active: "bg-green-500 text-white border-green-500",   inactive: "border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600" },
    { value: "LATE",    label: t("late"),    icon: Clock,    active: "bg-yellow-500 text-white border-yellow-500", inactive: "border-gray-200 text-gray-400 hover:border-yellow-300 hover:text-yellow-600" },
    { value: "EXCUSED", label: t("excused"), icon: BookOpen, active: "bg-blue-500 text-white border-blue-500",     inactive: "border-gray-200 text-gray-400 hover:border-blue-300 hover:text-blue-600" },
    { value: "ABSENT",  label: t("absent"),   icon: X,        active: "bg-red-500 text-white border-red-500",       inactive: "border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-600" },
  ]

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = filename; a.style.display = "none"
    document.body.appendChild(a); a.click()
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 200)
  }

  const [groups,    setGroups]    = useState<Group[]>([])
  const [groupId,   setGroupId]   = useState("")
  const [date,      setDate]      = useState(new Date().toISOString().split("T")[0])
  const [attendance,setAttendance]= useState<Record<string, string>>({})
  const [notes,     setNotes]     = useState<Record<string, string>>({})
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [success,   setSuccess]   = useState<string | null>(null)
  const [error,     setError]     = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const currentGroup = groups.find(g => g.id === groupId)
  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    fetch("/api/groups?mine=true")
      .then(r => r.json())
      .then(d => {
        const g = d.groups || []
        setGroups(g)
        if (g.length > 0) setGroupId(g[0].id)
      })
      .catch(() => setError(t("errorGroups")))
  }, [])

  const loadAttendance = useCallback(async () => {
    if (!groupId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/attendance?groupId=${groupId}&dateFrom=${date}T00:00:00Z&dateTo=${date}T23:59:59Z`)
      const data = await res.json()
      const att: Record<string, string> = {}
      const nts: Record<string, string> = {}
      currentGroup?.students.forEach(s => { att[s.id] = "PRESENT"; nts[s.id] = "" })
      ;(data.attendances || []).forEach((a: any) => { att[a.studentId] = a.status; nts[a.studentId] = a.notes || "" })
      setAttendance(att)
      setNotes(nts)
    } catch {
      setError(t("errorLoad"))
    } finally {
      setLoading(false)
    }
  }, [groupId, date, currentGroup])

  useEffect(() => { loadAttendance() }, [loadAttendance])

  const navigate = (dir: number) => {
    const d = new Date(date)
    d.setDate(d.getDate() + dir)
    setDate(d.toISOString().split("T")[0])
  }

  const save = async () => {
    if (!currentGroup || currentGroup.students.length === 0) {
      setError(t("errorNoStudent")); return
    }
    setSaving(true); setError(null); setSuccess(null)
    try {
      const records = currentGroup.students.map(s => ({
        studentId: s.id,
        status:    attendance[s.id] || "PRESENT",
        notes:     notes[s.id] || "",
      }))
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          date: new Date(`${date}T12:00:00Z`).toISOString(),
          studentIds: records.map(r => r.studentId),
          records,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = `Erreur ${res.status}`
        try { msg = JSON.parse(text).error || msg } catch {}
        throw new Error(typeof msg === "string" ? msg : "Erreur serveur")
      }
      const data = await res.json()
      setSuccess(t("successMsg"))
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorSave"))
    } finally {
      setSaving(false)
    }
  }

  const download = async () => {
    if (!groupId) return
    setDownloading(true); setError(null)
    try {
      const to = new Date()
      const from = new Date(); from.setDate(from.getDate() - 29)
      const params = new URLSearchParams({
        groupId,
        dateFrom: from.toISOString(),
        dateTo:   to.toISOString(),
      })
      const res = await fetch(`/api/attendance/export?${params}`)
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const blob = await res.blob()
      if (blob.size === 0) throw new Error("Fichier vide")
      const filename = `presences_${currentGroup?.name.replace(/\s+/g, "_") || "groupe"}_30j_${to.toISOString().split("T")[0]}.csv`
      triggerDownload(blob, filename)
      setSuccess(`✓ Rapport téléchargé : ${filename}`)
      setTimeout(() => setSuccess(null), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur téléchargement")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
        </div>
        <button onClick={download} disabled={downloading || !groupId}
          className="flex items-center gap-2 px-4 py-2.5 border border-tahfidz-green text-tahfidz-green text-sm font-medium rounded-lg hover:bg-tahfidz-green-light transition disabled:opacity-50">
          {downloading ? <Loader2 size={15} className="animate-spin" /> : <FileSpreadsheet size={15} />}
          {downloading ? t("generating") : t("download30")}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 size={15} className="flex-shrink-0 mt-0.5" /> <span>{success}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("group")}</label>
          <select value={groupId} onChange={e => setGroupId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green">
            {groups.length === 0
              ? <option>{t("noGroup")}</option>
              : groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.students.length} {t("students")})</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("date")}</label>
          <div className="flex gap-1.5">
            <button onClick={() => navigate(-1)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <ChevronLeft size={14} className="text-gray-500" />
            </button>
            <input type="date" value={date} max={today} onChange={e => setDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green" />
            <button onClick={() => navigate(1)} disabled={date >= today}
              className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition disabled:opacity-40">
              <ChevronRight size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
          {!currentGroup ? (
            <div className="p-12 text-center text-gray-400">
              <p>{t("selectGroup")}</p>
            </div>
          ) : currentGroup.students.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p>{t("noStudent")}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-xs text-gray-500 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-5 py-3 text-left font-medium">{t("student")}</th>
                  {STATUS_OPTIONS.map(s => (
                    <th key={s.value} className="px-3 py-3 text-center font-medium">{s.label}</th>
                  ))}
                  <th className="px-5 py-3 text-left font-medium">{t("notes")}</th>
                </tr>
              </thead>
              <tbody>
                {currentGroup.students.map(student => (
                  <tr key={student.id} className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{student.user.fullName}</p>
                      {student.user.fullNameAr && <p className="arabic text-xs text-gray-400">{student.user.fullNameAr}</p>}
                    </td>
                    {STATUS_OPTIONS.map(s => (
                      <td key={s.value} className="px-3 py-3 text-center">
                        <button
                          onClick={() => setAttendance(prev => ({ ...prev, [student.id]: s.value }))}
                          className={`p-2 rounded-lg border-2 transition ${attendance[student.id] === s.value ? s.active : s.inactive}`}>
                          <s.icon size={14} />
                        </button>
                      </td>
                    ))}
                    <td className="px-5 py-3">
                      <input
                        type="text"
                        value={notes[student.id] ?? ""}
                        onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
                        placeholder={t("notesPlaceholder")}
                        className="w-full text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-tahfidz-green"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {currentGroup && currentGroup.students.length > 0 && (
        <div className="flex justify-end">
          <button onClick={save} disabled={saving}
            className="px-6 py-3 bg-tahfidz-green text-white font-semibold rounded-xl hover:bg-tahfidz-green-dark transition disabled:opacity-50 flex items-center gap-2">
            {saving ? <><Loader2 size={16} className="animate-spin" />{t("saving")}</> : t("save")}
          </button>
        </div>
      )}
    </div>
  )
}
