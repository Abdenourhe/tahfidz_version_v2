"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileAccordion } from "@/components/profile/ProfileAccordion"
import {
  Users, GraduationCap, BookOpen, UserCircle, Mail, Phone, School, Settings, Megaphone, UsersRound,
  Shield
} from "lucide-react"

interface Props {
  admin: {
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
    permissions: any
  }
  school: {
    name: string
    nameAr: string | null
    city: string | null
    country: string | null
    plan: string
    _count: { users: number; groups: number }
  } | null
  stats: {
    studentCount: number
    teacherCount: number
    parentCount: number
    groupCount: number
    userCount: number
  }
}

export function AdminProfileClient({ admin, school, stats }: Props) {
  const t = useT("adminProfileClient")
  const tc = useT("profileCommon")

  const genderLabel = (g: string | null) => {
    if (g === "MALE") return t("male")
    if (g === "FEMALE") return t("female")
    return t("unknown")
  }

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <ProfileHeader
        name={admin.user.fullName}
        nameAr={admin.user.fullNameAr}
        role={t("admin")}
        avatarLetter={admin.user.fullName.charAt(0)}
        avatar={admin.user.avatar || undefined}
        avatarColor="bg-purple-600"
        roleColor="bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Mail size={13} /> {admin.user.email}
          </span>
          {admin.user.phone && (
            <span className="flex items-center gap-1">
              <Phone size={13} /> {admin.user.phone}
            </span>
          )}
          <span>· {genderLabel(admin.user.gender)}</span>
          <span>· {t("memberSince")} {formatDate(admin.user.createdAt, { month: "short", year: "numeric" })}</span>
          {school?.name && (
            <span>· {school.name}{school.city ? `, ${school.city}` : ""}</span>
          )}
        </div>
      </ProfileHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label={t("students")} value={stats.studentCount} colorClass="text-blue-600" delay={0.1} />
        <StatCard icon={GraduationCap} label={t("teachers")} value={stats.teacherCount} colorClass="text-tahfidz-green" delay={0.2} />
        <StatCard icon={BookOpen} label={t("groups")} value={stats.groupCount} colorClass="text-purple-600" delay={0.3} />
        <StatCard icon={UserCircle} label={t("parents")} value={stats.parentCount} colorClass="text-orange-600" delay={0.4} />
      </div>

      <ProfileAccordion title={t("school")} icon={School} defaultOpen delay={0.5}>
        {school ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t("school")}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{school.name}</span>
            </div>
            {school.nameAr && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Arabic</span>
                <span className="font-medium text-gray-800 dark:text-gray-200 arabic">{school.nameAr}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="font-medium text-gray-800 dark:text-gray-200 uppercase">{school.plan}</span>
            </div>
            {(school.city || school.country) && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{tc("status")}</span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {[school.city, school.country].filter(Boolean).join(", ")}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t("users")}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{school._count.users}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{t("groups")}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{school._count.groups}</span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t("noSchool")}</p>
        )}
      </ProfileAccordion>

      <ProfileAccordion title={t("permissions")} icon={Shield} delay={0.6}>
        <div className="space-y-2">
          {admin.permissions && typeof admin.permissions === "object" && Object.keys(admin.permissions).length > 0 ? (
            Object.entries(admin.permissions).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <span className="text-sm text-gray-600 dark:text-gray-300 capitalize">{k}</span>
                <span className="text-xs font-medium text-tahfidz-green">{String(v)}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-400">{tc("notProvided")}</p>
          )}
        </div>
      </ProfileAccordion>

      <ProfileAccordion title={t("quickActions")} icon={Settings} delay={0.7}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/admin/students", label: t("manageStudents"), icon: Users, color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600" },
            { href: "/admin/teachers", label: t("manageTeachers"), icon: GraduationCap, color: "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green" },
            { href: "/admin/groups", label: t("manageGroups"), icon: BookOpen, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600" },
            { href: "/admin/settings", label: t("settings"), icon: Settings, color: "bg-gray-50 dark:bg-gray-800 text-gray-600" },
            { href: "/admin/announcements", label: t("announcements"), icon: Megaphone, color: "bg-orange-50 dark:bg-orange-900/20 text-orange-600" },
            { href: "/admin/parents", label: t("parents"), icon: UsersRound, color: "bg-pink-50 dark:bg-pink-900/20 text-pink-600" },
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
        </div>
      </ProfileAccordion>
    </motion.div>
  )
}
