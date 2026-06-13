// src/app/admin/super/audit/page.tsx

"use client"

import { useEffect, useState } from "react"
import { AuditTab } from "@/components/admin/superadmin/system-tabs"
import { AuditLog } from "@/components/admin/superadmin/types"

export default function SuperAdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    setError(null)
    fetch("/api/admin/audit")
      .then(async (res) => {
        if (!res.ok) throw new Error("Erreur")
        return res.json()
      })
      .then((data) => {
        const mapped = (data.logs || []).map((log: any) => ({
          id: log.id || String(Math.random()),
          action: log.action || "UNKNOWN",
          actor: log.actor || log.user?.email || log.user?.fullName || "Système",
          actorId: log.actorId || log.userId || "—",
          target: log.target || log.entityId || "—",
          targetId: log.targetId || log.entityId || "—",
          targetType: log.targetType || log.entityType || "SYSTEM",
          details: log.details || null,
          ipAddress: log.ipAddress || null,
          userAgent: log.userAgent || null,
          createdAt: log.createdAt || new Date().toISOString(),
        }))
        setLogs(mapped)
      })
      .catch(() => setError("Impossible de charger les logs d'audit"))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return <AuditTab logs={logs} loading={loading} error={error} onReload={load} />
}
