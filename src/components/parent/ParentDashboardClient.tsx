"use client"
// ParentDashboardClient.tsx — Centre d'opération parent

import { useLanguage, useT } from "@/contexts/LanguageContext"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import {
  CalendarDays, GraduationCap, Star, User, ArrowRight,
  CalendarCheck, Link2, Video, Bell, ChevronRight,
} from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

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
  missingTomorrowIds: string[]
}

function ChildCard({ child }: { child: Child }) {
  const t = useT("parentDashboardClient")

  return (
    <Link href={`/parent/child/${child.id}`}
      className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-tahfidz-green/30 transition-all duration-200 active:scale-[0.98]">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-xl gradient-tahfidz flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-emerald-50 dark:ring-emerald-900/20">
          <AvatarLightbox
            src={child.user.avatar}
            alt={child.user.fullName}
            fallback={<span className="text-white font-bold text-xl">{child.user.fullName.charAt(0).toUpperCase()}</span>}
            className="w-full h-full"
            imgClassName="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-tahfidz-green transition truncate">{child.user.fullName}</h3>
            {child.user.fullNameAr && <span className="arabic text-gray-400 text-xs hidden sm:inline">{child.user.fullNameAr}</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {child.group?.name && (
              <span className="flex items-center gap-1 text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 font-medium">
                <GraduationCap size={9} /> {child.group.name}
              </span>
            )}
            {child.teacher && (
              <span className="flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                <User size={9} /> {child.teacher.user.fullName}
              </span>
            )}
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-300 group-hover:text-tahfidz-green transition flex-shrink-0" />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800">
        <div className="text-center">
          <p className="text-sm font-bold text-emerald-600">{child._count.memorizedSurahs}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{t("memorized")}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-orange-500">{child.currentStreak}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{t("streak")}</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-purple-600">{child.studentBadges.length}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wide font-medium">{t("badges")}</p>
        </div>
      </div>

      {child.studentBadges.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mt-2.5">
          {child.studentBadges.slice(0, 3).map((sb) => (
            <span key={sb.id} className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-[10px] font-medium text-yellow-800 dark:text-yellow-300">
              {sb.badge.icon} {sb.badge.name}
            </span>
          ))}
          {child.studentBadges.length > 3 && (
            <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[10px] text-gray-400 font-medium">+{child.studentBadges.length - 3}</span>
          )}
        </div>
      )}
    </Link>
  )
}

export function ParentDashboardClient({ todayDate, children, missingTomorrowIds }: Props) {
  const t = useT("parentDashboardClient")
  const { locale } = useLanguage()
  const { data: session } = useSession()
  const schoolName = (session?.user as any)?.schoolName || "TAHFIDZ"
  const schoolLogo = (session?.user as any)?.schoolLogo

  const missingChildren = children.filter(c => missingTomorrowIds.includes(c.id))

  return (
    <div className="space-y-5">
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

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link href="/parent/attendance"
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-tahfidz-green/40 hover:shadow-md transition active:scale-95">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={18} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Présences</p>
            <p className="text-[10px] text-gray-400">Marquer pour demain</p>
          </div>
        </Link>
        <Link href="/parent/halaqa"
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-blue-400/40 hover:shadow-md transition active:scale-95">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
            <Video size={18} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Halaqa</p>
            <p className="text-[10px] text-gray-400">Sessions en ligne</p>
          </div>
        </Link>
        <Link href="/parent/link"
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-orange-400/40 hover:shadow-md transition active:scale-95">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
            <Link2 size={18} className="text-orange-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Lier un enfant</p>
            <p className="text-[10px] text-gray-400">Ajouter un élève</p>
          </div>
        </Link>
        <Link href="/parent/notifications"
          className="flex items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm hover:border-purple-400/40 hover:shadow-md transition active:scale-95">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Bell size={18} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Notifications</p>
            <p className="text-[10px] text-gray-400">Messages et alertes</p>
          </div>
        </Link>
      </div>

      {/* Attendance alert */}
      {missingChildren.length > 0 && (
        <Link href="/parent/attendance"
          className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-2xl hover:bg-amber-100 dark:hover:bg-amber-900/20 transition active:scale-[0.98]">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/30 flex items-center justify-center shrink-0">
            <CalendarDays size={18} className="text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {missingChildren.length === 1
                ? (locale === "ar"
                    ? `لم يتم تسجيل حضور ${missingChildren[0].user.fullName} ليوم الغد`
                    : locale === "en"
                      ? `${missingChildren[0].user.fullName}'s attendance for tomorrow is not marked`
                      : `Vous n'avez pas marqué la présence de ${missingChildren[0].user.fullName} pour demain`)
                : (locale === "ar"
                    ? `لم يتم تسجيل حضور ${missingChildren.length} أطفال ليوم الغد`
                    : locale === "en"
                      ? `${missingChildren.length} children's attendance for tomorrow is not marked`
                      : `Vous n'avez pas marqué la présence de ${missingChildren.length} enfants pour demain`)}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              {locale === "ar" ? "انقر للتسجيل →" : locale === "en" ? "Click to mark →" : "Cliquez pour marquer →"}
            </p>
          </div>
          <ArrowRight size={16} className="text-amber-400 shrink-0" />
        </Link>
      )}

      {/* Mes enfants */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
            <User size={16} className="text-tahfidz-green" />
            Mes enfants
            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">{children.length}</span>
          </h2>
        </div>

        {children.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-4xl mb-3">👨‍👩‍👦</p>
            <p className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{t("noChild")}</p>
            <p className="text-sm text-gray-500 mb-4">{t("noChildDesc")}</p>
            <Link href="/parent/link"
              className="inline-flex items-center gap-2 px-5 py-2.5 gradient-tahfidz text-white text-sm font-semibold rounded-xl hover:opacity-90 transition active:scale-95">
              <Link2 size={14} /> Lier un enfant
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {children.map((child) => <ChildCard key={child.id} child={child} />)}
          </div>
        )}
      </div>
    </div>
  )
}
