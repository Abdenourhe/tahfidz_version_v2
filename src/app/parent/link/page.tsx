"use client"
// src/app/parent/link/page.tsx

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Link2, CheckCircle2, ArrowLeft } from "lucide-react"
import { useT } from "@/contexts/LanguageContext"

export default function ParentLinkPage() {
  const router = useRouter()

    const t = useT("link")

  const [studentCode, setStudentCode] = useState("")
  const [relation, setRelation] = useState<"father" | "mother" | "guardian">("father")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linked, setLinked] = useState<{ fullName: string; fullNameAr?: string | null } | null>(null)

  const handleLink = async () => {
    if (!studentCode.trim()) {
      setError(t("errorCode"))
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/parent/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentCode: studentCode.trim().toUpperCase(), relation }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t("error"))
      setLinked(data.student)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"))
    } finally {
      setLoading(false)
    }
  }

  if (linked) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 rounded-2xl gradient-tahfidz flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={40} className="text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">{t("linked")} 🎉</h2>
          <p className="text-gray-500 mb-2">{t("linkedTo")}</p>
          <p className="text-lg font-bold text-tahfidz-green">{linked.fullName}</p>
          {linked.fullNameAr && <p className="arabic text-gray-500 mt-1">{linked.fullNameAr}</p>}
          <button onClick={() => router.push("/parent/dashboard")}
            className="mt-6 w-full py-3 gradient-tahfidz text-white font-semibold rounded-xl hover:opacity-90 transition">
            {t("viewDashboard")} →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
          <p className="text-sm text-gray-500">{t("subtitle")}</p>
        </div>
      </div>

      <div className="bg-tahfidz-green-light dark:bg-emerald-900/20 border border-tahfidz-green/20 dark:border-emerald-800 rounded-xl p-5">
        <div className="flex gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="text-sm font-medium text-tahfidz-green mb-1">{t("howTo")}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t("howToDesc")}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("codeLabel")}</label>
            <input
              type="text"
              value={studentCode}
              onChange={e => setStudentCode(e.target.value.toUpperCase())}
              placeholder="TP-XXXXXX"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm font-mono tracking-widest"
            />
            <p className="text-xs text-gray-400 mt-1">{t("codeHint")}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{t("relation")}</label>
            <select value={relation} onChange={e => setRelation(e.target.value as "father" | "mother" | "guardian")}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-tahfidz-green text-sm bg-white">
              <option value="father">{t("father")}</option>
              <option value="mother">{t("mother")}</option>
              <option value="guardian">{t("guardian")}</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button onClick={handleLink} disabled={loading}
            className="w-full py-3 bg-tahfidz-green text-white font-semibold rounded-xl hover:bg-tahfidz-green-dark transition disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" />{t("verifying")}</> : <><Link2 size={18} />{t("link")}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
