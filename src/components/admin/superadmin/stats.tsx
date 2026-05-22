"use client"
import { Building2, CheckCircle2, Ban, Clock, TrendingUp, BarChart3, Users, GraduationCap, BookOpen } from "lucide-react"
import { School, SchoolRequest } from "./types"

export function SuperAdminStats({
  schools,
  requests,
}: {
  schools: School[]
  requests: SchoolRequest[]
}) {
  const pending = requests.filter(r => r.status === "PENDING")
  const active = schools.filter(s => s.isActive).length
  const inactive = schools.filter(s => !s.isActive).length
  const totalUsers = schools.reduce((n, s) => n + s._count.users, 0)
  const totalStudents = schools.reduce((n, s) => n + s.users.filter(u => u.role === "STUDENT").length, 0)
  const totalTeachers = schools.reduce((n, s) => n + s.users.filter(u => u.role === "TEACHER").length, 0)
  const planCounts = schools.reduce<Record<string, number>>((acc, s) => {
    acc[s.plan] = (acc[s.plan] || 0) + 1
    return acc
  }, {})
  const prices: Record<string, number> = { FREE: 0, STARTER: 29, PRO: 79, ENTERPRISE: 199 }
  const mrr = Object.entries(planCounts).reduce((sum, [plan, count]) => sum + (prices[plan] || 0) * count, 0)

  return (
    <>
      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Ecoles totales", value: schools.length, color: "text-tahfidz-green", bg: "bg-tahfidz-green-light dark:bg-emerald-900/30", icon: <Building2 size={16} /> },
          { label: "Actives", value: active, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/30", icon: <CheckCircle2 size={16} /> },
          { label: "Inactives", value: inactive, color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/30", icon: <Ban size={16} /> },
          { label: "En attente", value: pending.length, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/30", icon: <Clock size={16} /> },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
            <div className={`${s.bg} ${s.color} p-2.5 rounded-lg`}>{s.icon}</div>
            <div><p className={`text-2xl font-bold ${s.color}`}>{s.value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p></div>
          </div>
        ))}
      </div>

      {/* Stats financieres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><TrendingUp size={15} className="text-tahfidz-green" /><span className="text-sm text-gray-600 dark:text-gray-300">MRR estimé</span></div>
          <span className="text-xl font-bold text-tahfidz-green">{mrr}€/mois</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><BarChart3 size={15} className="text-tahfidz-purple" /><span className="text-sm text-gray-600 dark:text-gray-300">ARR estimé</span></div>
          <span className="text-xl font-bold text-tahfidz-purple">{mrr * 12}€/an</span>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><Users size={15} className="text-blue-500" /><span className="text-sm text-gray-600 dark:text-gray-300">ARPU estimé</span></div>
          <span className="text-xl font-bold text-blue-500">{schools.length > 0 ? (mrr / schools.length).toFixed(1) : "0"}€/ecole</span>
        </div>
      </div>

      {/* Stats secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Utilisateurs totaux", value: totalUsers, color: "text-tahfidz-purple", icon: <Users size={15} /> },
          { label: "Eleves (toutes ecoles)", value: totalStudents, color: "text-tahfidz-green", icon: <GraduationCap size={15} /> },
          { label: "Enseignants", value: totalTeachers, color: "text-blue-500", icon: <BookOpen size={15} /> },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2"><span className={s.color}>{s.icon}</span><span className="text-sm text-gray-600 dark:text-gray-300">{s.label}</span></div>
            <span className={`text-xl font-bold ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Plans distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Repartition des plans</p>
        <div className="flex gap-3 flex-wrap">
          {[
            { plan: "FREE", color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300" },
            { plan: "STARTER", color: "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" },
            { plan: "PRO", color: "bg-tahfidz-purple-light text-tahfidz-purple dark:bg-purple-900/30 dark:text-purple-400" },
            { plan: "ENTERPRISE", color: "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" },
          ].map(({ plan, color }) => (
            <div key={plan} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${color}`}>
              <span className="text-xs font-bold">{plan}</span>
              <span className="text-lg font-bold">{planCounts[plan] ?? 0}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
