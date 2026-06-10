"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import {
  LayoutDashboard, Bell, UserCircle, CalendarDays, Video,
} from "lucide-react"

const MOBILE_NAV = [
  { href: "/parent/dashboard", icon: LayoutDashboard, key: "dashboard" },
  { href: "/parent/attendance", icon: CalendarDays, key: "attendance" },
  { href: "/parent/halaqa", icon: Video, key: "halaqa" },
  { href: "/parent/notifications", icon: Bell, key: "notifications" },
  { href: "/parent/profile", icon: UserCircle, key: "profile" },
]

export function ParentBottomNav() {
  const pathname = usePathname() ?? ""
  const t = useT("nav")

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="mx-4 mb-4 safe-area-pb">
        <div className="flex items-center justify-around h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-gray-200/50 dark:border-gray-800/50">
          {MOBILE_NAV.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center gap-0.5 w-full h-full tap-feedback"
              >
                {isActive && (
                  <motion.div
                    layoutId="parentBottomNavDot"
                    className="absolute -top-0.5 w-1.5 h-1.5 bg-tahfidz-green rounded-full"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <motion.div
                  animate={isActive ? { scale: 1.15, y: -2 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    className={isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"}
                  />
                </motion.div>
                <motion.span
                  animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.6, y: 0 }}
                  className={`text-[9px] font-semibold ${isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500"}`}
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
