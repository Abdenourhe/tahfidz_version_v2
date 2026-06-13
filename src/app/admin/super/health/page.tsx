// src/app/admin/super/health/page.tsx

"use client"

import { useEffect, useState } from "react"
import { HealthTab } from "@/components/admin/superadmin/system-tabs"
import { SystemHealth } from "@/components/admin/superadmin/types"

export default function SuperAdminHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetch("/api/admin/health")
      .then((res) => res.json())
      .then((data) => setHealth(data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return <HealthTab health={health} loading={loading} />
}
