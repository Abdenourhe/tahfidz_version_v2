"use client"
// ParentAttendancePanel.tsx — Panneau latéral des présences côté dashboard

import { useEffect, useState } from "react"
import { ParentProfileAttendance } from "./ParentProfileAttendance"

interface Child {
  id: string
  relation: string
  student: {
    id: string
    user: { fullName: string; fullNameAr?: string | null; avatar?: string | null }
    group: { id: string; name: string; schedule?: Record<string, string> | null } | null
    teacher: { user: { fullName: string } } | null
  }
}

export function ParentAttendancePanel() {
  const [children, setChildren] = useState<Child[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/parent/children")
      .then((res) => res.json())
      .then((data) => {
        setChildren(data.childrenLinks || [])
        setLoading(false)
      })
      .catch((e) => {
        console.error(e)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-tahfidz-green border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    )
  }

  return <ParentProfileAttendance>{children as any}</ParentProfileAttendance>
}
