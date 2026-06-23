"use client"

import { useState } from "react"
import { Edit, Users, Calendar, Video, PlusCircle, MinusCircle } from "lucide-react"
import { HalaqaQuotaModal } from "./HalaqaQuotaModal"

interface SchoolQuota {
  id: string
  name: string
  slug: string
  plan: string
  isActive: boolean
  billingCycle: string
  subscriptionStart: string
  halaqaMonthlyLimit: number | null
  halaqaBonusCredits: number
  halaqaBonusExpiry: string | null
  halaqaPlannedCount: number
  halaqaSessionsUsed: number
  halaqaUsagePeriodStart: string
  maxTeachers: number
  maxStudents: number
  halaqaMaxDuration: number
  halaqaAllowRecording: boolean
  totalUsers: number
}

interface SchoolsQuotaClientProps {
  schools: SchoolQuota[]
}

const planLabels: Record<string, string> = {
  FREE: "Gratuit",
  STARTER: "Starter",
  ECONOMIQUE: "Économique",
  PRO: "Pro",
  ENTERPRISE: "Enterprise",
}

const planColors: Record<string, string> = {
  FREE: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  STARTER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ECONOMIQUE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  PRO: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  ENTERPRISE: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

export function SchoolsQuotaClient({ schools: initialSchools }: SchoolsQuotaClientProps) {
  const [schools, setSchools] = useState<SchoolQuota[]>(initialSchools)
  const [selectedSchool, setSelectedSchool] = useState<SchoolQuota | null>(null)

  const handleSave = (updated: SchoolQuota) => {
    setSchools((prev) =>
      prev.map((s) => (s.id === updated.id ? { ...updated, totalUsers: s.totalUsers } : s))
    )
  }

  const quickBonus = async (schoolId: string, amount: number) => {
    try {
      const school = schools.find((s) => s.id === schoolId)
      if (!school) return

      const res = await fetch(`/api/admin/schools/${schoolId}/quota`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          halaqaBonusCredits: Math.max(0, school.halaqaBonusCredits + amount),
        }),
      })
      if (!res.ok) throw new Error("Erreur")
      const data = await res.json()
      handleSave({ ...school, ...data.status })
    } catch {
      alert("Erreur lors de la mise à jour des crédits bonus")
    }
  }

  const totalAllowed = (s: SchoolQuota) => {
    if (s.halaqaMonthlyLimit === null) return "∞"
    return s.halaqaMonthlyLimit + s.halaqaBonusCredits
  }

  const consumed = (s: SchoolQuota) => s.halaqaPlannedCount + s.halaqaSessionsUsed

  return (
    <>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">École</th>
                <th className="text-left px-4 py-3 font-medium">Plan</th>
                <th className="text-left px-4 py-3 font-medium">Cycle</th>
                <th className="text-left px-4 py-3 font-medium">Quota Halaqa</th>
                <th className="text-left px-4 py-3 font-medium">Durée max</th>
                <th className="text-left px-4 py-3 font-medium">Limites</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${planColors[s.plan]}`}>
                      {planLabels[s.plan]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {s.billingCycle === "MONTHLY" ? "Mensuel" : "Annuel"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Video size={14} className="text-tahfidz-green" />
                      <span className="text-gray-700 dark:text-gray-300">
                        {consumed(s)} / {totalAllowed(s)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({s.halaqaPlannedCount} plan. + {s.halaqaSessionsUsed} used)
                      </span>
                    </div>
                    {s.halaqaBonusCredits > 0 && (
                      <p className="text-[10px] text-tahfidz-green mt-0.5">
                        +{s.halaqaBonusCredits} bonus
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {s.halaqaMaxDuration} min
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {s.maxTeachers} profs / {s.maxStudents} élèves
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> {s.halaqaAllowRecording ? "Enreg. activé" : "Sans enreg."}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => quickBonus(s.id, 1)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green/10 transition"
                        title="+1 crédit bonus"
                      >
                        <PlusCircle size={16} />
                      </button>
                      <button
                        onClick={() => quickBonus(s.id, -1)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                        title="-1 crédit bonus"
                      >
                        <MinusCircle size={16} />
                      </button>
                      <button
                        onClick={() => setSelectedSchool(s)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-tahfidz-green hover:bg-tahfidz-green/10 transition"
                        title="Modifier le quota"
                      >
                        <Edit size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {schools.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Aucune école trouvée.
          </div>
        )}
      </div>

      {selectedSchool && (
        <HalaqaQuotaModal
          school={selectedSchool}
          onClose={() => setSelectedSchool(null)}
          onSave={handleSave}
        />
      )}
    </>
  )
}
