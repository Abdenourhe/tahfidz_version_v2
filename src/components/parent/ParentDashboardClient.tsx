"use client"
// src/components/parent/ParentDashboardClient.tsx

import { useState } from "react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import { BookOpen, CalendarDays, GraduationCap, Star, TrendingUp, User } from "lucide-react"
import ParentDailyLogView from "./ParentDailyLogView"
import ParentAttendanceMarker from "./ParentAttendanceMarker"
import { useSession } from "next-auth/react"
import Image from "next/image"

interface Child {
  id: string
  totalStars: number
  currentStreak: number
  user: { fullName: string; fullNameAr: string | null; avatar: string | null }
  group: { name: string } | null
  teacher: { user: { fullName: string } } | null
  studentBadges: { id: string; badge: { icon: string; name: string } }[]
  _count: { memorizedSurahs: number }
}

interface Props {
  todayDate: string
  children: Child[]
}

function ChildCard({ child }: { child: Child }) {
  const { locale } = useLanguage()
  const t = useT("parentDashboardClient")
  const [tab, setTab] = useState<"memorization" | "attendance">("memorization")
  const { data: session } = useSession()
  const schoolName = (session?.user as any)?.schoolName || "TAHFIDZ"
  const schoolLogo = (session?.user as any)?.schoolLogo

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      {/* En-tête enfant */}
      <div className="p-5 md:p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center overflow-hidden shrink-0 ring-4 ring-emerald-50 dark:ring-emerald-900/20">
            <AvatarLightbox
              src={child.user.avatar}
              alt={child.user.fullName}
              fallback={<span className="text-white font-bold text-2xl">{child.user.fullName.charAt(0).toUpperCase()}</span>}
              className="w-full h-full"
              imgClassName="w-full h-full"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{child.user.fullName}</h2>
              {child.user.fullNameAr && <p className="arabic text-gray-500 text-sm">{child.user.fullNameAr}</p>}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
              {child.group?.name && (
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  <GraduationCap size={11} /> {child.group.name}
                </span>
              )}
              {child.teacher && (
                <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full">
                  <User size={11} /> {t("prof")} {child.teacher.user.fullName}
                </span>
              )}
              <span className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                <Star size={11} className="fill-yellow-400 text-yellow-400" /> {child.totalStars}
              </span>
            </div>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{child._count.memorizedSurahs}</div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-600/70 dark:text-emerald-400/70 font-medium mt-0.5">{t("memorized")}</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-orange-500">{child.currentStreak}</div>
            <div className="text-[10px] uppercase tracking-wider text-orange-500/70 font-medium mt-0.5">{t("streak")}</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/10 rounded-xl p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{child.studentBadges.length}</div>
            <div className="text-[10px] uppercase tracking-wider text-purple-600/70 font-medium mt-0.5">{t("badges")}</div>
          </div>
        </div>

        {/* Badges inline */}
        {child.studentBadges.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-4">
            {child.studentBadges.map((sb) => (
              <div key={sb.id} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <span className="text-base">{sb.badge.icon}</span>
                <span className="text-xs font-medium text-yellow-800 dark:text-yellow-300">{sb.badge.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs style pills */}
      <div className="px-5 md:px-6 pb-5 md:pb-6">
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setTab("memorization")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition ${
              tab === "memorization"
                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <BookOpen size={16} />
            {t("memorizationTab")}
          </button>
          <button
            onClick={() => setTab("attendance")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition ${
              tab === "attendance"
                ? "bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CalendarDays size={16} />
            {t("attendanceTab")}
          </button>
        </div>

        <div className="mt-4">
          {tab === "memorization" && <ParentDailyLogView childId={child.id} />}
          {tab === "attendance" && (
            <ParentAttendanceMarker
              childId={child.id}
              children={[{ id: child.id, fullName: child.user.fullName }]}
              showTitle={false}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function ParentDashboardClient({ todayDate, children }: Props) {
  const t = useT("parentDashboardClient")
  const { data: session } = useSession()
  const schoolName = (session?.user as any)?.schoolName || "TAHFIDZ"
  const schoolLogo = (session?.user as any)?.schoolLogo

  return (
    <div className="space-y-6">
      {/* Header école */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
        <div className="w-12 h-12 rounded-xl gradient-tahfidz flex items-center justify-center overflow-hidden shrink-0">
          {schoolLogo ? (
            <Image src={schoolLogo} alt={schoolName} width={48} height={48} className="w-full h-full object-cover" unoptimized />
          ) : (
            <span className="text-white font-bold text-lg">{schoolName.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">{schoolName}</h1>
          <p className="text-xs text-gray-500">{t("title")} · {todayDate}</p>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
          <p className="text-4xl mb-3">👨‍👩‍👦</p>
          <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noChild")}</p>
          <p className="text-sm text-gray-500 mb-4">{t("noChildDesc")}</p>
        </div>
      ) : (
        children.map((child) => <ChildCard key={child.id} child={child} />)
      )}
    </div>
  )
}
