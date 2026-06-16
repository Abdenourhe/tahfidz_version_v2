// src/components/layout/ParentBottomNav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import { PARENT_NAV_ITEMS } from "@/lib/nav/parent-nav"
import { cn } from "@/lib/utils"

export function ParentBottomNav() {
  const pathname = usePathname() ?? ""
  const t = useT("nav")

  // On masque "Lier un enfant" du bottom nav pour garder 5 icônes max
  const mobileItems = PARENT_NAV_ITEMS.filter((item) => item.mobile !== false)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-3 mb-3 safe-area-pb">
        <div className="flex items-center justify-around h-[4.5rem] bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-[1.5rem] shadow-2xl shadow-black/10 dark:shadow-black/30 border border-gray-200/60 dark:border-gray-800/60">
          {mobileItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-1 w-full h-full tap-feedback"
              >
                <motion.div
                  animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className={cn(
                    "relative flex items-center justify-center w-11 h-11 rounded-2xl transition-colors",
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-900/30 shadow-md shadow-emerald-500/10"
                      : "bg-transparent"
                  )}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"}
                  />
                </motion.div>
                <motion.span
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
                  className={cn(
                    "text-[9px] font-bold transition-colors",
                    isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"
                  )}
                >
                  {t(item.key)}
                </motion.span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
