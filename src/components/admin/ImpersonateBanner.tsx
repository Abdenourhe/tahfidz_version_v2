"use client"
// src/components/admin/ImpersonateBanner.tsx

import { useEffect, useState } from "react"
import { Eye, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImpersonateInfo {
  schoolName: string
  schoolSlug: string
  adminEmail: string
  adminName: string
  originalAdmin: string
}

export function ImpersonateBanner() {
  const [info, setInfo] = useState<ImpersonateInfo | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Lire le cookie impersonate_info
    const cookie = document.cookie
      .split("; ")
      .find(row => row.startsWith("impersonate_info="))

    if (cookie) {
      try {
        const value = decodeURIComponent(cookie.split("=")[1])
        setInfo(JSON.parse(value))
      } catch { /* ignore */ }
    }
  }, [])

  const stopImpersonating = async () => {
    await fetch("/api/admin/impersonate", { method: "DELETE" })
    router.push("/admin/super")
    router.refresh()
  }

  if (!info) return null

  return (
    <div className="bg-purple-600 text-white px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <Eye size={16} />
        <span className="font-medium">
          Mode impersonation : {info.schoolName}
        </span>
        <span className="text-purple-200 text-xs hidden sm:inline">
          ({info.schoolSlug}) — Admin : {info.adminName}
        </span>
      </div>
      <button 
        onClick={stopImpersonating}
        className="flex items-center gap-1 px-3 py-1 bg-purple-700 hover:bg-purple-800 rounded text-xs transition"
      >
        <LogOut size={12} /> Quitter
      </button>
    </div>
  )
}