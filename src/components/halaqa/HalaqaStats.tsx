// src/components/halaqa/HalaqaStats.tsx
// Dashboard stats Halaqa pour l'admin

"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { BarChart3, CheckCircle, XCircle, Calendar, TrendingUp, Users, Award } from "lucide-react"

interface HalaqaStatsData {
  total: number
  scheduledCount: number
  liveCount: number
  endedCount: number
  cancelledCount: number
  completionRate: number
  cancellationRate: number
  currentMonthCount: number
  lastMonthCount: number
  byTeacher: { name: string; count: number }[]
  byMonth: Record<string, number>
  avgMemorization: number | null
  avgTajweed: number | null
  avgFluency: number | null
  evaluationsCount: number
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function HalaqaStats() {
  const [stats, setStats] = useState<HalaqaStatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/halaqa/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Chargement des statistiques…</div>
  }

  if (!stats || stats.total === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center text-gray-500 dark:text-gray-400">
        <BarChart3 size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-700" />
        <p>Pas assez de données pour afficher les statistiques.</p>
      </div>
    )
  }

  const statusData = [
    { name: "Planifiées", value: stats.scheduledCount, color: "#3b82f6" },
    { name: "En direct", value: stats.liveCount, color: "#ef4444" },
    { name: "Terminées", value: stats.endedCount, color: "#10b981" },
    { name: "Annulées", value: stats.cancelledCount, color: "#f59e0b" },
  ].filter((d) => d.value > 0)

  const monthData = Object.entries(stats.byMonth)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, count]) => ({ month, count }))

  const teacherData = stats.byTeacher.slice(0, 5)

  const StatCard = ({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string | number; sub?: string }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-tahfidz-green">
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
          {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Cartes résumé */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle} label="Taux de réalisation" value={`${stats.completionRate}%`} sub={`${stats.endedCount} terminées`} />
        <StatCard icon={XCircle} label="Taux d'annulation" value={`${stats.cancellationRate}%`} sub={`${stats.cancelledCount} annulées`} />
        <StatCard icon={Calendar} label="Ce mois" value={stats.currentMonthCount} sub={`Mois dernier : ${stats.lastMonthCount}`} />
        <StatCard icon={Award} label="Évaluations" value={stats.evaluationsCount} sub={`Moy. mémorisation ${stats.avgMemorization ?? "—"}`} />
      </div>

      {/* Moyennes */}
      {stats.evaluationsCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "Mémorisation", value: stats.avgMemorization, icon: Award },
            { label: "Tajwîd", value: stats.avgTajweed, icon: TrendingUp },
            { label: "Fluidité", value: stats.avgFluency, icon: TrendingUp },
          ].map((item) => (
            <div key={item.label} className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <item.icon size={16} />
                  <span className="text-sm">{item.label}</span>
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">{item.value ?? "—"}/100</span>
              </div>
              <div className="mt-3 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-tahfidz-green rounded-full"
                  style={{ width: `${Math.min(100, item.value ?? 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition par statut */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-tahfidz-green" />
            Répartition par statut
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-2 justify-center">
            {statusData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Sessions par mois */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-tahfidz-green" />
            Sessions par mois
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top enseignants */}
      {teacherData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={16} className="text-tahfidz-green" />
            Top enseignants
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teacherData} layout="vertical">
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
