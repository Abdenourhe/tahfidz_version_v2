"use client"
// ParentDashboardClient.tsx — Centre d'opération parent moderne

import { useState, useMemo, useRef, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { motion, AnimatePresence } from "framer-motion"
import { User, Sparkles, Bug } from "lucide-react"
import Link from "next/link"
import { ChildCard } from "./ChildCard"
import { QuickActions } from "./QuickActions"
import { AIParentSummary } from "./AIParentSummary"
import { TeacherChat } from "@/components/parent/child/TeacherChat"
import AdminParentChatDrawer from "@/components/admin/AdminParentChatDrawer"
import { ParentChildProfileClient } from "@/components/parent/child/ParentChildProfileClient"
import { ParentAttendancePanel } from "@/components/parent/attendance/ParentAttendancePanel"
import { TiltCard } from "@/components/shared/TiltCard"
import { FeedbackModal } from "@/components/shared/FeedbackModal"
import { useMediaQuery } from "@/hooks/useMediaQuery"
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

type SidePanel =
  | { type: "child"; childId: string }
  | { type: "attendance" }
  | null

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || ""
  const parentUserId = session?.user?.id
  const isDesktop = useMediaQuery("(min-width: 1280px)")

  const [teacherChat, setTeacherChat] = useState<{ child: Child; open: boolean } | null>(null)
  const [adminChatOpen, setAdminChatOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [sidePanel, setSidePanel] = useState<SidePanel>(null)
  const [surahs, setSurahs] = useState<Record<number, { nameFr: string; nameAr: string }>>({})
  const childrenRef = useRef<HTMLDivElement>(null)

  const admin = schoolAdmin
  const missingChildren = children.filter((c) => missingTomorrowIds.includes(c.id))

  const scrollToChildren = () => {
    childrenRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const hijriDate = useHijriDate(locale)
  const gregorianDate = useGregorianDate(locale)

  // Chargement des sourates pour les résumés de carnet
  useEffect(() => {
    fetch("/api/surahs")
      .then((r) => r.json())
      .then((d) => {
        const map: Record<number, { nameFr: string; nameAr: string }> = {}
        ;(d.surahs || []).forEach((s: any) => { map[s.id] = s })
        setSurahs(map)
      })
  }, [])

  // Gestion de l'historique navigateur pour le master-detail
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const state = e.state as { panel?: SidePanel } | null
      setSidePanel(state?.panel ?? null)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  // Réouverture du panneau au refresh (URL /parent/dashboard?childId=... ou ?attendance=1)
  useEffect(() => {
    if (!isDesktop) return
    const childId = searchParams.get("childId")
    const attendance = searchParams.get("attendance")
    if (childId && children.some((c) => c.id === childId)) {
      setSidePanel({ type: "child", childId })
    } else if (attendance === "1") {
      setSidePanel({ type: "attendance" })
    }
  }, [searchParams, isDesktop, children])

  // Sur mobile, les query params redirigent vers les pages dédiées
  useEffect(() => {
    if (isDesktop) return
    const childId = searchParams.get("childId")
    const attendance = searchParams.get("attendance")
    if (childId) {
      router.replace(`/parent/child/${childId}`)
    } else if (attendance === "1") {
      router.replace("/parent/attendance")
    }
  }, [searchParams, isDesktop, router])

  const handleSelectChild = useCallback(
    (child: Child) => {
      if (!isDesktop) {
        router.push(`/parent/child/${child.id}`)
        return
      }
      const panel: SidePanel = { type: "child", childId: child.id }
      setSidePanel(panel)
      window.history.pushState({ panel }, "", `/parent/dashboard?childId=${child.id}`)
    },
    [isDesktop, router]
  )

  const handleOpenAttendance = useCallback(() => {
    if (!isDesktop) {
      router.push("/parent/attendance")
      return
    }
    const panel: SidePanel = { type: "attendance" }
    setSidePanel(panel)
    window.history.pushState({ panel }, "", "/parent/dashboard?attendance=1")
  }, [isDesktop, router])

  const handleCloseDetail = useCallback(() => {
    setSidePanel(null)
    const hasQueryPanel =
      typeof window !== "undefined" &&
      (new URLSearchParams(window.location.search).has("childId") ||
        new URLSearchParams(window.location.search).has("attendance"))
    if (hasQueryPanel) {
      window.history.replaceState({}, "", "/parent/dashboard")
    } else if (window.history.state?.panel) {
      window.history.back()
    } else {
      window.history.pushState({}, "", "/parent/dashboard")
    }
  }, [])

  // Communication avec le header parent (fermeture via le lien Tableau de bord)
  useEffect(() => {
    const onClosePanel = () => handleCloseDetail()
    window.addEventListener("parent:close-panel", onClosePanel)
    return () => window.removeEventListener("parent:close-panel", onClosePanel)
  }, [handleCloseDetail])

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("parent:panel-change", { detail: { open: !!sidePanel } }))
  }, [sidePanel])

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

  const dashboardContent = (
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
        onOpenAttendance={handleOpenAttendance}
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
                  surahs={surahs}
                  onContactTeacher={(c) => setTeacherChat({ child: c, open: true })}
                  onSelect={isDesktop ? handleSelectChild : undefined}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Teacher chat panel */}
      {teacherChat?.child.teacher && parentUserId && teacherChat.open && (
        <div className="fixed inset-0 z-[60] md:absolute md:inset-auto md:bottom-auto md:top-20 md:left-1/2 md:-translate-x-1/2 md:w-[480px]">
          <div
            className="absolute inset-0 bg-black/30 md:hidden"
            onClick={() => setTeacherChat((prev) => (prev ? { ...prev, open: false } : null))}
          />
          <div className="relative h-full md:h-auto flex flex-col md:block">
            <TeacherChat
              teacherUserId={teacherChat.child.teacher.user.id}
              teacherName={teacherChat.child.teacher.user.fullName}
              parentUserId={parentUserId}
              childName={teacherChat.child.user.fullName}
              studentId={teacherChat.child.id}
              open={teacherChat.open}
              onOpenChange={(open) => setTeacherChat((prev) => (prev ? { ...prev, open } : null))}
              className="rounded-none md:rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* Bouton Signaler flottant */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setFeedbackOpen(true)}
        className="fixed bottom-24 right-4 z-40 md:bottom-8 md:right-8 flex items-center gap-2 px-4 py-3 bg-red-500 text-white text-sm font-bold rounded-full shadow-xl hover:bg-red-600 transition"
      >
        <Bug size={18} />
        <span className="hidden sm:inline">{t("report")}</span>
      </motion.button>

      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        userRole={session?.user?.role || "PARENT"}
        userName={session?.user?.name || ""}
        userEmail={session?.user?.email || ""}
      />

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

  return (
    <AnimatePresence mode="wait">
      {sidePanel && isDesktop ? (
        <motion.div
          key="split"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-16 left-0 right-0 bottom-0 z-30 flex bg-gray-50 dark:bg-gray-950"
        >
          {/* Dashboard — glisse vers la gauche */}
          <motion.div
            initial={{ x: "50%" }}
            animate={{ x: 0 }}
            exit={{ x: "50%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-1/2 h-full overflow-y-auto"
          >
            <div className="max-w-2xl ml-auto px-6 py-6">
              {dashboardContent}
            </div>
          </motion.div>

          {/* Panneau latéral */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 180 }}
            className="w-1/2 h-full overflow-y-auto bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <div className="min-h-full px-6 py-6">
              {sidePanel.type === "child" ? (
                <ParentChildProfileClient
                  studentId={sidePanel.childId}
                  embedded
                  onClose={handleCloseDetail}
                />
              ) : (
                <ParentAttendancePanel />
              )}
            </div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="max-w-6xl mx-auto px-4 py-6"
        >
          {dashboardContent}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
