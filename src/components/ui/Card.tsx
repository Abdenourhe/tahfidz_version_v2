// src/components/ui/Card.tsx
// Carte conteneur avec header optionnel, contenu et footer

import React from "react"
import { cn } from "@/lib/utils"

export interface CardProps {
  /** Contenu de la carte */
  children: React.ReactNode
  /** Titre affiché dans l'en-tête */
  title?: React.ReactNode
  /** Sous-titre affiché sous le titre */
  subtitle?: React.ReactNode
  /** Pied de page de la carte */
  footer?: React.ReactNode
  /** Classes CSS additionnelles */
  className?: string
  /** Callback au clic sur la carte entière */
  onClick?: () => void
  /** Active un effet au survol */
  hoverable?: boolean
}

export function Card({
  children,
  title,
  subtitle,
  footer,
  className,
  onClick,
  hoverable = false,
}: CardProps) {
  const hasHeader = title || subtitle

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        "dark:border-gray-700 dark:bg-gray-800",
        hoverable && "transition-shadow duration-200 hover:shadow-md cursor-pointer",
        onClick && "focus:outline-none focus:ring-2 focus:ring-tahfidz-green",
        className
      )}
    >
      {hasHeader && (
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          {title && (
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
      {footer && (
        <div className="border-t border-gray-200 px-5 py-3 dark:border-gray-700">{footer}</div>
      )}
    </div>
  )
}
