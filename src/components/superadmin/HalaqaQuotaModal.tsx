"use client"

import { useState } from "react"
import { X, Save, Loader2 } from "lucide-react"

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

interface HalaqaQuotaModalProps {
  school: SchoolQuota
  onClose: () => void
  onSave: (updated: SchoolQuota) => void
}

export function HalaqaQuotaModal({ school, onClose, onSave }: HalaqaQuotaModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<SchoolQuota>({ ...school })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/schools/${school.id}/quota`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: form.plan,
          billingCycle: form.billingCycle,
          subscriptionStart: form.subscriptionStart,
          halaqaMonthlyLimit: form.halaqaMonthlyLimit,
          halaqaBonusCredits: form.halaqaBonusCredits,
          halaqaBonusExpiry: form.halaqaBonusExpiry,
          halaqaPlannedCount: form.halaqaPlannedCount,
          halaqaSessionsUsed: form.halaqaSessionsUsed,
          halaqaUsagePeriodStart: form.halaqaUsagePeriodStart,
          maxTeachers: form.maxTeachers,
          maxStudents: form.maxStudents,
          halaqaMaxDuration: form.halaqaMaxDuration,
          halaqaAllowRecording: form.halaqaAllowRecording,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur")
      onSave({ ...form })
      onClose()
    } catch (err: any) {
      alert(err.message || "Erreur lors de la mise à jour")
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-tahfidz-green/50 focus:border-tahfidz-green outline-none"
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quota Halaqa</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{school.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Plan</label>
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className={inputClass}
              >
                <option value="FREE">Gratuit</option>
                <option value="STARTER">Starter</option>
                <option value="ECONOMIQUE">Économique</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Cycle de facturation</label>
              <select
                value={form.billingCycle}
                onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                className={inputClass}
              >
                <option value="MONTHLY">Mensuel</option>
                <option value="YEARLY">Annuel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Quota mensuel Halaqa</label>
              <input
                type="number"
                min={0}
                value={form.halaqaMonthlyLimit ?? ""}
                onChange={(e) => setForm({ ...form, halaqaMonthlyLimit: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="Illimité"
                className={inputClass}
              />
              <p className="text-[10px] text-gray-400 mt-1">Vide = illimité</p>
            </div>
            <div>
              <label className={labelClass}>Crédits bonus</label>
              <input
                type="number"
                min={0}
                value={form.halaqaBonusCredits}
                onChange={(e) => setForm({ ...form, halaqaBonusCredits: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Expiration bonus</label>
              <input
                type="datetime-local"
                value={form.halaqaBonusExpiry ? new Date(form.halaqaBonusExpiry).toISOString().slice(0, 16) : ""}
                onChange={(e) => setForm({ ...form, halaqaBonusExpiry: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Planifiées</label>
              <input
                type="number"
                min={0}
                value={form.halaqaPlannedCount}
                onChange={(e) => setForm({ ...form, halaqaPlannedCount: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Utilisées</label>
              <input
                type="number"
                min={0}
                value={form.halaqaSessionsUsed}
                onChange={(e) => setForm({ ...form, halaqaSessionsUsed: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max enseignants</label>
              <input
                type="number"
                min={1}
                value={form.maxTeachers}
                onChange={(e) => setForm({ ...form, maxTeachers: parseInt(e.target.value) || 1 })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Max élèves</label>
              <input
                type="number"
                min={1}
                value={form.maxStudents}
                onChange={(e) => setForm({ ...form, maxStudents: parseInt(e.target.value) || 1 })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Durée max Halaqa (min)</label>
              <input
                type="number"
                min={5}
                value={form.halaqaMaxDuration}
                onChange={(e) => setForm({ ...form, halaqaMaxDuration: parseInt(e.target.value) || 30 })}
                className={inputClass}
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.halaqaAllowRecording}
                  onChange={(e) => setForm({ ...form, halaqaAllowRecording: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green/50"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Autoriser l&apos;enregistrement</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-tahfidz-green hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-60"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
