"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import {
  LayoutDashboard, BookOpen, Star, CalendarCheck, UserCircle,
} from "lucide-react"

const MOBILE_NAV = [
  { href: "/student/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/student/progress", icon: BookOpen, key: "progress" },
  { href: "/student/badges", icon: Star, key: "badges" },
  { href: "/student/attendance", icon: CalendarCheck, key: "attendance" },
  { href: "/student/profile", icon: UserCircle, key: "profile" },
]

export function StudentBottomNav() {
  const pathname = usePathname()
  const t = useT("nav")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-800/50 safe-area-pb md:hidden">
      <div className="flex items-center justify-around h-16 relative">
        {MOBILE_NAV.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center gap-1 w-full h-full tap-feedback"
            >
              {isActive && (
                <motion.div
                  layoutId="studentBottomNavIndicator"
                  className="absolute -top-0.5 w-8 h-1 bg-tahfidz-green rounded-full"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              <motion.div
                animate={isActive ? { scale: 1.1, y: -2 } : { scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"}
                />
              </motion.div>

              <motion.span
                animate={isActive ? { opacity: 1 } : { opacity: 0.7 }}
                className={`text-[10px] font-medium ${isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"}`}
              >
                {t(item.key)}
              </motion.span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
