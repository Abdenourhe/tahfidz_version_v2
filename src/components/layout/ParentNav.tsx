// src/components/layout/ParentNav.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import { LayoutDashboard, Link2, Bell, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { TopBarControls } from "@/components/layout/TopBarControls"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

interface ParentNavProps {
  user: { name: string; email: string }
  schoolName?: string
  schoolLogo?: string
}

export function ParentNav({ user, schoolName, schoolLogo }: ParentNavProps) {
  const pathname = usePathname()
  const { locale, useT } = useLanguage()
  const { data: session } = useSession()
  const tN = (k: string) => useT("nav", k)
  const tA = (k: string) => useT("auth", k)

  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug

  const navItems = [
    { label: tN("dashboard"),   href: "/parent/dashboard",      icon: LayoutDashboard },
    { label: locale === "ar" ? "ربط طفل" : locale === "en" ? "Link a child" : "Lier un enfant", href: "/parent/link", icon: Link2 },
    { label: tN("notifications"), href: "/parent/notifications", icon: Bell },
    { label: locale === "ar" ? "ملفي الشخصي" : locale === "en" ? "My profile" : "Mon profil",  href: "/parent/profile", icon: User },
  ]

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo + Nom école */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-tahfidz flex items-center justify-center overflow-hidden shadow-sm">
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

          {/* Nav centrale */}
          <nav className="flex items-center gap-0.5 bg-gray-100/60 dark:bg-gray-800/60 rounded-xl p-1">
            {navItems.map(item => {
              const isActive = pathname === item.href
              if (item.href === "/parent/notifications") {
                return (
                  <NotificationNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={isActive}
                    activeClass="bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                    inactiveClass="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    iconActiveClass="text-emerald-600 dark:text-emerald-400"
                    iconInactiveClass="text-gray-400"
                    className="rounded-lg"
                  />
                )
              }
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition",
                    isActive
                      ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  )}
                >
                  <item.icon size={15} className={cn(isActive ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400")} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Controls + Logout */}
          <div className="flex items-center gap-1">
            <TopBarControls />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              title={tA("logout")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
