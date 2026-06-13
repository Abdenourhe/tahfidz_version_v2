"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import {
  Building2, Users, GraduationCap, UserCheck, Clock,
  Shield, ArrowRight, Activity, Send, BookOpen,
} from "lucide-react"
import { useLanguage } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

interface School {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  createdAt: string | Date
  _count?: { users: number }
}

interface SchoolRequest {
  id: string
  schoolName: string
  adminEmail: string
  adminName: string
  status: "PENDING" | "APPROVED" | "REJECTED"
  createdAt: string | Date
}

interface Props {
  userName: string
  stats: {
    totalSchools: number
    activeSchools: number
    inactiveSchools: number
    totalStudents: number
    totalTeachers: number
    totalParents: number
    pendingRequests: number
  }
  recentSchools: School[]
  pendingRequests: SchoolRequest[]
}

export function SuperAdminDashboardClient({ userName, stats, recentSchools, pendingRequests }: Props) {
  const { useT } = useLanguage()
  const t = (k: string) => useT("library", k)

  const statCards = [
    { label: "Écoles totales", value: stats.totalSchools, icon: Building2, color: "bg-blue-100 text-blue-600", href: "/admin/super/schools" },
    { label: "Écoles actives", value: stats.activeSchools, icon: Shield, color: "bg-emerald-100 text-emerald-600", href: "/admin/super/schools" },
    { label: "Élèves", value: stats.totalStudents, icon: GraduationCap, color: "bg-indigo-100 text-indigo-600", href: "/admin/super/schools" },
    { label: "Enseignants", value: stats.totalTeachers, icon: UserCheck, color: "bg-amber-100 text-amber-600", href: "/admin/super/schools" },
    { label: "Parents", value: stats.totalParents, icon: Users, color: "bg-rose-100 text-rose-600", href: "/admin/super/schools" },
    { label: "Demandes en attente", value: stats.pendingRequests, icon: Clock, color: "bg-orange-100 text-orange-600", href: "/admin/super/requests" },
  ]

  const quickLinks = [
    { label: "Gérer les écoles", href: "/admin/super/schools", icon: Building2, color: "bg-blue-50 text-blue-600" },
    { label: "Bibliothèque globale", href: "/admin/super/library", icon: BookOpen, color: "bg-purple-50 text-purple-600" },
    { label: "Broadcast", href: "/admin/super/broadcast", icon: Send, color: "bg-emerald-50 text-emerald-600" },
    { label: "Santé système", href: "/admin/super/health", icon: Activity, color: "bg-red-50 text-red-600" },
  ]

  return (
    <motion.div className="space-y-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500/10 to-orange-500/10 dark:from-red-500/15 dark:to-orange-500/15 border border-gray-100 dark:border-gray-800 p-8 md:p-12">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-xs font-medium text-red-600 mb-4">
            <Shield size={14} /> Superadmin
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
            Bonjour, {userName}
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-300 max-w-xl">
            Gérez les écoles, les demandes d&apos;inscription et les ressources globales de la plateforme TAHFIDZ.
          </p>
        </div>
      </section>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <Link
              href={card.href}
              className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 card-hover h-full"
            >
              <div className={`inline-flex p-3 rounded-xl ${card.color} mb-4`}>
                <card.icon size={24} />
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{card.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Quick links */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Accès rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, i) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Link
                href={link.href}
                className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 card-hover h-full"
              >
                <div className={cn("p-3 rounded-xl", link.color)}>
                  <link.icon size={22} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 dark:text-gray-100">{link.label}</div>
                </div>
                <ArrowRight size={16} className="text-gray-400" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent schools */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Dernières écoles</h2>
            <Link href="/admin/super/schools" className="text-sm text-red-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {recentSchools.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune école pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {recentSchools.map((school) => (
                <div key={school.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{school.name}</p>
                    <p className="text-xs text-gray-500">{school.slug} · {new Date(school.createdAt).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    school.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                  )}>
                    {school.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Pending requests */}
        <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Demandes en attente</h2>
            <Link href="/admin/super/requests" className="text-sm text-red-600 hover:underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {pendingRequests.length === 0 ? (
            <p className="text-gray-400 text-sm">Aucune demande en attente.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/20">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{req.schoolName}</p>
                    <p className="text-xs text-gray-500">{req.adminName} · {req.adminEmail}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                    En attente
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </motion.div>
  )
}
