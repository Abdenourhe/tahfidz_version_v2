// src/components/layout/SuperAdminSidebar.tsx
// Sidebar dédiée au portail SUPERADMIN

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard, Building2, Clock, Library, Send,
  Eye, MessageCircleQuestion, Activity, LogOut, Layers,
  FileText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SidebarToggle } from "@/components/layout/SidebarToggle"
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed"
import { useLanguage } from "@/contexts/LanguageContext"
import { Logo } from "@/components/ui/Logo"

interface SuperAdminSidebarProps {
  user: {
    name: string
    email: string
    role: string
    avatar?: string
  }
}

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  const pathname = usePathname() ?? ""
  const { useT: tFn } = useLanguage()
  const { collapsed } = useSidebarCollapsed()
  const tNav = (k: string) => tFn("nav", k)

  const navItems = [
    { label: tNav("superDashboard"), href: "/admin/super/dashboard", icon: LayoutDashboard },
    { label: tNav("schools"), href: "/admin/super/schools", icon: Building2 },
    { label: tNav("requests"), href: "/admin/super/requests", icon: Clock },
    { label: tNav("globalLibrary"), href: "/admin/super/library", icon: Library },
    { label: tNav("globalCategories"), href: "/admin/super/library/categories", icon: Layers },
    { label: tNav("broadcast"), href: "/admin/super/broadcast", icon: Send },
    { label: tNav("siteContent"), href: "/admin/super/site-config", icon: FileText },
    { label: tNav("audit"), href: "/admin/super/audit", icon: Eye },
    { label: tNav("feedbacks"), href: "/admin/super/feedbacks", icon: MessageCircleQuestion },
    { label: tNav("systemUpdates"), href: "/admin/super/school-updates", icon: Building2 },
    { label: tNav("health"), href: "/admin/super/health", icon: Activity },
  ]

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "??"

  return (
    <aside
      className={cn(
        "bg-white border-e border-gray-100 flex flex-col h-full shrink-0 shadow-sm transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo / Titre */}
      <div className="p-4 border-b border-gray-100">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between gap-2")}>
          <Link href="/admin/super/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-gray-100 overflow-hidden">
              <Logo variant="icon" size={36} priority />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm tracking-tight truncate">Superadmin</p>
                <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">Plateforme</p>
              </div>
            )}
          </Link>
          {!collapsed && <SidebarToggle />}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          // Détermine l'élément le plus spécifique correspondant au pathname
          const matchingItem = navItems
            .filter((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
            .sort((a, b) => b.href.length - a.href.length)[0]
          const isActive = matchingItem?.href === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm transition-all duration-150 group",
                collapsed ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5",
                isActive
                  ? "bg-red-50 text-red-700 font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center transition-colors flex-shrink-0",
                  collapsed ? "w-9 h-9 rounded-xl" : "w-7 h-7 rounded-lg",
                  isActive ? "bg-red-100" : "bg-gray-100 group-hover:bg-gray-200"
                )}
              >
                <item.icon
                  size={collapsed ? 18 : 16}
                  className={cn(
                    isActive ? "text-red-600" : "text-gray-500 group-hover:text-gray-700"
                  )}
                />
              </div>
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer : User + Logout */}
      <div className="p-3 border-t border-gray-100 space-y-2">
        <div
          className={cn(
            "flex items-center rounded-xl hover:bg-gray-50 transition group",
            collapsed ? "justify-center p-2" : "gap-2.5 px-3 py-2"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
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
