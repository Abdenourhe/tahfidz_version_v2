// src/components/ui/Logo.tsx — Logo de marque TAHFIDZ réutilisable
"use client"

import Image from "next/image"
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
  const computedWidth = width ?? size ?? (variant === "icon" ? 36 : 140)
  const computedHeight = height ?? size ?? (variant === "icon" ? 36 : 40)

  const baseClass = cn("object-contain", imgClassName)

  // Mode forcé
  if (darkMode === "dark") {
    return (
      <div
        className={cn("relative inline-flex items-center justify-center shrink-0", className)}
        style={{ width: computedWidth, height: computedHeight }}
      >
        <Image
          src={LOGO_PATHS[variant].dark}
          alt={alt}
          width={computedWidth}
          height={computedHeight}
          priority={priority}
          className={baseClass}
          unoptimized
        />
      </div>
    )
  }

  if (darkMode === "light") {
    return (
      <div
        className={cn("relative inline-flex items-center justify-center shrink-0", className)}
        style={{ width: computedWidth, height: computedHeight }}
      >
        <Image
          src={LOGO_PATHS[variant].light}
          alt={alt}
          width={computedWidth}
          height={computedHeight}
          priority={priority}
          className={baseClass}
          unoptimized
        />
      </div>
    )
  }

  // Mode auto : deux images avec classes dark: pour éviter le flash hydration
  return (
    <div
      className={cn("relative inline-flex items-center justify-center shrink-0", className)}
      style={{ width: computedWidth, height: computedHeight }}
    >
      <Image
        src={LOGO_PATHS[variant].light}
        alt={alt}
        width={computedWidth}
        height={computedHeight}
        priority={priority}
        className={cn(baseClass, "dark:hidden")}
        unoptimized
      />
      <Image
        src={LOGO_PATHS[variant].dark}
        alt={alt}
        width={computedWidth}
        height={computedHeight}
        priority={priority}
        className={cn(baseClass, "hidden dark:block")}
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
  const colorClass =
    darkMode === "dark"
      ? "text-white"
      : darkMode === "light"
      ? "text-[#064E3B]"
      : "text-[#064E3B] dark:text-white"

  return (
    <div
      className={cn(
        "inline-flex items-center shrink-0 group cursor-pointer",
        colorClass,
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
