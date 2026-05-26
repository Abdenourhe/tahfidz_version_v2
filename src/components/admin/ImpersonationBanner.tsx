"use client"
// src/components/admin/ImpersonationBanner.tsx
// Bannière visible quand le superadmin est en mode impersonation

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, LogOut } from "lucide-react"

interface ImpersonationStatus {
  targetAdminId: string
  targetSchoolId: string
  superadminId: string
  createdAt: number
  schoolName: string
  schoolSlug: string
  adminName: string
  adminEmail: string
}

export function ImpersonationBanner() {
  const [imp, setImp] = useState<ImpersonationStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/impersonation/status")
      .then(r => r.json())
      .then(data => setImp(data))
      .catch(() => setImp(null))
  }, [])

  if (!imp) return null

  const handleExit = async () => {
    setLoading(true)
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" })
      router.push("/admin/super")
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between text-sm shadow-md z-50 relative">
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert size={16} className="shrink-0" />
        <span className="truncate">
          Mode impersonation : vous agissez au nom de <strong>{imp.adminName}</strong> ({imp.adminEmail}) — École <strong>{imp.schoolName}</strong>
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={loading}
        className="flex items-center gap-1.5 bg-white text-amber-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-gray-100 transition active:scale-95 disabled:opacity-60 shrink-0 ml-3"
      >
        <LogOut size={14} />
        {loading ? "..." : "Quitter"}
      </button>
    </div>
  )
}
