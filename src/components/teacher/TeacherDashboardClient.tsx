"use client"
// src/components/teacher/TeacherDashboardClient.tsx

import Link from "next/link"
import { useT } from "@/contexts/LanguageContext"
import {
  Users, GraduationCap, BookMarked, ClipboardCheck,
  ArrowRight, TrendingUp,
} from "lucide-react"

interface Props {
  teacher: {
    user: { fullName: string; fullNameAr: string | null }
    _count: { students: number; groups: number }
  }
  stats: {
    totalStudents: number
    totalGroups: number
    activeAssignments: number
    pendingAttendances: number
  }
}

export function TeacherDashboardClient({ teacher, stats }: Props) {
  const t = useT("teacherDashboard")

  const cards = [
    {
      title: t("myStudents"),
      value: stats.totalStudents,
      icon: Users,
      href: "/teacher/tracking",
      color: "bg-blue-500",
    },
    {
      title: t("myGroups"),
      value: stats.totalGroups,
      icon: GraduationCap,
      href: "/teacher/groups",
      color: "bg-purple-500",
    },
    {
      title: t("activeAssignments"),
      value: stats.activeAssignments,
      icon: BookMarked,
      href: "/teacher/memorization",
      color: "bg-tahfidz-green",
    },
    {
      title: t("pendingAttendances"),
      value: stats.pendingAttendances,
      icon: ClipboardCheck,
      href: "/teacher/attendance",
      color: "bg-orange-500",
      alert: stats.pendingAttendances > 0,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("welcome")}, {teacher.user.fullName}
          </h1>
          {teacher.user.fullNameAr && (
            <p className="arabic text-gray-500 dark:text-gray-400 mt-1">{teacher.user.fullNameAr}</p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => {
          const Icon = card.icon
          return (
            <Link
              key={card.title}
              href={card.href}
              className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <Icon size={20} className="text-white" />
                </div>
                {card.alert && (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.title}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-tahfidz-green opacity-0 group-hover:opacity-100 transition">
                <span>{t("viewAll")}</span>
                <ArrowRight size={12} />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Actions rapides */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t("quickActions")}</h2>
        <div className="flex flex-wrap gap-3">
          <QuickActionButton href="/teacher/memorization" icon={BookMarked} label={t("assignSurah")} />
          <QuickActionButton href="/teacher/attendance" icon={ClipboardCheck} label={t("validateAttendance")} />
          <QuickActionButton href="/teacher/evaluations" icon={TrendingUp} label={t("newEvaluation")} />
        </div>
      </div>
    </div>
  )
}

function QuickActionButton({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-4 py-2.5 bg-tahfidz-green/10 text-tahfidz-green rounded-lg text-sm font-medium hover:bg-tahfidz-green/20 transition"
    >
      <Icon size={16} />
      {label}
    </Link>
  )
}
