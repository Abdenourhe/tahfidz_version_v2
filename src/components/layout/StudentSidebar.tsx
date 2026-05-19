// src/components/layout/StudentSidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, BookOpen, Star, CalendarCheck, Bell, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

interface StudentSidebarProps {
  user: { name: string; email: string }
}

export function StudentSidebar({ user }: StudentSidebarProps) {
  const pathname = usePathname()
  const { locale, useT } = useLanguage()
  const tN = (k: string) => useT("nav", k)
  const tA = (k: string) => useT("auth", k)

  const navItems = [
    { label: tN("dashboard"),   href: "/student/dashboard",      icon: LayoutDashboard },
    { label: locale === "ar" ? "تقدمي" : locale === "en" ? "My progress" : "Ma progression", href: "/student/progress",  icon: BookOpen },
    { label: locale === "ar" ? "شاراتي" : locale === "en" ? "My badges" : "Mes badges",     href: "/student/badges",    icon: Star },
    { label: locale === "ar" ? "حضوري" : locale === "en" ? "My attendance" : "Mes présences", href: "/student/attendance", icon: CalendarCheck },
    { label: tN("notifications"), href: "/student/notifications", icon: Bell },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-tahfidz flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">TAHFIDZ</p>
            <p className="text-xs text-gray-400">
              {locale === "ar" ? "فضاء الطالب" : locale === "en" ? "Student area" : "Espace élève"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          if (item.href === "/student/notifications") {
            return (
              <NotificationNavItem
                key={item.href}
                href={item.href}
                label={item.label}
                isActive={isActive}
              />
            )
          }
          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive ? "bg-tahfidz-green-light text-tahfidz-green font-semibold" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", isActive ? "text-tahfidz-green" : "text-gray-400")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
          <div className="w-9 h-9 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-800 text-sm truncate max-w-[120px]">{user.name}</p>
            <p className="text-xs text-gray-400 truncate max-w-[120px]">{user.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition"
        >
          <LogOut size={14} />
          <span>{tA("logout")}</span>
        </button>
      </div>
    </aside>
  )
}
