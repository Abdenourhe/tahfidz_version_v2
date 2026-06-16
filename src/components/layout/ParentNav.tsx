// src/components/layout/ParentNav.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
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
  const [panelOpen, setPanelOpen] = useState(false)
  const { useT: tFn } = useLanguage()
  const { data: session } = useSession()
  const tN = (k: string) => tFn("nav", k)
  const tA = (k: string) => tFn("auth", k)

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ open: boolean }>).detail
      setPanelOpen(detail?.open ?? false)
    }
    window.addEventListener("parent:panel-change", handler)
    return () => window.removeEventListener("parent:panel-change", handler)
  }, [])

  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-3 md:px-6">
        <div className="grid grid-cols-3 items-center h-16 gap-2">
          {/* Logo + Nom école */}
          <div className="flex items-center gap-2.5 shrink-0 justify-self-start">
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

          {/* Nav centrale — une ligne d'icônes distinctes */}
          <nav className="hidden md:flex items-center gap-1 justify-self-center">
            {PARENT_NAV_ITEMS.map((item, index) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              const label = tN(item.key)

              if (item.href === "/parent/notifications") {
                return (
                  <div key={item.href} className="flex items-center">
                    {index > 0 && <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />}
                    <NotificationNavItem
                      href={item.href}
                      label={label}
                      isActive={isActive}
                      activeClass="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                      inactiveClass="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      iconActiveClass="text-emerald-600 dark:text-emerald-400"
                      iconInactiveClass="text-gray-400"
                      className="rounded-xl px-2.5 py-2"
                    />
                  </div>
                )
              }

              const isDashboard = item.href === "/parent/dashboard"

              return (
                <div key={item.href} className="flex items-center">
                  {index > 0 && <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />}
                  <Link
                    href={item.href}
                    title={label}
                    onClick={(e) => {
                      if (panelOpen && isDashboard) {
                        e.preventDefault()
                        window.dispatchEvent(new CustomEvent("parent:close-panel"))
                      }
                    }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                          : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon
                        size={18}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={cn(
                          "shrink-0 transition-colors",
                          isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400"
                        )}
                      />
                      <span className="hidden xl:inline whitespace-nowrap">{label}</span>
                    </motion.div>
                  </Link>
                </div>
              )
            })}
          </nav>

          {/* Controls + Logout */}
          <div className="flex items-center gap-1 shrink-0 justify-self-end">
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
