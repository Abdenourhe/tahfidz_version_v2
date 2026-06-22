// src/components/LogoText.tsx — Texte TAHFIDZ en SVG (A sans barre, style Lambda)
"use client"

import { cn } from "@/lib/utils"

interface LogoTextProps {
  width?: number
  height?: number
  className?: string
}

export function LogoText({
  width = 520,
  height = 100,
  className = "",
}: LogoTextProps) {
  return (
    <svg
      viewBox="0 0 520 100"
      width={width}
      height={height}
      className={cn("shrink-0 transition-colors duration-300", className)}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="currentColor" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round">
        {/* T — plus gras */}
        <path d="M 10 16 L 70 16 L 70 24 L 45 24 L 45 84 L 35 84 L 35 24 L 10 24 Z" />

        {/* A — Lambda sans barre, plus gras */}
        <path d="M 78 84 L 110 12 L 142 84 L 132 84 L 110 30 L 88 84 Z" />

        {/* H — plus gras */}
        <path d="M 152 16 L 162 16 L 162 44 L 198 44 L 198 16 L 208 16 L 208 84 L 198 84 L 198 52 L 162 52 L 162 84 L 152 84 Z" />

        {/* F — plus gras */}
        <path d="M 218 16 L 274 16 L 274 24 L 228 24 L 228 42 L 266 42 L 266 50 L 228 50 L 228 84 L 218 84 Z" />

        {/* I — plus gras */}
        <path d="M 288 16 L 298 16 L 298 84 L 288 84 Z" />

        {/* D — plus gras */}
        <path d="M 308 16 L 342 16 C 372 16 380 34 380 50 C 380 66 372 84 342 84 L 308 84 Z M 318 24 L 318 76 L 342 76 C 364 76 372 63 372 50 C 372 37 364 24 342 24 Z" />

        {/* Z — plus gras */}
        <path d="M 394 16 L 456 16 L 456 24 L 404 76 L 456 76 L 456 84 L 394 84 L 394 76 L 446 24 L 394 24 Z" />
      </g>
    </svg>
  )
}
