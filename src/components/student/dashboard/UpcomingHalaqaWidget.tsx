"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Video, Clock, Radio } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface Halaqa {
  id: string
  meetingName: string
  status: string
  scheduledAt: string
  teacher?: { fullName: string } | null
}

function formatCountdown(ms: number) {
  const h = Math.floor(ms / (1000 * 60 * 60))
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  return `${h}h ${m}m`
}

export function UpcomingHalaqaWidget({ halaqa }: { halaqa: Halaqa | null }) {
  const t = useT("studentDashboardClient")
  const th = useT("halaqa")
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000)
    return () => clearInterval(interval)
  }, [])

  if (!halaqa) return null

  const scheduled = new Date(halaqa.scheduledAt).getTime()
  const diff = scheduled - now
  const isLive = halaqa.status === "LIVE"
  const isSoon = diff > 0 && diff < 1000 * 60 * 60 * 2

  return (
    <div className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${
      isLive
        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
        : isSoon
          ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
          : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
    }`}>
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${isLive ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
          {isLive ? <Radio size={18} className="animate-pulse" /> : <Video size={18} />}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900 dark:text-white">{halaqa.meetingName}</p>
          <p className="text-xs text-gray-500">
            {halaqa.teacher?.fullName || ""} · {isLive ? th("live") : formatCountdown(diff)}
          </p>
        </div>
      </div>
      <Link
        href={`/student/halaqa/${halaqa.id}`}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium text-white transition ${
          isLive ? "bg-red-600 hover:bg-red-700 animate-pulse" : "bg-tahfidz-green hover:bg-emerald-700"
        }`}
      >
        {isLive ? t("joinNow") : t("enter")}
      </Link>
    </div>
  )
}
