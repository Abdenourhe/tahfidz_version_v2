"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Info, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

type BannerType = "info" | "warning" | "success" | "error"

interface BannerData {
  enabled: boolean
  message: string
  link?: string
  type: BannerType
}

interface GlobalConfig {
  banner?: BannerData
}

const typeStyles: Record<BannerType, string> = {
  info: "bg-blue-600 text-white",
  warning: "bg-amber-500 text-white",
  success: "bg-tahfidz-green text-white",
  error: "bg-red-600 text-white",
}

const typeIcons: Record<BannerType, React.ComponentType<{ className?: string; size?: number | string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  error: AlertCircle,
}

const STORAGE_KEY = "tahfidz-banner-closed"

export function GlobalBanner() {
  const [config, setConfig] = useState<GlobalConfig | null>(null)
  const [closed, setClosed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    try {
      const wasClosed = sessionStorage.getItem(STORAGE_KEY)
      if (wasClosed) setClosed(true)
    } catch { /* ignore */ }

    fetch("/api/site-config/global")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.value) setConfig(data.value)
      })
      .catch(() => {})
  }, [])

  const handleClose = () => {
    setClosed(true)
    try {
      sessionStorage.setItem(STORAGE_KEY, "1")
    } catch { /* ignore */ }
  }

  if (!mounted || closed || !config?.banner?.enabled || !config.banner.message) {
    return null
  }

  const { message, link, type = "info" } = config.banner
  const Icon = typeIcons[type]
  const content = (
    <div className={cn("flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium", typeStyles[type])}>
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{message}</span>
      {link && (
        <Link href={link} className="underline hover:opacity-90 shrink-0 ml-1">
          En savoir plus
        </Link>
      )}
    </div>
  )

  return (
    <div className={cn("relative", typeStyles[type])}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex-1 min-w-0">{content}</div>
        <button
          onClick={handleClose}
          className="shrink-0 p-1 ml-2 rounded-md hover:bg-white/20 transition"
          aria-label="Fermer la bannière"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
