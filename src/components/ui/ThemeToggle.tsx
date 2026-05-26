"use client"
import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

interface ThemeToggleProps {
  showLabel?: boolean
  className?: string
}

export function ThemeToggle({ showLabel = false, className = "" }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${className}`}
      aria-label={mounted ? (isDark ? "Mode clair" : "Mode sombre") : "Toggle theme"}
      title={mounted ? (isDark ? "Mode clair" : "Mode sombre") : "Toggle theme"}
    >
      {mounted ? (
        isDark ? <Sun size={18} /> : <Moon size={18} />
      ) : (
        <div className="w-[18px] h-[18px]" />
      )}
      {showLabel && (
        <span>{mounted ? (isDark ? "Mode clair" : "Mode sombre") : "..."}</span>
      )}
    </button>
  )
}
