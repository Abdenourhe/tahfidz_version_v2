// src/components/ui/Avatar.tsx
// Avatar avec image, initiales sur fond gradient et fallback

import React, { useState } from "react"
import { cn } from "@/lib/utils"

export interface AvatarProps {
  /** URL de l'image */
  src?: string | null
  /** Nom complet de l'utilisateur (utilisé pour les initiales) */
  name?: string
  /** Taille de l'avatar */
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  /** Classes CSS additionnelles */
  className?: string
}

const sizeStyles = {
  xs:  "h-6 w-6 text-[10px]",
  sm:  "h-8 w-8 text-xs",
  md:  "h-10 w-10 text-sm",
  lg:  "h-14 w-14 text-base",
  xl:  "h-20 w-20 text-xl",
}

/** Extrait les initiales d'un nom complet */
function getInitials(name?: string): string {
  if (!name) return "?"
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [hasError, setHasError] = useState(false)
  const showImage = src && !hasError

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-tahfidz-green to-tahfidz-purple",
        sizeStyles[size],
        className
      )}
      aria-label={name || "Avatar"}
      role="img"
    >
      {showImage ? (
        <img
          src={src}
          alt={name || "Avatar"}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <span className="font-semibold text-white select-none">
          {getInitials(name)}
        </span>
      )}
    </div>
  )
}
