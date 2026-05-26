"use client"
import { useState, useEffect, useCallback } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Alert {
  id: string
  date: string
  status: string
  reason: string | null
  student: { user: { fullName: string } }
  parent: { fullName: string }
}

export default function AdminAttendanceAlerts() {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("adminAttendanceAlerts")

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/parent-attendance/alerts")
      const data = await res.json()
      setAlerts(data.alerts || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  if (loading) {
    return <div className="flex justify-center py-4"><Loader2 className="animate-spin" size={16} /></div>
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-red-500" />
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{t("absenceAlerts")}</h3>
        {alerts.length > 0 && (
          <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
            {alerts.length}
          </span>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {alerts.map((a) => (
          <div key={a.id} className="flex items-start gap-2 p-2.5 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="mt-0.5">
              <AlertTriangle size={12} className="text-red-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {a.student.user.fullName} — {t("absent")}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(a.date, L)} — {t("reportedBy")}: {a.parent.fullName}
              </p>
              {a.reason && <p className="text-xs text-gray-400 mt-0.5">{a.reason}</p>}
            </div>
          </div>
        ))}
        {alerts.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-gray-400 text-sm">
            <CheckCircle2 size={14} />
            {t("noAlerts")}
          </div>
        )}
      </div>
    </div>
  )
}
