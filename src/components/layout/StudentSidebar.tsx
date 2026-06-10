// src/components/layout/StudentSidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard, BookOpen, Star, CalendarCheck, Bell, LogOut, ChevronRight, UserCircle, Video, BookMarked, MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/LanguageContext"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"

interface StudentSidebarProps {
  user: { name: string; email: string; avatar?: string }
  schoolName?: string
  schoolLogo?: string
}

export function StudentSidebar({ user, schoolName, schoolLogo }: StudentSidebarProps) {
  const pathname = usePathname()
  const { locale, useT } = useLanguage()
  const { data: session } = useSession()
  const tN = (k: string) => useT("nav", k)
  const tA = (k: string) => useT("auth", k)

  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug
  const studentCode = (session?.user as any)?.studentCode

  const initials = user.name
    ?.split(" ")
    .filter(Boolean)
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?"

  const navItems = [
    { label: tN("dashboard"),   href: "/student/dashboard",      icon: LayoutDashboard },
    { label: locale === "ar" ? "تقدمي" : locale === "en" ? "My progress" : "Ma progression", href: "/student/progress",  icon: BookOpen },
    { label: tN("halaqa"), href: "/student/halaqa", icon: Video },
    { label: locale === "ar" ? "شاراتي" : locale === "en" ? "My badges" : "Mes badges",     href: "/student/badges",    icon: Star },
    { label: locale === "ar" ? "حضوري" : locale === "en" ? "My attendance" : "Mes présences", href: "/student/attendance", icon: CalendarCheck },
    { label: tN("notifications"), href: "/student/notifications", icon: Bell },
    { label: tN("messages"), href: "/student/messages", icon: MessageSquare },
    { label: locale === "ar" ? "سجلي" : locale === "en" ? "My daily log" : "Carnet de suivi", href: "/student/daily-log", icon: BookMarked },
    { label: tN("profile"), href: "/student/profile", icon: UserCircle },
  ]

  return (
    <aside className="w-64 h-screen bg-white dark:bg-gray-900 border-e border-gray-200 dark:border-gray-800 flex flex-col fixed start-0 top-0 z-40">
      {/* Logo école */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <Link href="/student/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-tahfidz-green flex items-center justify-center overflow-hidden">
            {logo ? (
              <Image src={logo} alt={displayName} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-lg">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm">{displayName}</p>
            {schoolSlug && (
              <p className="text-[10px] font-mono text-tahfidz-green dark:text-tahfidz-green">{schoolSlug}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {locale === "ar" ? `طالب : ${user.name}` : locale === "en" ? `Student: ${user.name}` : `Élève : ${user.name}`}
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
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
                isActive ? "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-semibold" : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}
            >
              <item.icon size={18} className={cn("shrink-0", isActive ? "text-tahfidz-green" : "text-gray-400 dark:text-gray-500")} />
              <span className="flex-1">{item.label}</span>
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
              <span className="text-white font-bold text-sm">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
            <p className="text-xs text-gray-400 truncate">{user.email}</p>
            {studentCode && (
              <p className="text-[10px] font-mono text-tahfidz-green mt-0.5">{studentCode}</p>
            )}
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
