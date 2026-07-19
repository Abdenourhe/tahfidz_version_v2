"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Image from "next/image"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { Loader2, AlertCircle, CheckCircle, User, Users, X, ShieldCheck } from "lucide-react"

function VerifyContent() {
  const { dir } = useLanguage()
  const t = useT("teacherScan")
  const router = useRouter()
  const searchParams = useSearchParams()
  const encoded = searchParams.get("d")

  const [student, setStudent] = useState<{ id: string; fullName: string; avatar?: string | null; groupName?: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    if (!encoded) {
      setError(t("invalidCode"))
      setLoading(false)
      return
    }

    fetch(`/api/teacher/scan/verify?d=${encodeURIComponent(encoded)}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok || !data.valid) {
          throw new Error(data.error || t("invalidCode"))
        }
        setStudent(data.student)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [encoded, t])

  const handleConfirm = async () => {
    if (!encoded) return
    try {
      setConfirming(true)
      const res = await fetch("/api/teacher/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: encoded }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || t("verifyError"))
      setConfirmed(true)
      setTimeout(() => router.push("/teacher/scan"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("verifyError"))
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-tahfidz-green mb-3" />
        <p className="text-gray-600">{t("verifying")}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-6 bg-red-50 dark:bg-red-900/20 rounded-3xl text-center">
        <AlertCircle size={48} className="text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-700 dark:text-red-300">{t("verifyError")}</h2>
        <p className="text-red-600 dark:text-red-200 mt-1">{error}</p>
        <button
          onClick={() => router.push("/teacher/scan")}
          className="mt-5 px-5 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition"
        >
          {t("back")}
        </button>
      </div>
    )
  }

  if (confirmed) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-8 bg-green-50 dark:bg-green-900/20 rounded-3xl text-center">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle size={36} className="text-green-600 dark:text-green-300" />
        </div>
        <h2 className="text-xl font-bold text-green-700 dark:text-green-300">{t("success")}</h2>
        <p className="text-green-600 dark:text-green-200 mt-1">{student?.fullName}</p>
      </div>
    )
  }

  return (
    <div className="max-w-sm mx-auto p-4" dir={dir}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-4 ring-4 ring-tahfidz-green/10">
          {student?.avatar ? (
            <Image src={student.avatar} alt={student.fullName} width={80} height={80} className="w-full h-full object-cover" unoptimized />
          ) : (
            <User size={36} className="text-gray-400" />
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tahfidz-green/10 text-tahfidz-green text-xs font-medium mb-3">
          <ShieldCheck size={12} />
          {t("student")}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student?.fullName}</h2>

        {student?.groupName && (
          <div className="flex items-center justify-center gap-2 mt-2 text-gray-500">
            <Users size={16} />
            <span>{student.groupName}</span>
          </div>
        )}

        <div className="mt-8 space-y-3">
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-3.5 px-4 bg-tahfidz-green hover:bg-tahfidz-green/90 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {confirming ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            {t("confirm")}
          </button>
          <button
            onClick={() => router.push("/teacher/scan")}
            className="w-full py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2"
          >
            <X size={18} />
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TeacherScanVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 size={40} className="animate-spin text-tahfidz-green mb-3" />
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  )
}
