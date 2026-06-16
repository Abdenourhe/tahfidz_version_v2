"use client"

import Link from "next/link"
import { ChevronRight, GraduationCap, Star, User } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"
import { AvatarLightbox } from "@/components/AvatarLightbox"

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

export function ChildCard({ child }: { child: Child }) {
  const t = useT("parentDashboardClient")

  return (
    <Link
      href={`/parent/child/${child.id}`}
      className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm hover:shadow-md hover:border-tahfidz-green/30 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="w-16 h-16 rounded-2xl gradient-tahfidz flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-emerald-50 dark:ring-emerald-900/20">
          <AvatarLightbox
            src={child.user.avatar}
            alt={child.user.fullName}
            fallback={<span className="text-white font-bold text-2xl">{child.user.fullName.charAt(0).toUpperCase()}</span>}
            className="w-full h-full"
            imgClassName="w-full h-full"
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-tahfidz-green transition truncate">
                {child.user.fullName}
              </h3>
              {child.user.fullNameAr && (
                <p className="arabic text-gray-400 text-xs truncate">{child.user.fullNameAr}</p>
              )}
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-tahfidz-green transition flex-shrink-0 mt-0.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
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

          {/* Stats */}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-emerald-600">{child._count.memorizedSurahs}</span>
              <span className="text-gray-400">{t("memorizedShort")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <span className="font-bold text-orange-500">{child.currentStreak}</span>
              <span className="text-gray-400">{t("streakShort")}</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <Star size={12} className="text-tahfidz-gold fill-tahfidz-gold" />
              <span className="font-bold text-gray-700 dark:text-gray-200">{child.totalStars}</span>
            </div>
          </div>

          {/* Badges */}
          {child.studentBadges.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {child.studentBadges.slice(0, 4).map((sb) => (
                <span
                  key={sb.id}
                  className="flex items-center gap-1 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-[10px] font-medium text-yellow-800 dark:text-yellow-300"
                >
                  {sb.badge.icon} {sb.badge.name}
                </span>
              ))}
              {child.studentBadges.length > 4 && (
                <span className="px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-[10px] text-gray-400 font-medium">
                  +{child.studentBadges.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
