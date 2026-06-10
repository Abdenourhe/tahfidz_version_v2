"use client"

import { motion } from "framer-motion"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed"

export function SidebarToggle({
  collapsed,
  toggle,
  className,
}: {
  collapsed?: boolean
  toggle?: () => void
  className?: string
}) {
  const ctx = useSidebarCollapsed()
  const isCollapsed = collapsed ?? ctx.collapsed
  const onToggle = toggle ?? ctx.toggle

  return (
    <button
      onClick={onToggle}
      className={cn(
        "p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/20 transition-colors",
        className
      )}
      title={isCollapsed ? "Développer" : "Réduire"}
    >
      <motion.div
        animate={{ rotate: isCollapsed ? 180 : 0 }}
        transition={{ duration: 0.25 }}
      >
        {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </motion.div>
    </button>
  )
}
