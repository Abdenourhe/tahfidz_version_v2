// src/components/ui/Select.tsx
// Sélecteur accessible avec label, erreur et support React Hook Form (forwardRef)

import React, { forwardRef } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "options"> {
  /** Label affiché au-dessus du champ */
  label?: string
  /** Message d'erreur */
  error?: string
  /** Options du sélecteur */
  options: SelectOption[]
  /** Texte par défaut (option vide) */
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, disabled, required, className, id, name, ...props }, ref) => {
    const selectId = id || name || props["aria-label"]?.toString().replace(/\s+/g, "-")

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            name={name}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={
              error ? `${selectId}-error` : undefined
            }
            className={cn(
              "w-full appearance-none rounded-lg border px-4 py-2.5 pr-10 text-sm transition-colors duration-200",
              "bg-white text-gray-900",
              "focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-tahfidz-green",
              "dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600",
              "dark:focus:ring-tahfidz-green-light dark:focus:border-tahfidz-green-light",
              error
                ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400"
                : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p id={`${selectId}-error`} className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = "Select"
