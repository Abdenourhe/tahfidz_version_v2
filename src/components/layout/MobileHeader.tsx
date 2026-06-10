"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Bell, X, LogOut, User } from "lucide-react"
import { TopBarControls } from "./TopBarControls"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"

const ROLE_LINKS: Record<string, { href: string; labelKey: string }[]> = {
  superadmin: [
    { href: "/superadmin/audit", labelKey: "audit" },
    { href: "/superadmin/profile", labelKey: "profile" },
  ],
  teacher: [
    { href: "/teacher/dashboard", labelKey: "dashboard" },
    { href: "/teacher/students", labelKey: "students" },
    { href: "/teacher/groups", labelKey: "groups" },
    { href: "/teacher/memorization", labelKey: "memorization" },
    { href: "/teacher/attendance", labelKey: "attendance" },
    { href: "/teacher/evaluations", labelKey: "evaluations" },
    { href: "/teacher/announcements", labelKey: "announcements" },
    { href: "/teacher/notifications", labelKey: "notifications" },
    { href: "/teacher/profile", labelKey: "profile" },
  ],
  admin: [
    { href: "/admin/dashboard", labelKey: "dashboard" },
    { href: "/admin/students", labelKey: "students" },
    { href: "/admin/teachers", labelKey: "teachers" },
    { href: "/admin/groups", labelKey: "groups" },
    { href: "/admin/announcements", labelKey: "announcements" },
    { href: "/admin/notifications", labelKey: "notifications" },
    { href: "/admin/settings", labelKey: "settings" },
  ],
  student: [
    { href: "/student/dashboard", labelKey: "dashboard" },
    { href: "/student/progress", labelKey: "progress" },
    { href: "/student/badges", labelKey: "badges" },
    { href: "/student/attendance", labelKey: "attendance" },
    { href: "/student/notifications", labelKey: "notifications" },
  ],
  parent: [
    { href: "/parent/dashboard", labelKey: "dashboard" },
    { href: "/parent/link", labelKey: "linkChild" },
    { href: "/parent/attendance", labelKey: "attendance" },
    { href: "/parent/halaqa", labelKey: "halaqa" },
    { href: "/parent/notifications", labelKey: "notifications" },
    { href: "/parent/profile", labelKey: "profile" },
  ],
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

  const links = ROLE_LINKS[role] || []
  const displayName = schoolName || "TAHFIDZ"
  const logo = schoolLogo
  const schoolSlug = session?.user?.schoolSlug

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

          <Link href={`/${role}/dashboard`} className="flex items-center gap-2">
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
          </Link>

          <Link href={`/${role}/notifications`} className="p-2 -mr-2 relative active:scale-95 tap-feedback">
            <Bell size={20} className="text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
          </Link>
        </div>
      </header>

      {/* Drawer avec animation */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed start-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col"
            >
              {/* User section */}
              <div className="px-4 py-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-tahfidz-green flex items-center justify-center overflow-hidden flex-shrink-0">
                    {session?.user?.avatar ? (
                      <Image src={session.user.avatar} alt={session.user.name || ""} width={48} height={48} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-lg">{(session?.user?.name || "?").charAt(0)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{session?.user?.name || "Utilisateur"}</p>
                    <p className="text-[11px] text-gray-400 truncate">{session?.user?.email || ""}</p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="p-3 space-y-1 overflow-y-auto flex-1">
                {links.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                        pathname === item.href || pathname.startsWith(item.href + "/")
                          ? "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green font-semibold"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <span className="flex-1">{t(item.labelKey)}</span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer */}
              <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <button
                  onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/login" }) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                >
                  <LogOut size={16} />
                  <span>{t("logout") || "Déconnexion"}</span>
                </button>
                <p className="text-[10px] text-gray-300 text-center pt-1">{displayName}</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
