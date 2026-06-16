// src/components/layout/ParentNav.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { PARENT_NAV_ITEMS } from "@/lib/nav/parent-nav"
import { TopBarControls } from "@/components/layout/TopBarControls"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

interface ParentNavProps {
  user: { name: string; email: string }
  schoolName?: string
  schoolLogo?: string
}

export function ParentNav({ user: _user, schoolName, schoolLogo }: ParentNavProps) {
  const pathname = usePathname()
  const { useT: tFn } = useLanguage()
  const { data: session } = useSession()
  const tN = (k: string) => tFn("nav", k)
  const tA = (k: string) => tFn("auth", k)

  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nom école */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-tahfidz flex items-center justify-center overflow-hidden shadow-sm shadow-tahfidz-green/20">
              {logo ? (
                <Image src={logo} alt={displayName} width={36} height={36} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{displayName}</span>
              {schoolSlug && (
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">{schoolSlug}</span>
              )}
            </div>
          </div>

          {/* Nav centrale moderne */}
          <nav className="hidden md:flex items-center gap-1 bg-gray-100/60 dark:bg-gray-800/60 rounded-2xl p-1.5 border border-gray-200/50 dark:border-gray-700/50">
            {PARENT_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const label = tN(item.key)

              if (item.href === "/parent/notifications") {
                return (
                  <NotificationNavItem
                    key={item.href}
                    href={item.href}
                    label={label}
                    isActive={isActive}
                    activeClass="bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                    inactiveClass="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/30"
                    iconActiveClass="text-emerald-600 dark:text-emerald-400"
                    iconInactiveClass="text-gray-400"
                    className="rounded-xl"
                  />
                )
              }

              return (
                <Link key={item.href} href={item.href} title={label}>
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                      isActive
                        ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-md shadow-emerald-500/10"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-700/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-7 h-7 rounded-lg transition-colors",
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-900/30"
                          : "bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800"
                      )}
                    >
                      <Icon
                        size={17}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "transition-colors",
                          isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                        )}
                      />
                    </div>
                    <span className="hidden lg:inline">{label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Controls + Logout */}
          <div className="flex items-center gap-1">
            <TopBarControls />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title={tA("logout")}
            >
              <LogOut size={17} strokeWidth={2} />
            </motion.button>
          </div>
        </div>
      </div>
    </header>
  )
}
