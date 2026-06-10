"use client"
import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useLanguage, useT } from "@/contexts/LanguageContext"

import { formatDate } from "@/lib/utils"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileAccordion } from "@/components/profile/ProfileAccordion"

import { ParentProfileSettings } from "@/components/parent/ParentProfileSettings"
import { Phone, Mail, BookOpen, Star, Award, User, Bug, Settings, Globe, Languages, ArrowRight, LogOut } from "lucide-react"
import { FeedbackModal } from "@/components/shared/FeedbackModal"
import { signOut } from "next-auth/react"

interface Props {
  parent: {
    user: {
      fullName: string
      fullNameAr: string | null
      email: string
      phone: string | null
      avatar: string | null
      createdAt: Date
    }
    nationality: string | null
    spokenLanguages: string | null
  }
  totalChildren: number
  totalMemorized: number
  totalStars: number
  totalBadges: number
  schoolName?: string
  schoolCity?: string
}

export function ParentProfileClient({
  parent, totalChildren, totalMemorized, totalStars, totalBadges, schoolName, schoolCity,
}: Props) {
  const [showFeedback, setShowFeedback] = useState(false)
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("parentProfileClient")

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-6xl">
      {/* Header */}
      <ProfileHeader
        name={parent.user.fullName}
        nameAr={parent.user.fullNameAr}
        role={t("parent")}
        avatarLetter={parent.user.fullName.charAt(0)}
        avatar={parent.user.avatar || undefined}
        avatarColor="bg-orange-500"
        roleColor="bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Mail size={13} /> {parent.user.email}</span>
          {parent.user.phone && <span className="flex items-center gap-1"><Phone size={13} /> {parent.user.phone}</span>}
          {parent.nationality && <span className="flex items-center gap-1"><Globe size={13} /> {parent.nationality}</span>}
          {parent.spokenLanguages && <span className="flex items-center gap-1"><Languages size={13} /> {parent.spokenLanguages}</span>}
          <span>· {t("memberSince")} {formatDate(parent.user.createdAt, { month: "long", year: "numeric" })}</span>
          {schoolName && <span>· {schoolName}{schoolCity ? `, ${schoolCity}` : ""}</span>}
        </div>
      </ProfileHeader>

      {/* Global stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={User} label={t("children")} value={totalChildren} colorClass="text-orange-600" delay={0.1} />
        <StatCard icon={BookOpen} label={t("memorized")} value={totalMemorized} colorClass="text-tahfidz-green" delay={0.2} />
        <StatCard icon={Star} label={t("stars")} value={totalStars} prefix="⭐" colorClass="text-tahfidz-gold" delay={0.3} />
        <StatCard icon={Award} label={t("badges")} value={totalBadges} colorClass="text-purple-600" delay={0.4} />
      </div>

      {/* Link to dashboard children */}
      <Link href="/parent/dashboard"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-tahfidz-green/30 hover:shadow-md transition active:scale-[0.98]">
        <div className="w-10 h-10 rounded-xl bg-tahfidz-green-light dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
          <User size={18} className="text-tahfidz-green" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{t("myChildren")} ({totalChildren})</p>
          <p className="text-xs text-gray-400">{t("viewOnDashboard") || "Voir le suivi sur le tableau de bord"}</p>
        </div>
        <ArrowRight size={16} className="text-gray-300" />
      </Link>

      {/* Settings */}
      <ProfileAccordion title={t("settings")} icon={Settings} delay={0.5}>
        <ParentProfileSettings />
      </ProfileAccordion>

      {/* Logout */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-sm font-bold hover:bg-red-100 transition"
      >
        <LogOut size={16} />
        <span>{L === "ar" ? "تسجيل الخروج" : L === "en" ? "Log out" : "Se déconnecter"}</span>
      </motion.button>

      {/* Report bug */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowFeedback(true)}
        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium hover:bg-red-100 transition"
      >
        <Bug size={14} />
        <span>{L === "ar" ? "إبلاغ" : L === "en" ? "Report" : "Signaler"}</span>
      </motion.button>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="PARENT"
        userName={parent.user.fullName}
        userEmail={parent.user.email}
        schoolName={undefined}
      />
    </motion.div>
  )
}
