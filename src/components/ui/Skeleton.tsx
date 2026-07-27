// src/components/ui/Skeleton.tsx
// Indicateur de chargement skeleton avec animation pulse

import React from "react"
import { cn } from "@/lib/utils"

export interface SkeletonProps {
  /** Largeur CSS (ex: "100%", "200px", "w-1/2") */
  width?: string
  /** Hauteur CSS (ex: "16px", "1rem") */
  height?: string
  /** Affiche un cercle au lieu d'un rectangle */
  circle?: boolean
  /** Classes CSS additionnelles */
  className?: string
}

export function Skeleton({
  width = "100%",
  height = "16px",
  circle = false,
  className,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200 dark:bg-gray-700",
        circle ? "rounded-full" : "rounded-md",
        className
      )}
      style={{
        width: circle ? height : width,
        height,
      }}
      aria-hidden="true"
    />
  )
}
