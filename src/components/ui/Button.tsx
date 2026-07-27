// src/components/ui/Button.tsx
// Bouton réutilisable avec variants, tailles, état de chargement et support icônes

import React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Variant visuel du bouton */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger"
  /** Taille du bouton */
  size?: "sm" | "md" | "lg"
  /** Affiche un spinner de chargement */
  isLoading?: boolean
  /** Icône à gauche du texte */
  iconLeft?: React.ReactNode
  /** Icône à droite du texte */
  iconRight?: React.ReactNode
}

const variantStyles = {
  primary:
    "bg-tahfidz-green text-white hover:bg-tahfidz-green-light focus:ring-tahfidz-green " +
    "dark:bg-tahfidz-green dark:hover:bg-tahfidz-green-light",
  secondary:
    "bg-tahfidz-gold text-white hover:bg-yellow-600 focus:ring-tahfidz-gold " +
    "dark:bg-tahfidz-gold dark:hover:bg-yellow-600",
  outline:
    "border-2 border-tahfidz-green text-tahfidz-green hover:bg-tahfidz-green hover:text-white " +
    "focus:ring-tahfidz-green dark:border-tahfidz-green-light dark:text-tahfidz-green-light " +
    "dark:hover:bg-tahfidz-green dark:hover:text-white",
  ghost:
    "text-tahfidz-green hover:bg-tahfidz-green/10 focus:ring-tahfidz-green " +
    "dark:text-tahfidz-green-light dark:hover:bg-tahfidz-green/20",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 " +
    "dark:bg-red-700 dark:hover:bg-red-600",
}

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2 text-base rounded-lg gap-2",
  lg: "px-6 py-3 text-lg rounded-xl gap-2.5",
}

export function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  iconLeft,
  iconRight,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors duration-200",
        "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {!isLoading && iconLeft}
      {children}
      {!isLoading && iconRight}
    </button>
  )
}
