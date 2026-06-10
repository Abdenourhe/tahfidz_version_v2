"use client"

import { useState } from "react"
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
import { useSession, signOut } from "next-auth/react"

const ROLE_NAV: Record<string, { href: string; labelKey: string; icon: typeof LayoutDashboard }[]> = {
  admin: [
    { href: "/admin/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/admin/stats", labelKey: "statistics", icon: BarChart3 },
    { href: "/admin/students", labelKey: "students", icon: GraduationCap },
    { href: "/admin/teachers", labelKey: "teachers", icon: Users },
    { href: "/admin/parents", labelKey: "parents", icon: UserCheck },
    { href: "/admin/admins", labelKey: "admins", icon: ShieldCheck },
    { href: "/admin/groups", labelKey: "groups", icon: BookOpen },
    { href: "/admin/attendance", labelKey: "attendance", icon: CalendarCheck },
    { href: "/admin/halaqa", labelKey: "halaqa", icon: Video },
    { href: "/admin/announcements", labelKey: "announcements", icon: Megaphone },
    { href: "/admin/notifications", labelKey: "notifications", icon: Bell },
    { href: "/admin/settings", labelKey: "settings", icon: Settings },
    { href: "/admin/profile", labelKey: "profile", icon: UserCircle },
  ],
  teacher: [
    { href: "/teacher/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/teacher/students", labelKey: "students", icon: Users },
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
  student: [
    { href: "/student/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/student/progress", labelKey: "progress", icon: BookOpen },
    { href: "/student/halaqa", labelKey: "halaqa", icon: Video },
    { href: "/student/badges", labelKey: "badges", icon: Star },
    { href: "/student/attendance", labelKey: "attendance", icon: CalendarCheck },
    { href: "/student/notifications", labelKey: "notifications", icon: Bell },
    { href: "/student/daily-log", labelKey: "dailyLog", icon: ClipboardList },
    { href: "/student/profile", labelKey: "profile", icon: UserCircle },
  ],
  parent: [
    { href: "/parent/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/parent/link", labelKey: "linkChild", icon: Link2 },
    { href: "/parent/attendance", labelKey: "attendance", icon: CalendarCheck },
    { href: "/parent/halaqa", labelKey: "halaqa", icon: Video },
    { href: "/parent/notifications", labelKey: "notifications", icon: Bell },
    { href: "/parent/profile", labelKey: "profile", icon: UserCircle },
  ],
  superadmin: [
    { href: "/admin/super", labelKey: "dashboard", icon: LayoutDashboard },
    { href: "/superadmin/profile", labelKey: "profile", icon: UserCircle },
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
  const navItems = ROLE_NAV[role] ?? []

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
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X size={22} className="text-gray-700 dark:text-gray-300" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
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
              {schoolSlug && (
                <span className="text-[10px] font-mono text-tahfidz-green text-center">{schoolSlug}</span>
              )}
            </div>
          </div>

          <Link href={`/${role}/notifications`} className="p-2 -mr-2 relative active:scale-95 tap-feedback">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        </div>
      </header>

      {/* Drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMenuOpen(false)}
            />

            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed start-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col h-[100dvh] overflow-y-auto pb-24"
              data-mobile-role={role}
            >
              {/* User section */}
              <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-tahfidz-green flex items-center justify-center overflow-hidden flex-shrink-0">
                    <span className="text-white font-bold text-lg">{(session?.user?.name || "?").charAt(0)}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{session?.user?.name || "Utilisateur"}</p>
                    <p className="text-[11px] text-gray-400 truncate">{session?.user?.email || ""}</p>
                  </div>
                </div>
              </div>

              {/* Navigation links */}
              {navItems.length > 0 && (
                <motion.nav
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="p-3 space-y-0.5"
                >
                  {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    const Icon = item.icon
                    return (
                      <motion.div key={item.href} variants={itemVariants}>
                        <Link
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                            isActive
                              ? "bg-tahfidz-green-light text-tahfidz-green"
                              : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                          )}
                        >
                          <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                          <span>{t(item.labelKey) || item.labelKey}</span>
                        </Link>
                      </motion.div>
                    )
                  })}
                </motion.nav>
              )}

              {/* Controls */}
              <div className="px-5 py-3 border-t border-b border-gray-100 dark:border-gray-800">
                <TopBarControls dropdownAlign="left" />
              </div>

              {/* Logout */}
              <div className="p-4 mt-auto border-t border-gray-100 dark:border-gray-800">
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
          </>
        )}
      </AnimatePresence>
    </>
  )
}
