"use client"

import { cn } from "@/lib/utils"

interface Props {
  progress: number
  className?: string
  showLabel?: boolean
}

export function ProgressBar({ progress, className, showLabel = true }: Props) {
  const pct = Math.min(100, Math.max(0, progress))
  return (
    <div className={cn("space-y-1", className)}>
      {showLabel && <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400"><span>Progression</span><span>{Math.round(pct)}%</span></div>}
      <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className="h-full rounded-full bg-tahfidz-green transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
