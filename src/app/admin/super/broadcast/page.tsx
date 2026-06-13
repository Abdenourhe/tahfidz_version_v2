// src/app/admin/super/broadcast/page.tsx

"use client"

import { useEffect, useState } from "react"
import { BroadcastTab } from "@/components/admin/superadmin/broadcast-tab"

export default function SuperAdminBroadcastPage() {
  const [counts, setCounts] = useState<{ schoolCount: number; activeCount: number; inactiveCount: number } | null>(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch("/api/admin/schools")
      .then((res) => res.json())
      .then((data) => {
        const schools = data.schools || []
        setCounts({
          schoolCount: schools.length,
          activeCount: schools.filter((s: any) => s.isActive).length,
          inactiveCount: schools.filter((s: any) => !s.isActive).length,
        })
      })
      .catch(() => setCounts({ schoolCount: 0, activeCount: 0, inactiveCount: 0 }))
  }, [])

  const sendBroadcast = async (message: string, target: "all" | "active" | "inactive") => {
    setSending(true)
    try {
      await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, target }),
      })
    } finally {
      setSending(false)
    }
  }

  if (!counts) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" />
      </div>
    )
  }

  return (
    <BroadcastTab
      schoolCount={counts.schoolCount}
      activeCount={counts.activeCount}
      inactiveCount={counts.inactiveCount}
      sending={sending}
      onSubmit={sendBroadcast}
    />
  )
}
