"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function CollapsibleMain({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tahfidz_sidebar_collapsed")
      if (stored !== null) setCollapsed(stored === "true")
    } catch { /* ignore */ }
    const handler = (e: Event) => setCollapsed((e as CustomEvent).detail)
    window.addEventListener("sidebar:collapsed", handler)
    return () => window.removeEventListener("sidebar:collapsed", handler)
  }, [])

  return (
    <main
      className={cn(
        "flex-1 overflow-y-auto flex flex-col transition-all duration-300 ease-in-out",
        collapsed ? "md:ms-20" : "md:ms-64",
        className
      )}
    >
      {children}
    </main>
  )
}
