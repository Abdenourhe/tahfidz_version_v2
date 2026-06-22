// src/components/ui/Logo.tsx — Logo de marque TAHFIDZ réutilisable
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { LogoText } from "@/components/LogoText"

type LogoVariant = "full" | "icon"
type DarkMode = "auto" | "light" | "dark"

interface LogoProps {
  variant?: LogoVariant
  size?: number
  width?: number
  height?: number
  className?: string
  imgClassName?: string
  darkMode?: DarkMode
  alt?: string
  priority?: boolean
}

const LOGO_PATHS: Record<LogoVariant, { light: string; dark: string }> = {
  full: {
    light: "/images/logo_full.png",
    dark: "/images/logo_full_dark.png",
  },
  icon: {
    light: "/images/logo_icon.png",
    dark: "/images/logo_icon_dark.png",
  },
}

export function Logo({
  variant = "full",
  size,
  width,
  height,
  className,
  imgClassName,
  darkMode = "auto",
  alt = "TAHFIDZ",
  priority = false,
}: LogoProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark =
    darkMode === "dark" ||
    (darkMode === "auto" &&
      (mounted ? resolvedTheme === "dark" || theme === "dark" : false))

  const src = isDark ? LOGO_PATHS[variant].dark : LOGO_PATHS[variant].light

  const computedWidth = width ?? size ?? (variant === "icon" ? 36 : 140)
  const computedHeight = height ?? size ?? (variant === "icon" ? 36 : 40)

  return (
    <div
      className={cn(
        "relative inline-flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: computedWidth, height: computedHeight }}
    >
      <Image
        src={src}
        alt={alt}
        width={computedWidth}
        height={computedHeight}
        priority={priority}
        className={cn("object-contain", imgClassName)}
        unoptimized
      />
    </div>
  )
}

// ─── Variant pratiques ───────────────────────────────────────────────────────

export function LogoFull(props: Omit<LogoProps, "variant">) {
  return <Logo variant="full" {...props} />
}

export function LogoIcon(props: Omit<LogoProps, "variant">) {
  return <Logo variant="icon" {...props} />
}

// ─── Icône + texte horizontal ────────────────────────────────────────────────

interface LogoHorizontalProps {
  iconSize?: number
  textWidth?: number
  textHeight?: number
  gap?: number
  className?: string
  darkMode?: DarkMode
  priority?: boolean
}

export function LogoHorizontal({
  iconSize = 28,
  textWidth = 120,
  textHeight = 24,
  gap = 10,
  className,
  darkMode = "auto",
  priority = false,
}: LogoHorizontalProps) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark =
    darkMode === "dark" ||
    (darkMode === "auto" &&
      (mounted ? resolvedTheme === "dark" || theme === "dark" : false))

  return (
    <div
      className={cn(
        "inline-flex items-center shrink-0 group cursor-pointer",
        isDark ? "text-white" : "text-[#064E3B]",
        "hover:text-tahfidz-green dark:hover:text-tahfidz-green",
        className
      )}
      style={{ gap }}
    >
      <LogoIcon size={iconSize} darkMode={darkMode} priority={priority} />
      <LogoText width={textWidth} height={textHeight} />
    </div>
  )
}
