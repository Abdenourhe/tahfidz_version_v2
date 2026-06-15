"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { useSearchParams } from "next/navigation"
import { CheckCircle2, XCircle, Loader2, Users, AlertTriangle, Clock, BookOpen, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Group { id: string; name: string; schedule?: Record<string, string> | null }
interface Student { id: string; user: { fullName: string } }

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
const MONTH_NAMES = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]

function getCourseDayIndices(schedule: Record<string, string> | null | undefined): number[] {
  if (!schedule) return []
  const indices = new Set<number>()
  Object.keys(schedule).forEach(day => {
    const idx = DAY_KEYS.indexOf(day.toLowerCase() as typeof DAY_KEYS[number])
    if (idx >= 0) indices.add(idx)
  })
  return Array.from(indices).sort((a, b) => a - b)
}

function buildMonthGrid(activeDate: string, courseDayIndices: number[]) {
  const d = new Date(`${activeDate}T12:00:00`)
  const year = d.getFullYear()
  const month = d.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startOffset = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const todayStr = new Date().toISOString().split("T")[0]

  const cells: { dateStr?: string; dayNum?: number; isCourseDay: boolean; isToday: boolean; isPast: boolean }[] = []
  for (let i = 0; i < startOffset; i++) cells.push({ isCourseDay: false, isToday: false, isPast: true })
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = new Date(year, month, day).toISOString().split("T")[0]
    const weekday = new Date(year, month, day).getDay()
    cells.push({ dateStr, dayNum: day, isCourseDay: courseDayIndices.includes(weekday), isToday: dateStr === todayStr, isPast: dateStr < todayStr })
  }
  return cells
}

interface ParentAlert {
  id: string
  date: string
  status: string
  reason: string | null
  validatedBy: string | null
  validatedAt: string | null
  student: { id: string; user: { fullName: string } }
  parent: { fullName: string }
}

const OPTS = [
  { value: "PRESENT", label: "Présent", icon: CheckCircle2, cls: "bg-green-500 text-white", off: "text-gray-300 hover:text-green-500" },
  { value: "LATE",    label: "Retard",  icon: Clock,        cls: "bg-yellow-500 text-white", off: "text-gray-300 hover:text-yellow-500" },
  { value: "EXCUSED", label: "Excusé",  icon: BookOpen,     cls: "bg-blue-500 text-white",   off: "text-gray-300 hover:text-blue-500" },
  { value: "ABSENT",  label: "Absent",  icon: XCircle,      cls: "bg-red-500 text-white",    off: "text-gray-300 hover:text-red-500" },
]

