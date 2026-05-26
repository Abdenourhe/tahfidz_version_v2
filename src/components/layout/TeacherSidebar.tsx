// src/components/layout/TeacherSidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard, Users, GraduationCap, BookMarked,
  ClipboardCheck, Award, MessageSquare, Bell, UserCircle,
  ChevronRight, LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage, useT } from "@/contexts/LanguageContext"

import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

const NAV_ITEMS = [
  { href: "/teacher/dashboard",     icon: LayoutDashboard,  key: "dashboard" },
  { href: "/teacher/students",      icon: Users,            key: "students" },
  { href: "/teacher/groups",        icon: GraduationCap,    key: "groups" },
  { href: "/teacher/memorization",  icon: BookMarked,       key: "memorization" },
  { href: "/teacher/attendance",    icon: ClipboardCheck,   key: "attendance" },
  { href: "/teacher/evaluations",   icon: Award,            key: "evaluations" },
  { href: "/teacher/announcements", icon: MessageSquare,    key: "announcements" },
  { href: "/teacher/notifications", icon: Bell,             key: "notifications" },
  { href: "/teacher/profile",       icon: UserCircle,       key: "profile" },
]

interface TeacherSidebarProps {
  user: { name: string; email: string; role: string; avatar?: string }
}

export function TeacherSidebar({ user }: TeacherSidebarProps) {
  const pathname = usePathname()
  const { locale } = useLanguage()
  const { data: session } = useSession()
  const t = useT("teacherSidebar")
  const tA = useT("auth")

  const schoolName = session?.user?.schoolName || "TAHFIDZ"
  const schoolLogo = session?.user?.schoolLogo
  const schoolSlug = session?.user?.schoolSlug

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link href="/teacher/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tahfidz-green flex items-center justify-center overflow-hidden">
            {schoolLogo ? (
              <Image src={schoolLogo} alt={schoolName} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{schoolName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{schoolName}</p>
            {schoolSlug && (
              <p className="text-[10px] font-mono text-tahfidz-green dark:text-tahfidz-green">{schoolSlug}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("teacher")}</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const isNotification = item.href === "/teacher/notifications"

          if (isNotification) {
            return (
              <NotificationNavItem
                key={item.href}
                href={item.href}
                label={t(item.key)}
                isActive={isActive}
              />
            )
          }

          return (
            <Link key={item.href} href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive ? "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-semibold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <Icon size={18} className={cn("shrink-0", isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500")} />
              <span className="flex-1">{t(item.key)}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          )
        })}
      </nav>

      {/* Footer : User + Logout */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
          <div className="w-9 h-9 rounded-full gradient-tahfidz flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
