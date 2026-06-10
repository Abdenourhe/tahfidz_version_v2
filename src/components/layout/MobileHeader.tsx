"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, Bell, X, LogOut } from "lucide-react"
import { TopBarControls } from "./TopBarControls"
import { useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"

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

      {/* Drawer — secondary actions only */}
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
            >
              {/* User section */}
              <div className="px-5 py-5 border-b border-gray-100 dark:border-gray-800">
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

              {/* Controls */}
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
                <TopBarControls dropdownAlign="left" />
              </div>

              {/* Secondary links */}
              <nav className="p-4 space-y-1 flex-1">
                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-wider px-3 mb-2">{t("quickLinks") || "Liens rapides"}</p>
                <Link href={`/${role}/link`} onClick={() => setMenuOpen(false)}
                  className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors", pathname === `/${role}/link` ? "bg-tahfidz-green-light text-tahfidz-green font-semibold" : "text-gray-600 hover:bg-gray-50")}>
                  {t("linkChild") || "Lier un enfant"}
                </Link>
              </nav>

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
          </>
        )}
      </AnimatePresence>
    </>
  )
}
