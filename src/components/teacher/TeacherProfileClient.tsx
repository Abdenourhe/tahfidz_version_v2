"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { useState } from "react"

import { useLanguage, useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileAccordion } from "@/components/profile/ProfileAccordion"
import {
  Users, BookOpen, ClipboardList, Phone, Mail, GraduationCap, CalendarCheck,
  Bug, Settings
} from "lucide-react"
import { FeedbackModal } from "@/components/shared/FeedbackModal"
import { NotificationSettings } from "@/components/shared/NotificationSettings"

interface Props {
  teacher: {
    id: string
    specialization: string | null
    maxStudents: number
    user: {
      fullName: string
      fullNameAr: string | null
      email: string
      phone: string | null
      gender: string | null
      avatar: string | null
      createdAt: Date
      lastLoginAt: Date | null
    }
    groups: {
      id: string
      name: string
      level: string
      _count: { students: number }
    }[]
    _count: { groups: number; evaluations: number }
  }
  totalStudents: number
  schoolName?: string
  schoolCity?: string
}

export function TeacherProfileClient({ teacher, totalStudents, schoolName, schoolCity }: Props) {
  const [showFeedback, setShowFeedback] = useState(false)
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("teacherProfileClient")
  const _tc = useT("profileCommon")

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <ProfileHeader
        name={teacher.user.fullName}
        nameAr={teacher.user.fullNameAr}
        role={teacher.specialization ?? t("teacher")}
        avatarLetter={teacher.user.fullName.charAt(0)}
        avatar={teacher.user.avatar || undefined}
        avatarColor="bg-tahfidz-green"
        roleColor="bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Mail size={13} /> {teacher.user.email}</span>
          {teacher.user.phone && <span className="flex items-center gap-1"><Phone size={13} /> {teacher.user.phone}</span>}
          <span>· {genderLabel(teacher.user.gender)}</span>
          <span>· {t("memberSince")} {formatDate(teacher.user.createdAt, { month: "short", year: "numeric" })}</span>
          {schoolName && (
            <span>· {schoolName}{schoolCity ? `, ${schoolCity}` : ""}</span>
          )}
        </div>
      </ProfileHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={Users} label={t("groups")} value={teacher._count.groups} colorClass="text-purple-600" delay={0.1} />
        <StatCard icon={BookOpen} label={t("students")} value={totalStudents} colorClass="text-blue-600" delay={0.2} />
        <StatCard icon={ClipboardList} label={t("evaluations")} value={teacher._count.evaluations} colorClass="text-tahfidz-gold" delay={0.3} />
      </div>

      <ProfileAccordion title={t("myGroups")} icon={Users} defaultOpen delay={0.4}>
        {teacher.groups.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noGroup")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teacher.groups.map((g) => (
              <Link
                key={g.id}
                href={`/teacher/groups/${g.id}`}
                className="p-4 bg-gray-50 dark:bg-gray-800 hover:bg-tahfidz-green-light dark:hover:bg-emerald-900/20 rounded-xl transition group active:scale-95"
              >
                <p className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-tahfidz-green mb-2">{g.name}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{g._count.students} {t("students").toLowerCase()}</span>
                  <span className="text-xs text-gray-400 capitalize">{g.level}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ProfileAccordion>

      <NotificationSettings />

      <ProfileAccordion title={t("quickActions")} icon={Settings} delay={0.5}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/teacher/tracking", label: t("myStudents"), icon: GraduationCap, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" },
            { href: "/teacher/attendance", label: t("attendance"), icon: CalendarCheck, color: "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green" },
            { href: "/teacher/memorization", label: t("progress"), icon: BookOpen, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300" },
            { href: "/teacher/evaluations", label: t("myEvaluations"), icon: ClipboardList, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`flex items-center gap-2 p-3 rounded-xl transition hover:opacity-80 active:scale-95 ${a.color}`}
            >
              <a.icon size={16} />
              <span className="text-xs font-medium">{a.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setShowFeedback(true)}
            className="flex items-center gap-2 p-3 rounded-xl transition hover:opacity-80 active:scale-95 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300"
          >
            <Bug size={16} />
            <span className="text-xs font-medium">{L === "ar" ? "إبلاغ" : L === "en" ? "Report" : "Signaler"}</span>
          </button>
        </div>
      </ProfileAccordion>

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        userRole="TEACHER"
        userName={teacher.user.fullName}
        userEmail={teacher.user.email}
        schoolName={undefined}
      />
    </motion.div>
  )
}
