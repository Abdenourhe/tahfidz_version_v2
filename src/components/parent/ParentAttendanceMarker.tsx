"use client"
import React, { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { CalendarDays, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Child {
  id: string
  fullName: string
}

interface AttendanceRecord {
  id: string
  studentId: string
  date: string
  status: string
  reason: string | null
  validatedBy: string | null
  validatedAt: string | null
  student: { user: { fullName: string } }
}

export default function ParentAttendanceMarker({
  children,
  childId,
  showTitle = true,
}: {
  children?: Child[]
  childId?: string
  showTitle?: boolean
}) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentAttendanceMarker")

  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const childList = children ?? []
  const [selectedChild, setSelectedChild] = useState<string>(childId || childList[0]?.id || "")
  const [status, setStatus] = useState<string>("PRESENT")
  const [reason, setReason] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Load from BOTH tables so parent sees complete history
      const [paRes, attRes] = await Promise.all([
        fetch("/api/parent-attendance"),
        fetch(`/api/attendance?studentId=${selectedChild || ""}&dateFrom=${todayStr}&dateTo=${todayStr}`),
      ])
      const paData = await paRes.json()
      const attData = await attRes.json()

      const paRecords: AttendanceRecord[] = (paData.attendances || []).map((a: any) => ({
        id: a.id,
        studentId: a.studentId,
        date: a.date,
        status: a.status,
        reason: a.reason,
        validatedBy: a.validatedBy,
        validatedAt: a.validatedAt,
        student: a.student,
      }))

      const attRecords: AttendanceRecord[] = (attData.attendances || []).map((a: any) => ({
        id: `att-${a.id}`,
        studentId: a.studentId,
        date: a.date,
        status: a.status,
        reason: a.notes,
        validatedBy: a.recordedBy ? "system" : null,
        validatedAt: a.createdAt,
        student: a.student,
      }))

      // Merge and dedupe by studentId+date+status
      const map = new Map<string, AttendanceRecord>()
      ;[...attRecords, ...paRecords].forEach(r => {
        const key = `${r.studentId}-${r.date}-${r.status}`
        map.set(key, r)
      })
      setRecords(Array.from(map.values()).sort((a, b) => +new Date(b.date) - +new Date(a.date)))
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [selectedChild, todayStr])

  useEffect(() => { load() }, [load])

  const handleSubmit = async () => {
    if (!selectedDate || !selectedChild) return
    setSubmitting(true)
    try {
      // Save to parent-attendance (preserves teacher validation workflow)
      const res = await fetch("/api/parent-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: selectedChild, date: selectedDate, status, reason: reason || null }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Erreur lors de l'enregistrement")
        return
      }
      setModalOpen(false)
      setReason("")
      setStatus("PRESENT")
      load()
    } catch (e) {
      console.error(e)
      alert("Erreur réseau")
    } finally {
      setSubmitting(false)
    }
  }

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    PRESENT: { icon: <CheckCircle2 size={14} />, color: "bg-green-100 text-green-700 border-green-200", label: t("present") },
    ABSENT: { icon: <XCircle size={14} />, color: "bg-red-100 text-red-700 border-red-200", label: t("absent") },
    LATE: { icon: <Clock size={14} />, color: "bg-orange-100 text-orange-700 border-orange-200", label: t("late") },
    EXCUSED: { icon: <AlertCircle size={14} />, color: "bg-blue-100 text-blue-700 border-blue-200", label: t("excused") },
  }

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {showTitle && <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("markAttendance")}</h3>}
        {!showTitle && <div />}
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-tahfidz-green text-white rounded-lg text-sm hover:opacity-90"
        >
          <CalendarDays size={14} /> {t("mark")}
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-bold text-lg">{t("markAttendance")}</h4>
            <div>
              <label className="block text-sm font-medium mb-1">{t("child")}</label>
              <select
                value={selectedChild}
                onChange={(e) => setSelectedChild(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                {childList.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("date")}</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("status")}</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(statusConfig).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setStatus(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs border transition ${
                      status === key ? cfg.color + " ring-1" : "bg-gray-50 dark:bg-gray-800 text-gray-500 border-gray-100 dark:border-gray-700"
                    }`}
                  >
                    {cfg.icon} {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            {status === "ABSENT" && (
              <div>
                <label className="block text-sm font-medium mb-1">{t("reason")} *</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  rows={2}
                  required
                />
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedDate || (status === "ABSENT" && !reason)}
                className="flex-1 py-2 bg-tahfidz-green text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin mx-auto" size={16} /> : t("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {records
          .filter((r) => (childId ? r.studentId === childId : true))
          .slice(0, 14)
          .map((r) => {
            const cfg = statusConfig[r.status] || statusConfig.PRESENT
            const showName = !childId
            return (
              <div key={r.id} className={`flex items-center justify-between p-3 rounded-lg border ${cfg.color} bg-opacity-50`}>
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <div>
                    {showName && <p className="text-sm font-medium">{r.student.user.fullName}</p>}
                    <p className={`opacity-80 ${showName ? "text-xs" : "text-sm"}`}>{formatDate(r.date.slice(0, 10) + "T12:00:00", L)}</p>
                    {r.reason && <p className="text-xs opacity-70">{r.reason}</p>}
                  </div>
                </div>
                {r.validatedBy ? (
                  <span className="text-xs px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-full">{t("validated")}</span>
                ) : (
                  <span className="text-xs px-2 py-0.5 bg-white/60 dark:bg-black/20 rounded-full">{t("pending")}</span>
                )}
              </div>
            )
          })}
        {records.length === 0 && (
          <p className="text-center text-gray-400 py-6 text-sm">{t("noRecords")}</p>
        )}
      </div>
    </div>
  )
}
