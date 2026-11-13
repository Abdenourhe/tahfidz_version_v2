// src/components/shared/SchoolLogo.tsx
// Présentation uniforme du logo école dans les portails (admin, enseignant, élève, parent).
// - Logo affiché sur un tile blanc arrondi avec padding (object-contain : jamais rogné).
//   Le fond blanc est conservé en mode sombre : lisible quel que soit le logo (standard Slack/Notion).
// - Sans logo : tile dégradé aux initiales de l'école (fallback personnalisé).

import Image from "next/image"
import { cn } from "@/lib/utils"

interface SchoolLogoProps {
  src?: string | null
  name: string
  size?: number
  className?: string
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  const letters = words.slice(0, 2).map((w) => w[0]).join("")
  return letters.toUpperCase() || "T"
}

export function SchoolLogo({ src, name, size = 40, className }: SchoolLogoProps) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden shrink-0 ring-1 ring-gray-900/5 dark:ring-white/10 shadow-sm",
        className
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <div className="w-full h-full bg-white flex items-center justify-center p-[10%]">
          <Image
            src={src}
            alt={`Logo ${name}`}
            width={size}
            height={size}
            className="w-full h-full object-contain"
            unoptimized
          />
        </div>
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-tahfidz-green to-emerald-700 flex items-center justify-center">
          <span className="font-bold text-white leading-none" style={{ fontSize: Math.round(size * 0.38) }}>
            {initials(name)}
          </span>
        </div>
      )}
    </div>
  )
}
