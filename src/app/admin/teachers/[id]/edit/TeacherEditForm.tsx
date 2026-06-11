"use client"
// src/app/admin/teachers/[id]/edit/TeacherEditForm.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

interface InitialData {
  fullName: string
  fullNameAr: string
  email: string
  phone: string
  gender: string
  isActive: boolean
  specialization: string
  maxStudents: number
  bio: string
}

export function TeacherEditForm({ teacherId, initialData }: { teacherId: string; initialData: InitialData }) {
  const router = useRouter()
  const t = useT("teachers_2")
  const tNew = useT("teachers_new")

  const [form, setForm] = useState<InitialData>(initialData)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (field: keyof InitialData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const payload: any = { ...form }
      if (password.trim()) payload.password = password.trim()

      const res = await fetch(`/api/teachers/${teacherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || t("save"))
      }
      setSuccess(true)
      setTimeout(() => router.push(`/admin/teachers/${teacherId}`), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("save"))
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <CheckCircle2 size={56} className="text-tahfidz-green mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{t("save")}</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("edit")}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{form.fullName}</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">{error}</div>}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Identité */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tNew("identity")}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("fullName")}</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => handleChange("fullName", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("fullNameAr")}</label>
              <input
                type="text"
                dir="rtl"
                value={form.fullNameAr}
                onChange={(e) => handleChange("fullNameAr", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm arabic"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("gender")}</label>
              <select
                value={form.gender}
                onChange={(e) => handleChange("gender", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white"
              >
                <option value="">{tNew("choose")}</option>
                <option value="MALE">{tNew("male")}</option>
                <option value="FEMALE">{tNew("female")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("phone")}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => handleChange("isActive", e.target.checked)}
              className="w-4 h-4 text-tahfidz-green border-gray-300 rounded focus:ring-tahfidz-green"
            />
            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">{tNew("active") || t("active")}</label>
          </div>
        </div>

        {/* Profil */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tNew("profile")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("specialization")}</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => handleChange("specialization", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("maxCapacity")}</label>
            <input
              type="number"
              min={1}
              max={200}
              value={form.maxStudents}
              onChange={(e) => handleChange("maxStudents", parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("bio")}</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => handleChange("bio", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm resize-none"
            />
          </div>
        </div>

        {/* Compte */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100">{tNew("account")}</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{tNew("email")}</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm pr-10"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition">
            {t("cancel")}
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark disabled:opacity-50 transition flex items-center gap-2">
            {loading ? <><Loader2 size={15} className="animate-spin" />{t("save")}</> : t("save")}
          </button>
        </div>
      </form>
    </div>
  )
}