export default function TeacherAttendanceValidation() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherAttendanceValidation")
  const searchParams = useSearchParams()
  const highlightStudentId = searchParams.get("studentId")
  const highlightDate = searchParams.get("date")
  const alertRowRef = useRef<HTMLTableRowElement | null>(null)

  /* ── Group + Date ── */
  const [groups, setGroups] = useState<Group[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>("")
  const [groupSchedule, setGroupSchedule] = useState<Record<string, string> | null>(null)
  const [date, setDate] = useState<string>(highlightDate || new Date().toISOString().split("T")[0])

  /* ── Students + Attendance ── */
  const [students, setStudents] = useState<Student[]>([])
  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [parentAlertsMap, setParentAlertsMap] = useState<Record<string, ParentAlert>>({})
  const [loadingStudents, setLoadingStudents] = useState(false)

  /* ── Alerts section ── */
  const [alerts, setAlerts] = useState<ParentAlert[]>([])
  const [alertsFilter, setAlertsFilter] = useState<"all" | "pending" | "validated">("pending")
  const [validating, setValidating] = useState<string | null>(null)
  const [loadingAlerts, setLoadingAlerts] = useState(true)

  /* ── Reject modal ── */
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectingAlertId, setRejectingAlertId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  /* ── Load groups ── */
  useEffect(() => {
    fetch("/api/groups?mine=true")
      .then(r => r.json())
      .then(d => {
        const g: Group[] = d.groups || []
        setGroups(g)
        if (highlightStudentId) {
          // Find group containing the highlighted student
          const targetGroup = g.find((grp: any) =>
            grp.students?.some((s: any) => s.id === highlightStudentId)
          )
          if (targetGroup) {
            setSelectedGroup(targetGroup.id)
          } else if (g[0]) {
            setSelectedGroup(g[0].id)
          }
        } else if (g[0]) {
          setSelectedGroup(g[0].id)
        }
      })
  }, [highlightStudentId])

  /* ── Load students + attendance + parent alerts ── */
  const loadSheet = useCallback(async () => {
    if (!selectedGroup) return
    setLoadingStudents(true)
    try {
      const [groupRes, attRes, parentRes] = await Promise.all([
        fetch(`/api/groups/${selectedGroup}`),
        fetch(`/api/attendance?groupId=${selectedGroup}&dateFrom=${date}T00:00:00Z&dateTo=${date}T23:59:59Z`),
        fetch(`/api/parent-attendance/teacher?groupId=${selectedGroup}&date=${date}`),
      ])
      const groupData = await groupRes.json()
      const attData = await attRes.json()
      const parentData = await parentRes.json()

      const studs: Student[] = groupData.group?.students || []
      setStudents(studs)
      setGroupSchedule(groupData.group?.schedule || null)

      // Default all PRESENT
      const attMap: Record<string, string> = {}
      studs.forEach(s => { attMap[s.id] = "PRESENT" })

      // Override with existing attendance
      ;(attData.attendances || []).forEach((a: any) => {
        attMap[a.studentId] = a.status
      })

      // Parent alerts
      const alertMap: Record<string, ParentAlert> = {}
      ;(parentData.attendances || []).forEach((a: ParentAlert) => {
        alertMap[a.student.id] = a
        if (a.status === "ABSENT") {
          attMap[a.student.id] = "ABSENT"
        }
      })

      setAttendance(attMap)
      setParentAlertsMap(alertMap)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingStudents(false)
    }
  }, [selectedGroup, date])

  useEffect(() => { loadSheet() }, [loadSheet])

  /* ── Scroll to highlighted alert ── */
  useEffect(() => {
    if (alertRowRef.current) {
      alertRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [alertsFilter, alerts, highlightStudentId])

  /* ── Load all alerts ── */
  const loadAlerts = useCallback(async () => {
    setLoadingAlerts(true)
    try {
      const res = await fetch("/api/parent-attendance/teacher")
      const data = await res.json()
      setAlerts(data.attendances || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAlerts(false)
    }
  }, [])

  useEffect(() => { loadAlerts() }, [loadAlerts])

  /* ── Validate / Reject alert ── */
  const handleValidateAlert = async (id: string, validated: boolean, reason?: string) => {
    setValidating(id)
    try {
      const res = await fetch(`/api/parent-attendance/${id}/validate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validated, rejectionReason: reason || undefined }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || "Erreur lors du traitement")
        return
      }
      loadAlerts()
      loadSheet()
    } catch (e) {
      console.error(e)
      alert("Erreur réseau")
    } finally {
      setValidating(null)
    }
  }

  const filteredAlerts = alerts.filter((r) => {
    if (alertsFilter === "pending") return !r.validatedBy
    if (alertsFilter === "validated") return !!r.validatedBy
    return true
  })

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      PRESENT: "bg-green-100 text-green-700",
      ABSENT: "bg-red-100 text-red-700",
      LATE: "bg-orange-100 text-orange-700",
      EXCUSED: "bg-blue-100 text-blue-700",
    }
    return map[status] || "bg-gray-100 text-gray-600"
  }

  return (
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════
          FEUILLE DE PRÉSENCE PAR GROUPE
          ═══════════════════════════════════════════ */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t("attendanceSheet")}</h2>

        {/* Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            >
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        {/* Calendar card */}
        {selectedGroup && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const d = new Date(`${date}T12:00:00`)
                    d.setMonth(d.getMonth() - 1)
                    setDate(d.toISOString().split("T")[0])
                  }}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 min-w-[120px] text-center">
                  {MONTH_NAMES[new Date(`${date}T12:00:00`).getMonth()]} {new Date(`${date}T12:00:00`).getFullYear()}
                </p>
                <button
                  onClick={() => {
                    const d = new Date(`${date}T12:00:00`)
                    d.setMonth(d.getMonth() + 1)
                    setDate(d.toISOString().split("T")[0])
                  }}
                  className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-tahfidz-green" /> Jour de cours
                </span>
                <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-200 dark:bg-gray-700" /> Repos
                </span>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((h, i) => (
                <div key={i} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 py-1">{h}</div>
              ))}
              {buildMonthGrid(date, getCourseDayIndices(groupSchedule)).map((cell, i) => (
                <button key={i}
                  disabled={!cell.isCourseDay}
                  onClick={() => cell.dateStr && cell.isCourseDay && setDate(cell.dateStr)}
                  className={`h-10 rounded-lg text-sm font-bold flex items-center justify-center transition active:scale-90 ${
                    cell.dateStr === date
                      ? "bg-tahfidz-green text-white shadow-sm ring-2 ring-tahfidz-green/30"
                      : cell.isToday
                        ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                        : cell.isCourseDay
                          ? "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                          : "text-gray-200 dark:text-gray-700 cursor-default"
                  }`}>
                  {cell.dayNum}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Students table */}
        {loadingStudents ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : students.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-400 text-sm">
            {t("noStudentsInGroup")}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("student")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("status")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("alert")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {students.map(s => {
                  const cur = attendance[s.id] || "PRESENT"
                  const alert = parentAlertsMap[s.id]
                  return (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.user.fullName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {OPTS.map(o => {
                            const Icon = o.icon
                            const active = cur === o.value
                            return (
                              <button
                                key={o.value}
                                onClick={() => setAttendance(prev => ({ ...prev, [s.id]: o.value }))}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                                  active ? o.cls : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                                title={o.label}
                              >
                                <Icon size={12} />
                                {o.label}
                              </button>
                            )
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {alert ? (
                          <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
                            <AlertTriangle size={10} />
                            {t("parentAlert")}: {alert.status}
                            {alert.reason && <span className="text-orange-400">— {alert.reason}</span>}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ALERTES PARENTALES
          ═══════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("validateAttendance")}</h3>
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {(["pending", "validated", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setAlertsFilter(f)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                  alertsFilter === f ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-gray-100" : "text-gray-500"
                }`}
              >
                {t(f)}
              </button>
            ))}
          </div>
        </div>

        {loadingAlerts ? (
          <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">{t("date")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("student")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("parent")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("status")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("reason")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredAlerts.map((r) => {
                  const isHighlighted = highlightStudentId === r.student.id && (!highlightDate || r.date.startsWith(highlightDate))
                  return (
                  <tr
                    key={r.id}
                    ref={isHighlighted ? alertRowRef : undefined}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${isHighlighted ? "ring-2 ring-tahfidz-green bg-tahfidz-green-light/30" : ""}`}
                  >
                    <td className="px-3 py-2">{formatDate(r.date.slice(0, 10) + "T12:00:00", L)}</td>
                    <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{r.student.user.fullName}</td>
                    <td className="px-3 py-2 text-gray-500">{r.parent.fullName}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                        {t(r.status.toLowerCase()) || r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-500 text-xs max-w-[150px] truncate">{r.reason || "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {!r.validatedBy ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleValidateAlert(r.id, true)}
                            disabled={validating === r.id}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title={t("validate")}
                          >
                            {validating === r.id ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                          </button>
                          <button
                            onClick={() => { setRejectingAlertId(r.id); setRejectModalOpen(true); setRejectReason("") }}
                            disabled={validating === r.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title={t("reject")}
                          >
                            <XCircle size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">{t("validated")}</span>
                      )}
                    </td>
                  </tr>
                )})}
                {filteredAlerts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-gray-400 text-sm">
                      {t("noRecords")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectModalOpen && rejectingAlertId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h4 className="font-bold text-lg text-gray-900 dark:text-white">Rejeter l&apos;absence</h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Vous êtes sur le point de rejeter le signalement d&apos;absence. Le parent sera notifié. Veuillez indiquer pourquoi l&apos;élève doit être présent.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motif du rejet <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Ex: Examen obligatoire, sortie scolaire..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => { setRejectModalOpen(false); setRejectingAlertId(null); setRejectReason("") }}
                className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  if (!rejectReason.trim()) return
                  handleValidateAlert(rejectingAlertId, false, rejectReason.trim())
                  setRejectModalOpen(false)
                  setRejectingAlertId(null)
                  setRejectReason("")
                }}
                disabled={!rejectReason.trim() || validating === rejectingAlertId}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                {validating === rejectingAlertId ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
