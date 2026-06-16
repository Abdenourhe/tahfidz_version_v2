"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Menu, Bell, X, LogOut,
  LayoutDashboard, GraduationCap, Users, BookOpen, BookMarked,
  CalendarCheck, Award, MessageSquare, Megaphone, UserCircle,
  Link2, Video, Star, ClipboardList, BarChart3, ShieldCheck,
  Settings, UserCheck,
} from "lucide-react"
import { TopBarControls } from "./TopBarControls"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll"
import { useSession, signOut } from "next-auth/react"
import { useNotification } from "@/contexts/NotificationContext"

// ─── Role label mapping ─────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrateur",
  TEACHER: "Enseignant",
  STUDENT: "Élève",
  PARENT: "Parent",
  SUPERADMIN: "Super Admin",
}

// ─── Navigation config with optional icon colors ────────────────────────────
const ROLE_NAV: Record<string, { sectionKey?: string; items: { href: string; labelKey: string; icon: typeof LayoutDashboard; color?: string }[] }[]> = {
  admin: [
    {
      sectionKey: "main",
      items: [
        { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard, color: "text-emerald-600" },
        { href: "/admin/stats", labelKey: "statistics", icon: BarChart3, color: "text-blue-600" },
        { href: "/admin/announcements", labelKey: "announcements", icon: Megaphone, color: "text-amber-600" },
        { href: "/admin/notifications", labelKey: "notifications", icon: Bell, color: "text-purple-600" },
        { href: "/admin/profile", labelKey: "profile", icon: UserCircle, color: "text-gray-600" },
      ],
    },
    {
      sectionKey: "management",
      items: [
        { href: "/admin/students", labelKey: "students", icon: GraduationCap, color: "text-emerald-600" },
        { href: "/admin/teachers", labelKey: "teachers", icon: Users, color: "text-blue-600" },
        { href: "/admin/parents", labelKey: "parents", icon: UserCheck, color: "text-orange-600" },
        { href: "/admin/admins", labelKey: "admins", icon: ShieldCheck, color: "text-red-600" },
        { href: "/admin/groups", labelKey: "groups", icon: BookOpen, color: "text-indigo-600" },
        { href: "/admin/attendance", labelKey: "attendance", icon: CalendarCheck, color: "text-teal-600" },
        { href: "/admin/halaqa", labelKey: "halaqa", icon: Video, color: "text-red-600" },
      ],
    },
    {
      sectionKey: "system",
      items: [
        { href: "/admin/settings", labelKey: "settings", icon: Settings, color: "text-gray-600" },
      ],
    },
  ],
  teacher: [
    {
      items: [
        { href: "/teacher/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
        { href: "/teacher/students", labelKey: "myStudents", icon: Users },
        { href: "/teacher/groups", labelKey: "groups", icon: BookOpen },
        { href: "/teacher/memorization", labelKey: "memorization", icon: BookMarked },
        { href: "/teacher/attendance", labelKey: "attendance", icon: CalendarCheck },
        { href: "/teacher/evaluations", labelKey: "evaluations", icon: Award },
        { href: "/teacher/halaqa", labelKey: "halaqa", icon: Video },
        { href: "/teacher/messages", labelKey: "messaging", icon: MessageSquare },
        { href: "/teacher/announcements", labelKey: "announcements", icon: Megaphone },
        { href: "/teacher/notifications", labelKey: "notifications", icon: Bell },
        { href: "/teacher/profile", labelKey: "profile", icon: UserCircle },
      ],
    },
  ],
  student: [
    {
      items: [
        { href: "/student/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
        { href: "/student/progress", labelKey: "progress", icon: BookOpen },
        { href: "/student/halaqa", labelKey: "halaqa", icon: Video },
        { href: "/student/badges", labelKey: "badges", icon: Star },
        { href: "/student/attendance", labelKey: "attendance", icon: CalendarCheck },
        { href: "/student/notifications", labelKey: "notifications", icon: Bell },
        { href: "/student/daily-log", labelKey: "dailyLog", icon: ClipboardList },
        { href: "/student/profile", labelKey: "profile", icon: UserCircle },
      ],
    },
  ],
  parent: [
    {
      items: [
        { href: "/parent/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
        { href: "/parent/link", labelKey: "linkChild", icon: Link2 },
        { href: "/parent/attendance", labelKey: "attendance", icon: CalendarCheck },
        { href: "/parent/halaqa", labelKey: "halaqa", icon: Video },
        { href: "/parent/notifications", labelKey: "notifications", icon: Bell },
        { href: "/parent/profile", labelKey: "profile", icon: UserCircle },
      ],
    },
  ],
  superadmin: [
    {
      items: [
        { href: "/admin/super", labelKey: "dashboard", icon: LayoutDashboard },
        { href: "/superadmin/profile", labelKey: "profile", icon: UserCircle },
      ],
    },
  ],
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 350, damping: 28 } },
}

export function MobileHeader({
  role,
  schoolName,
  schoolLogo,
}: {
  role: "admin" | "teacher" | "student" | "parent" | "superadmin"
  schoolName?: string
  schoolLogo?: string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname() ?? ""
  const t = useT("nav")
  const { data: session } = useSession()

  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug
  const navSections = ROLE_NAV[role] ?? []

  // ── Avatar + user info from API ───────────────────────────────────────────
  const [userInfo, setUserInfo] = useState<{ avatar?: string | null; fullName?: string; role?: string } | null>(null)

  useEffect(() => {
    fetch("/api/user/me")
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setUserInfo(d.user))
      .catch(() => {})
  }, [])

  // ── Notification badge (from global context) ──────────────────────────────
  const { unreadCount } = useNotification()

  // ── Scroll to active link when drawer opens ───────────────────────────────
  const drawerRef = useRef<HTMLDivElement>(null)
  const activeLinkRef = useRef<HTMLAnchorElement>(null)

  useEffect(() => {
    if (menuOpen && activeLinkRef.current && drawerRef.current) {
      setTimeout(() => {
        activeLinkRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 250)
    }
  }, [menuOpen])

  const userDisplayName = userInfo?.fullName || session?.user?.name || "Utilisateur"
  const userEmail = session?.user?.email || ""
  const userRoleLabel = ROLE_LABELS[userInfo?.role || session?.user?.role || ""] || userInfo?.role || ""

  useLockBodyScroll(menuOpen)

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 safe-area-pt">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors active:scale-95 tap-feedback"
            aria-label="Menu"
          >
            <AnimatePresence mode="wait">
              {menuOpen ? (
                <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X size={22} className="text-gray-700 dark:text-gray-300" />
                </motion.div>
              ) : (
                <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu size={22} className="text-gray-700 dark:text-gray-300" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-tahfidz-green flex items-center justify-center overflow-hidden">
              {logo ? (
                <Image src={logo} alt={displayName} width={32} height={32} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">{displayName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-gray-900 dark:text-white text-sm">{displayName}</span>
              {schoolSlug && <span className="text-[10px] font-mono text-tahfidz-green text-center">{schoolSlug}</span>}
            </div>
          </div>

          <Link href={`/${role}/notifications`} className="p-2 -mr-2 relative active:scale-95 tap-feedback">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[14px] h-[14px] px-0.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Bottom sheet menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setMenuOpen(false)}
            />

            <div className="fixed inset-0 z-[60] flex items-center justify-start pointer-events-none">
              <motion.div
                ref={drawerRef}
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="pointer-events-auto w-72 max-w-[80vw] max-h-[85vh] h-auto bg-white dark:bg-gray-900 rounded-r-3xl shadow-2xl flex flex-col overflow-hidden"
                data-mobile-role={role}
              >

                {/* User section */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-tahfidz-green flex items-center justify-center overflow-hidden flex-shrink-0">
                      {userInfo?.avatar ? (
                        <img src={userInfo.avatar} alt={userDisplayName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-lg">{userDisplayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{userDisplayName}</p>
                      <p className="text-[11px] text-gray-400 truncate">{userEmail}</p>
                      {userRoleLabel && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-tahfidz-green-light dark:bg-emerald-900/30 text-tahfidz-green font-bold uppercase tracking-wider">
                          {userRoleLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Navigation links */}
                {navSections.length > 0 && (
                  <div className="flex-1 overflow-y-auto py-2">
                    {navSections.map((section, si) => (
                      <div key={si} className="px-3 mb-2">
                        {section.sectionKey && (
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1 mt-2">
                            {t(section.sectionKey) || section.sectionKey}
                          </p>
                        )}
                        <motion.nav
                          variants={containerVariants}
                          initial="hidden"
                          animate="show"
                          className="flex flex-col items-center gap-2"
                        >
                          {section.items.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                            const Icon = item.icon
                            const isNotification = item.href.endsWith("/notifications")
                            return (
                              <motion.div key={item.href} variants={itemVariants} className="w-full max-w-[280px]">
                                <Link
                                  ref={isActive ? activeLinkRef : undefined}
                                  href={item.href}
                                  onClick={() => setMenuOpen(false)}
                                  className={cn(
                                    "flex items-center justify-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-medium transition",
                                    isActive
                                      ? "bg-tahfidz-green-light text-tahfidz-green shadow-sm"
                                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800"
                                  )}
                                >
                                  <div className="relative">
                                    <Icon
                                      size={24}
                                      strokeWidth={isActive ? 2.5 : 1.5}
                                      className={cn(
                                        isActive ? (item.color || "text-tahfidz-green") : (item.color || "text-gray-400 dark:text-gray-500")
                                      )}
                                    />
                                    {isNotification && unreadCount > 0 && (
                                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-0.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                                        {unreadCount > 99 ? "99+" : unreadCount}
                                      </span>
                                    )}
                                  </div>
                                  <span className="flex-1 text-center">{t(item.labelKey) || item.labelKey}</span>
                                </Link>
                              </motion.div>
                            )
                          })}
                        </motion.nav>
                      </div>
                    ))}
                  </div>
                )}

                {/* Controls */}
                <div className="px-5 py-3 border-t border-b border-gray-100 dark:border-gray-800">
                  <TopBarControls dropdownAlign="left" />
                </div>

                {/* Logout */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                  >
                    <LogOut size={16} />
                    <span>{t("logout") || "Déconnexion"}</span>
                  </motion.button>
                  <p className="text-[10px] text-gray-300 text-center mt-2">{displayName}</p>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
