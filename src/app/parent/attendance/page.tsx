"use client"
// Page présences parent : sur desktop on préfère le master-detail du dashboard

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ParentAttendancePanel } from "@/components/parent/attendance/ParentAttendancePanel"

export default function ParentAttendancePage() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth >= 1280) {
      router.replace("/parent/dashboard?attendance=1")
    }
  }, [router])

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <ParentAttendancePanel />
    </div>
  )
}
