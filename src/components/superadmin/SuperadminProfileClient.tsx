"use client"
import Link from "next/link"
import { motion } from "framer-motion"
import { useT } from "@/contexts/LanguageContext"
import { formatDate } from "@/lib/utils"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { StatCard } from "@/components/profile/StatCard"
import { ProfileAccordion } from "@/components/profile/ProfileAccordion"
import {
  School, Mail, Phone, Users, ClipboardList, Clock, CheckCircle2, XCircle,
  FileText, Globe
} from "lucide-react"

interface Request {
  id: string
  schoolName: string
  city: string | null
  country: string | null
  status: string
  createdAt: Date
  plan: string
}

interface Props {
  user: {
    fullName: string
    fullNameAr: string | null
    email: string
    phone: string | null
    avatar: string | null
    createdAt: Date
    lastLoginAt: Date | null
  }
  stats: {
    schoolCount: number
    requestCount: number
    pendingCount: number
    approvedCount: number
    rejectedCount: number
    userCount: number
  }
  recentRequests: Request[]
}

export function SuperadminProfileClient({ user, stats, recentRequests }: Props) {
  const t = useT("superadminProfileClient")
  const tc = useT("profileCommon")

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }

  const statusStyle = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-700"
      case "APPROVED": return "bg-green-100 text-green-700"
      case "REJECTED": return "bg-red-100 text-red-700"
      default: return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-5xl">
      <ProfileHeader
        name={user.fullName}
        nameAr={user.fullNameAr}
        role={t("superadmin")}
        avatarLetter={user.fullName.charAt(0)}
        avatar={user.avatar || undefined}
        avatarColor="bg-red-600"
        roleColor="bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300"
      >
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Mail size={13} /> {user.email}</span>
          {user.phone && <span className="flex items-center gap-1"><Phone size={13} /> {user.phone}</span>}
          <span>· {t("memberSince")} {formatDate(user.createdAt, { month: "short", year: "numeric" })}</span>
          {user.lastLoginAt && <span>· {t("lastLogin")} {formatDate(user.lastLoginAt, { day: "2-digit", month: "short" })}</span>}
        </div>
      </ProfileHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard icon={School} label={t("schools")} value={stats.schoolCount} colorClass="text-tahfidz-green" delay={0.1} />
        <StatCard icon={Users} label={t("users")} value={stats.userCount} colorClass="text-blue-600" delay={0.2} />
        <StatCard icon={ClipboardList} label={t("requests")} value={stats.requestCount} colorClass="text-purple-600" delay={0.3} />
        <StatCard icon={Clock} label={t("pendingRequests")} value={stats.pendingCount} colorClass="text-yellow-600" delay={0.4} />
        <StatCard icon={CheckCircle2} label={t("approvedRequests")} value={stats.approvedCount} colorClass="text-green-600" delay={0.5} />
        <StatCard icon={XCircle} label={t("rejectedRequests")} value={stats.rejectedCount} colorClass="text-red-500" delay={0.6} />
      </div>

      <ProfileAccordion title={t("quickActions")} icon={Globe} defaultOpen delay={0.7}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { href: "/superadmin/audit", label: t("auditLogs"), icon: FileText, color: "bg-gray-50 dark:bg-gray-800 text-gray-600" },
            { href: "/superadmin/audit", label: t("manageSchools"), icon: School, color: "bg-tahfidz-green-light dark:bg-emerald-900/20 text-tahfidz-green" },
            { href: "/superadmin/audit", label: t("manageRequests"), icon: ClipboardList, color: "bg-purple-50 dark:bg-purple-900/20 text-purple-600" },
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

      <ProfileAccordion title={t("recentRequests")} icon={ClipboardList} delay={0.8}>
        {recentRequests.length === 0 ? (
          <p className="text-sm text-gray-400">{t("noRequest")}</p>
        ) : (
          <div className="space-y-2">
            {recentRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{req.schoolName}</p>
                  <p className="text-xs text-gray-500">
                    {[req.city, req.country].filter(Boolean).join(", ")} · {formatDate(req.createdAt, { day: "2-digit", month: "short" })}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle(req.status)}`}>
                    {req.status}
                  </span>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase">{req.plan}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ProfileAccordion>
    </motion.div>
  )
}
