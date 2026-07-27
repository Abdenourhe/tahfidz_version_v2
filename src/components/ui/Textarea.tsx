// src/components/ui/Textarea.tsx
// Zone de texte multiligne avec label, erreur, hint et support React Hook Form (forwardRef)

import React, { forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Label affiché au-dessus du champ */
  label?: string
  /** Message d'erreur */
  error?: string
  /** Texte d'aide affiché sous le champ */
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, disabled, required, className, id, name, rows = 4, ...props }, ref) => {
    const textareaId = id || name || props["aria-label"]?.toString().replace(/\s+/g, "-")

    return (
      <div className={cn("w-full", className)}>
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {label}
            {required && <span className="ml-1 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          name={name}
          rows={rows}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined
          }
          className={cn(
            "w-full rounded-lg border px-4 py-2.5 text-sm transition-colors duration-200",
            "bg-white text-gray-900 placeholder-gray-400 resize-y",
            "focus:outline-none focus:ring-2 focus:ring-tahfidz-green focus:border-tahfidz-green",
            "dark:bg-gray-800 dark:text-gray-100 dark:placeholder-gray-500 dark:border-gray-600",
            "dark:focus:ring-tahfidz-green-light dark:focus:border-tahfidz-green-light",
            error
              ? "border-red-500 focus:ring-red-500 focus:border-red-500 dark:border-red-400 dark:focus:ring-red-400"
              : "border-gray-300",
            disabled && "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700"
          )}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="mt-1 text-xs text-red-500 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = "Textarea"
