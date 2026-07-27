// src/components/ui/Alert.tsx
// Alerte contextuelle avec icône, titre et bouton de fermeture

import React from "react"
import { cn } from "@/lib/utils"
import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react"

export interface AlertProps {
  /** Variant de l'alerte */
  variant?: "info" | "success" | "warning" | "error"
  /** Titre de l'alerte */
  title?: string
  /** Contenu de l'alerte */
  children: React.ReactNode
  /** Callback de fermeture (affiche une croix) */
  onClose?: () => void
  /** Classes CSS additionnelles */
  className?: string
}

const variantConfig = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
    icon: Info,
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    icon: CheckCircle,
    iconColor: "text-green-500 dark:text-green-400",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    icon: AlertCircle,
    iconColor: "text-yellow-500 dark:text-yellow-400",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    icon: XCircle,
    iconColor: "text-red-500 dark:text-red-400",
  },
}

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className,
}: AlertProps) {
  const config = variantConfig[variant]
  const Icon = config.icon

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 rounded-lg border p-4",
        config.container,
        className
      )}
    >
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.iconColor)} aria-hidden="true" />
      <div className="flex-1">
        {title && (
          <h4 className="mb-1 text-sm font-semibold">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 rounded p-0.5 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
          aria-label="Fermer l'alerte"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
