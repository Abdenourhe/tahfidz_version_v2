"use client"
// src/components/layout/ParentNav.tsx

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Link2, Bell, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { TopBarControls } from "@/components/layout/TopBarControls"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

interface ParentNavProps {
  user: { name: string; email: string }
}

export function ParentNav({ user }: ParentNavProps) {
  const pathname = usePathname()
  const { locale, useT } = useLanguage()
  const tN = (k: string) => useT("nav", k)
  const tA = (k: string) => useT("auth", k)

  const navItems = [
    { label: tN("dashboard"),   href: "/parent/dashboard",      icon: LayoutDashboard },
    { label: locale === "ar" ? "ربط طفل" : locale === "en" ? "Link a child" : "Lier un enfant", href: "/parent/link", icon: Link2 },
    { label: tN("notifications"), href: "/parent/notifications", icon: Bell },
    { label: locale === "ar" ? "ملفي الشخصي" : locale === "en" ? "My profile" : "Mon profil",  href: "/parent/profile", icon: User },
  ]

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-0">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-tahfidz flex items-center justify-center">
              <span className="text-white font-bold text-xs">TH</span>
            </div>
            <span className="font-bold text-gray-900 hidden sm:block">TAHFIDZ</span>
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
              {locale === "ar" ? "ولي الأمر" : locale === "en" ? "Parent" : "Parent"}
            </span>
          </div>

          {/* Nav */}
          <nav className="flex items-center gap-1">
            {navItems.map(item => {
              const isActive = pathname === item.href
              if (item.href === "/parent/notifications") {
                return (
                  <NotificationNavItem
                    key={item.href}
                    href={item.href}
                    label={item.label}
                    isActive={isActive}
                    activeClass="bg-tahfidz-green-light text-tahfidz-green font-semibold"
                    inactiveClass="text-gray-600 hover:bg-gray-50"
                    iconActiveClass="text-tahfidz-green"
                    iconInactiveClass="text-gray-400"
                  />
                )
              }
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition",
                    isActive ? "bg-tahfidz-green-light text-tahfidz-green font-semibold" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <item.icon size={16} className={isActive ? "text-tahfidz-green" : "text-gray-400"} />
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Controls + logout */}
          <div className="flex items-center gap-2">
            <TopBarControls />
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
              title={tA("logout")}
            >
              <LogOut size={16} />
              <span className="hidden md:inline">{tA("logout")}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
