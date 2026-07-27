// src/components/ui/Badge.tsx
// Badge coloré pour les statuts, tags et labels

import React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps {
  /** Variant de couleur */
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold"
  /** Contenu du badge */
  children: React.ReactNode
  /** Classes CSS additionnelles */
  className?: string
  /** Taille du badge */
  size?: "sm" | "md"
}

const variantStyles = {
  default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  success: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  danger:  "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  info:    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  gold:    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
}

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-sm",
}

export function Badge({
  variant = "default",
  children,
  className,
  size = "md",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  )
}
