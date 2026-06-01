// src/components/layout/AdminSidebar.tsx
"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Users, GraduationCap, BookOpen,
  CalendarCheck, Megaphone, BarChart2, Settings, LogOut,
  Bell, Shield, Monitor, Home, Award, Video,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NotificationNavItem } from "@/components/layout/NotificationNavItem"
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
  const { useT, locale } = useLanguage()
  const tNav  = (k: string) => useT("nav", k)
  const tAuth = (k: string) => useT("auth", k)

  // Navigation traduite — recalculée à chaque changement de locale
  const navSections = [
    {
      section: locale === "ar" ? "الرئيسية" : locale === "en" ? "Main" : "Principal",
      items: [
        { labelKey: "dashboard",  href: "/admin/dashboard",     icon: LayoutDashboard, color: "text-emerald-600" },
        { labelKey: "statistics", href: "/admin/stats",         icon: BarChart2,       color: "text-blue-600",
          labelFallback: locale === "ar" ? "الإحصائيات" : locale === "en" ? "Statistics" : "Statistiques" },
        { labelKey: "announcements", href: "/admin/announcements", icon: Megaphone,    color: "text-amber-600",
          labelFallback: locale === "ar" ? "الإعلانات" : locale === "en" ? "Announcements" : "Annonces" },
        { labelKey: "notifications", href: "/admin/notifications", icon: Bell,         color: "text-purple-600",
          labelFallback: locale === "ar" ? "الإشعارات" : locale === "en" ? "Notifications" : "Notifications" },
        { labelKey: "profile", href: "/admin/profile", icon: Users, color: "text-gray-600",
          labelFallback: locale === "ar" ? "ملفي" : locale === "en" ? "My Profile" : "Mon profil" },
      ],
    },
    {
      section: tNav("management"),
      items: [
        { labelKey: "students",   href: "/admin/students",      icon: GraduationCap,   color: "text-emerald-600" },
        { labelKey: "teachers",   href: "/admin/teachers",      icon: Users,           color: "text-blue-600" },
        { labelKey: "parents",    href: "/admin/parents",       icon: Users,           color: "text-orange-600" },
        { labelKey: "admins",     href: "/admin/admins",        icon: Shield,          color: "text-red-600",
          labelFallback: locale === "ar" ? "المديرون" : locale === "en" ? "Administrators" : "Administrateurs" },
        { labelKey: "groups",     href: "/admin/groups",        icon: BookOpen,        color: "text-indigo-600" },
        { labelKey: "attendance", href: "/admin/attendance",    icon: CalendarCheck,   color: "text-teal-600" },
        { labelKey: "maqra",      href: "/admin/maqra",         icon: Video,           color: "text-red-600",
          labelFallback: locale === "ar" ? "مقريء" : locale === "en" ? "Maqra'" : "Maqra'" },
      ],
    },
    {
      section: tNav("system"),
      items: [
        { labelKey: "certificates", href: "/admin/certificate-templates", icon: Award, color: "text-emerald-600" },
        { labelKey: "settings",     href: "/admin/settings",              icon: Settings, color: "text-gray-600" },
        { labelKey: "tvMode",       href: "/display",                     icon: Monitor,  color: "text-gray-600",
          labelFallback: locale === "ar" ? "عرض التلفاز" : locale === "en" ? "TV Display" : "Affichage TV" },
      ],
    },
  ]

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??"

  const displayName = schoolName ?? "TAHFIDZ"
  const firstLetter = displayName.charAt(0).toUpperCase()

  const getLabelForKey = (key: string, fallback?: string): string => {
    const translated = tNav(key)
    // Si la traduction retourne juste la clé (non trouvée), utiliser le fallback
    if (translated === key && fallback) return fallback
    return translated
  }

  return (
    <aside className="w-64 bg-white border-r border-gray-100 flex flex-col h-full shrink-0 shadow-sm">

      {/* Logo école */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/admin/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-md shadow-emerald-100 group-hover:shadow-lg transition-shadow">
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
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.section}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 px-3">
              {section.section}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/admin/dashboard" && pathname.startsWith(item.href + "/"))
                const label = getLabelForKey(item.labelKey, (item as { labelFallback?: string }).labelFallback)
                if (item.href === "/admin/notifications") {
                  return (
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
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 font-semibold shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div
                      className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors flex-shrink-0",
                     
                        isActive ? "bg-emerald-100" : "bg-gray-100 group-hover:bg-gray-200"
                      )}
                    >
                      <item.icon
                        size={16}
                        className={cn(
                          isActive ? item.color : "text-gray-500 group-hover:text-gray-700"
                        )}
                      />
                    </div>
                    <span className="flex-1 truncate">{label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer : Dark mode + User */}
      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-800 space-y-2">

        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xs">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-800 truncate">{user.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{user.role}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition opacity-0 group-hover:opacity-100"
            title={tAuth("logout")}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
