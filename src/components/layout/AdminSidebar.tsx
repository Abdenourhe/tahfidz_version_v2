// src/components/layout/AdminSidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  CalendarCheck, Megaphone, BarChart2, Settings, LogOut,
  Bell, Shield, Monitor, Award, Video, Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"
import { SidebarToggle } from "@/components/layout/SidebarToggle"
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed"
import { useLanguage } from "@/contexts/LanguageContext"

interface AdminSidebarProps {
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
  schoolName?: string
  schoolLogo?: string
  schoolSlug?: string
  schoolCity?: string
}

export function AdminSidebar({ user, schoolName, schoolLogo, schoolSlug, schoolCity }: AdminSidebarProps) {
  const pathname = usePathname() ?? ""
  const { useT: tFn, locale } = useLanguage()
  const { collapsed } = useSidebarCollapsed()
  const tNav = (k: string) => tFn("nav", k)

  const navSections = [
    {
      section: locale === "ar" ? "الرئيسية" : locale === "en" ? "Main" : "Principal",
      items: [
        { labelKey: "dashboard",  href: "/admin/dashboard",     icon: LayoutDashboard, color: "text-emerald-600" },
        { labelKey: "statistics", href: "/admin/stats",         icon: BarChart2,       color: "text-blue-600" },
        { labelKey: "announcements", href: "/admin/announcements", icon: Megaphone,    color: "text-amber-600" },
        { labelKey: "notifications", href: "/admin/notifications", icon: Bell,         color: "text-purple-600" },
        { labelKey: "profile", href: "/admin/profile", icon: Users, color: "text-gray-600" },
      ],
    },
    {
      section: tNav("management"),
      items: [
        { labelKey: "students",   href: "/admin/students",      icon: GraduationCap,   color: "text-emerald-600" },
        { labelKey: "teachers",   href: "/admin/teachers",      icon: Users,           color: "text-blue-600" },
        { labelKey: "parents",    href: "/admin/parents",       icon: Users,           color: "text-orange-600" },
        { labelKey: "admins",     href: "/admin/admins",        icon: Shield,          color: "text-red-600" },
        { labelKey: "groups",     href: "/admin/groups",        icon: BookOpen,        color: "text-indigo-600" },
        { labelKey: "attendance", href: "/admin/attendance",    icon: CalendarCheck,   color: "text-teal-600" },
        { labelKey: "halaqa",      href: "/admin/halaqa",         icon: Video,           color: "text-red-600" },
      ],
    },
    {
      section: tNav("system"),
      items: [
        { labelKey: "certificates", href: "/admin/certificate-templates", icon: Award, color: "text-emerald-600" },
        { labelKey: "settings",     href: "/admin/settings",              icon: Settings, color: "text-gray-600" },
        { labelKey: "tvMode",       href: "/display",                     icon: Monitor,  color: "text-gray-600" },
      ],
    },
    ...(user.role === "SUPERADMIN" ? [{
      section: "Superadmin",
      items: [
        { labelKey: "superDashboard", href: "/admin/super", icon: Shield, color: "text-red-600" },
        { labelKey: "schoolUpdates",  href: "/admin/super/school-updates", icon: Building2, color: "text-orange-500" },
      ],
    }] : []),
  ]

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??"

  const displayName = schoolName ?? "TAHFIDZ"
  const firstLetter = displayName.charAt(0).toUpperCase()

  const getLabel = (key: string) => tNav(key)

  return (
    <aside
      className={cn(
        "bg-white border-e border-gray-100 flex flex-col h-full shrink-0 shadow-sm transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo école */}
      <div className="p-4 border-b border-gray-100">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
          <Link href="/admin/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-emerald-100">
              {schoolLogo ? (
                <Image
                  src={schoolLogo}
                  alt={`Logo ${displayName}`}
                  width={40}
                  height={40}
                  className="w-full h-full object-contain bg-white p-0.5"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center">
                  <span className="text-white font-bold text-base">{firstLetter}</span>
                </div>
              )}
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm tracking-tight truncate">{displayName}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  {schoolSlug && <span className="font-mono text-tahfidz-green">{schoolSlug}</span>}
                  {schoolSlug && schoolCity && <span className="mx-1 text-gray-300">·</span>}
                  {schoolCity && <span>{schoolCity}</span>}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">
                  {locale === "ar" ? "الإدارة" : locale === "en" ? "Administration" : "Administration"}
                </p>
              </div>
            )}
          </Link>
          {!collapsed && <SidebarToggle />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-4">
        {navSections.map((section) => (
          <div key={section.section}>
            {!collapsed && (
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-3">
                {section.section}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"))
                const label = getLabel(item.labelKey)

                if (item.href === "/admin/notifications") {
                  return collapsed ? (
                    <NotificationNavItem
                      key={item.href}
                      href={item.href}
                      label={label}
                      isActive={isActive}
                      collapsed
                      activeClass="bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                      inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      iconActiveClass={item.color}
                      iconInactiveClass="text-gray-500 group-hover:text-gray-700"
                      iconContainerClass={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                        isActive ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-gray-200"
                      )}
                    />
                  ) : (
                    <NotificationNavItem
                      key={item.href}
                      href={item.href}
                      label={label}
                      isActive={isActive}
                      activeClass="bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                      inactiveClass="text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      iconActiveClass={item.color}
                      iconInactiveClass="text-gray-500 group-hover:text-gray-700"
                      iconContainerClass={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                        isActive ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-gray-200"
                      )}
                    />
                  )
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center rounded-xl text-sm transition-all duration-150 group",
                      collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center transition-colors flex-shrink-0",
                        collapsed ? "w-9 h-9 rounded-xl" : "w-7 h-7 rounded-lg",
                        isActive ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-gray-200"
                      )}
                    >
                      <item.icon
                        size={collapsed ? 18 : 16}
                        className={cn(
                          isActive ? item.color : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                    </div>
                    {!collapsed && <span className="flex-1 truncate">{label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer : User + Logout */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
        <div
          className={cn(
            "flex items-center rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group",
            collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">{initials}</span>
            )}
          </div>
          {!collapsed && (
            <>
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
            </>
          )}
        </div>
        {collapsed && (
          <div className="flex justify-center">
            <SidebarToggle />
          </div>
        )}
      </div>
    </aside>
  )
}
