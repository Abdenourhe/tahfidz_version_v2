// src/components/layout/TeacherSidebar.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, Star, CalendarCheck,
  ClipboardList, BookOpen, Bell, LogOut, ChevronRight, Megaphone
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"
import { useLanguage } from "@/contexts/LanguageContext"

interface TeacherSidebarProps {
  user: { name: string; email: string; role: string }
}

export function TeacherSidebar({ user }: TeacherSidebarProps) {
  const pathname = usePathname()
  const { locale, useT } = useLanguage()
  const tN = (k: string) => useT("nav", k)
  const tA = (k: string) => useT("auth", k)

  const navSections = [
    {
      section: locale === "ar" ? "الرئيسية" : locale === "en" ? "Main" : "Principal",
      items: [
        { label: tN("dashboard"),  href: "/teacher/dashboard",      icon: LayoutDashboard },
        { label: locale === "ar" ? "طلابي" : locale === "en" ? "My students" : "Mes élèves",   href: "/teacher/students",    icon: Users },
        { label: locale === "ar" ? "مجموعاتي" : locale === "en" ? "My groups" : "Mes groupes",  href: "/teacher/groups",      icon: BookOpen },
        { label: tN("notifications"),   href: "/teacher/notifications", icon: Bell },
        { label: locale === "ar" ? "ملفي الشخصي" : locale === "en" ? "My profile" : "Mon profil", href: "/teacher/profile", icon: Users },
      ],
    },
    {
      section: locale === "ar" ? "المتابعة" : locale === "en" ? "Tracking" : "Suivi",
      items: [
        { label: locale === "ar" ? "التقدم" : locale === "en" ? "Progress" : "Progression",      href: "/teacher/progress",    icon: Star },
        { label: tN("evaluations"),    href: "/teacher/evaluations", icon: ClipboardList },
        { label: tN("attendance"),     href: "/teacher/attendance",  icon: CalendarCheck },
        { label: locale === "ar" ? "الإعلانات" : locale === "en" ? "Announcements" : "Annonces", href: "/teacher/announcements", icon: Megaphone },
      ],
    },
  ]

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">TH</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">TAHFIDZ</p>
            <p className="text-xs text-gray-400">
              {locale === "ar" ? "المعلم" : locale === "en" ? "Teacher" : "Enseignant"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.section}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  item.href === "/teacher/notifications" ? (
                    <NotificationNavItem
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      isActive={isActive}
                      activeClass="bg-blue-50 text-blue-700 font-semibold"
                      inactiveClass="text-gray-600 hover:bg-gray-50"
                      iconActiveClass="text-blue-600"
                      iconInactiveClass="text-gray-400"
                    />
                  ) : (
                  <Link key={item.href} href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                      isActive ? "bg-blue-50 text-blue-700 font-semibold" : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <item.icon size={18} className={cn("shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && <ChevronRight size={14} className="text-blue-500" />}
                  </Link>
                  )
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">
              {user.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
