"use client"
// ParentDashboardClient.tsx — Centre d'opération parent moderne

import { useState, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { motion } from "framer-motion"
import { User, Sparkles } from "lucide-react"
import Link from "next/link"
import { ChildCard } from "./ChildCard"
import { QuickActions } from "./QuickActions"
import { AIParentSummary } from "./AIParentSummary"
import { TeacherChat } from "@/components/parent/child/TeacherChat"
import AdminParentChatDrawer from "@/components/admin/AdminParentChatDrawer"
import { TiltCard } from "@/components/shared/TiltCard"
import { cn } from "@/lib/utils"

interface TeacherUser {
  id: string
  fullName: string
  phone?: string | null
  email: string
}

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { name: string } | null
  teacher: { user: TeacherUser } | null
  studentBadges: { id: string; badge: { icon: string; name: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  todayDate: string
  children: Child[]
  missingTomorrowIds: string[]
  schoolAdmin: { id: string; fullName: string; email: string; phone?: string | null; role?: string } | null
}

function useHijriDate(locale: string) {
  return useMemo(() => {
    try {
      const date = new Date()
      const options: Intl.DateTimeFormatOptions = {
        calendar: "islamic",
        day: "numeric",
        month: "long",
        year: "numeric",
      }
      return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-US", options).format(date)
    } catch {
      return ""
    }
  }, [locale])
}

function useGregorianDate(locale: string) {
  return useMemo(() => {
    const date = new Date()
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date)
  }, [locale])
}

export function ParentDashboardClient({ todayDate: _todayDate, children, missingTomorrowIds, schoolAdmin }: Props) {
  const { locale } = useLanguage()
  const t = useT("parentDashboardClient")
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || ""
  const parentUserId = session?.user?.id

  const [teacherChat, setTeacherChat] = useState<{ child: Child; open: boolean } | null>(null)
  const [adminChatOpen, setAdminChatOpen] = useState(false)
  const childrenRef = useRef<HTMLDivElement>(null)

  const admin = schoolAdmin
  const missingChildren = children.filter((c) => missingTomorrowIds.includes(c.id))

  const scrollToChildren = () => {
    childrenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const hijriDate = useHijriDate(locale)
  const gregorianDate = useGregorianDate(locale)

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0 },
  }

  return (
    <div className="space-y-5">
      {/* Header glassmorphism avec avatar et dates */}
      <TiltCard intensity={4} className="group">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl border p-5",
            "bg-gradient-to-br from-tahfidz-green/10 via-white/70 to-tahfidz-gold/10",
            "dark:from-tahfidz-green/15 dark:via-gray-900/80 dark:to-tahfidz-gold/10",
            "border-white/60 dark:border-white/10",
            "backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20"
          )}
        >
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-tahfidz-green/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-tahfidz-gold/20 blur-3xl" />

          <div className="relative flex items-center gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative shrink-0"
            >
              <div className="absolute inset-0 rounded-full bg-tahfidz-green/30 blur-md" />
              <div className="relative h-14 w-14 rounded-full gradient-tahfidz flex items-center justify-center text-white text-xl font-bold ring-2 ring-white/50 dark:ring-white/20">
                {firstName.charAt(0).toUpperCase() || "?"}
              </div>
            </motion.div>

            <div className="min-w-0 flex-1">
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                {firstName ? t("welcome").replace("{{name}}", firstName) : t("welcomeFallback")}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-gray-500 dark:text-gray-400"
              >
                <span>{gregorianDate}</span>
                {hijriDate && (
                  <>
                    <span className="hidden sm:inline text-gray-300">|</span>
                    <span className="arabic text-tahfidz-green font-medium">{hijriDate}</span>
                  </>
                )}
              </motion.div>
            </div>

            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 dark:bg-white/5 text-tahfidz-green">
              <Sparkles size={20} />
            </div>
          </div>
        </div>
      </TiltCard>

      {/* Raccourcis intelligents — non redondants avec la nav */}
      <QuickActions
        missingCount={missingChildren.length}
        onContactAdmin={() => setAdminChatOpen(true)}
        onScrollToChildren={scrollToChildren}
      />

      {/* Résumé intelligent */}
      {children.length > 0 && <AIParentSummary students={children} missingIds={missingTomorrowIds} />}

      {/* Mes enfants */}
      <motion.div ref={childrenRef} variants={container} initial="hidden" animate="show">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <User size={16} className="text-tahfidz-green" />
            {t("myChildren")}
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{children.length}</span>
          </h2>
        </div>

        {children.length === 0 ? (
          <motion.div variants={item} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-4xl mb-3">👨‍👩‍👦</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noChild")}</p>
            <p className="text-sm text-gray-500 mb-4">{t("noChildDesc")}</p>
            <Link
              href="/parent/link"
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition active:scale-95"
            >
              {t("linkChild")}
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {children.map((child) => (
              <motion.div key={child.id} variants={item}>
                <ChildCard
                  child={child}
                  admin={admin}
                  onContactTeacher={(c) => setTeacherChat({ child: c, open: true })}
                  onContactAdmin={() => setAdminChatOpen(true)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Teacher chat panel */}
      {teacherChat?.child.teacher && parentUserId && (
        <div className="fixed inset-x-0 bottom-0 z-50 md:absolute md:bottom-auto md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-[480px]">
          <TeacherChat
            teacherUserId={teacherChat.child.teacher.user.id}
            teacherName={teacherChat.child.teacher.user.fullName}
            parentUserId={parentUserId}
            childName={teacherChat.child.user.fullName}
            studentId={teacherChat.child.id}
            open={teacherChat.open}
            onOpenChange={(open) => setTeacherChat((prev) => (prev ? { ...prev, open } : null))}
          />
        </div>
      )}

      {/* Admin chat drawer */}
      {admin && (
        <AdminParentChatDrawer
          otherUserId={admin.id}
          otherUserName={admin.fullName}
          otherUserRole={admin.role || "ADMIN"}
          open={adminChatOpen}
          onOpenChange={setAdminChatOpen}
        />
      )}
    </div>
  )
}
