"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import { useLanguage } from "@/contexts/LanguageContext"
import Image from "next/image"
import { ArrowLeft, Printer, RefreshCw, Loader2, AlertCircle } from "lucide-react"

interface CardData {
  student: {
    id: string
    studentCode: string
    fullName: string
    fullNameAr?: string | null
    avatar?: string | null
    email?: string | null
    phone?: string | null
    isActive: boolean
    group?: { name?: string | null; nameAr?: string | null; level?: string | null } | null
    teacher?: { user?: { fullName?: string | null } } | null
  }
  school: {
    name: string
    logo?: string | null
    slug: string
    city?: string | null
    address?: string | null
    phone?: string | null
  }
  qrCodeUrl: string
  generatedAt: string
}

const TEXTS: Record<string, Record<string, string>> = {
  title:         { fr: "Carte étudiant", en: "Student card", ar: "بطاقة الطالب" },
  back:          { fr: "Retour", en: "Back", ar: "عودة" },
  print:         { fr: "Imprimer", en: "Print", ar: "طباعة" },
  regenerate:    { fr: "Régénérer le secret", en: "Regenerate secret", ar: "إعادة إنشاء السر" },
  regenerateInfo:{ fr: "À utiliser en cas de perte ou vol de la carte.", en: "Use in case of loss or theft.", ar: "يُستخدم في حالة فقدان أو سرقة البطاقة." },
  scanInfo:      { fr: "Scannez ce code pour valider la présence.", en: "Scan this code to validate attendance.", ar: "امسح هذا الرمز لتسجيل الحضور." },
  validToday:    { fr: "QR valable aujourd'hui uniquement", en: "QR valid today only", ar: "الرمز صالح لهذا اليوم فقط" },
  studentCode:   { fr: "Code", en: "Code", ar: "الرمز" },
  group:         { fr: "Groupe", en: "Group", ar: "المجموعة" },
  teacher:       { fr: "Enseignant", en: "Teacher", ar: "المعلم" },
  loading:       { fr: "Chargement...", en: "Loading...", ar: "جاري التحميل..." },
  error:         { fr: "Erreur", en: "Error", ar: "خطأ" },
}

function t(key: string, locale: string): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

export default function StudentCardPage() {
  const params = useParams()
  const id = params.id as string
  const { locale, dir } = useLanguage()
  const L = locale
  const isRTL = dir === "rtl"

  const [data, setData] = useState<CardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    const fetchCard = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/students/${id}/card`)
        if (!res.ok) throw new Error("Impossible de charger la carte")
        const json = await res.json()
        setData(json)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erreur inconnue")
      } finally {
        setLoading(false)
      }
    }

    fetchCard()
  }, [id])

  const handleRegenerate = async () => {
    if (!confirm(t("regenerateInfo", L))) return
    try {
      setRegenerating(true)
      const res = await fetch(`/api/admin/students/${id}/qr-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regenerateSecret: true }),
      })
      if (!res.ok) throw new Error("Échec de la régénération")
      await fetchCard()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue")
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-tahfidz-green" size={32} />
        <span className="ms-3 text-gray-600">{t("loading", L)}</span>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-700 dark:text-red-300 flex items-start gap-3">
        <AlertCircle size={20} />
        <div>
          <p className="font-semibold">{t("error", L)}</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  const { student, school, qrCodeUrl, generatedAt } = data

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8" dir={dir}>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <Link
          href={`/admin/students/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-tahfidz-green transition"
        >
          <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
          {t("back", L)}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-xl transition disabled:opacity-50"
          >
            {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {t("regenerate", L)}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-tahfidz-green hover:bg-tahfidz-green/90 rounded-xl transition"
          >
            <Printer size={16} />
            {t("print", L)}
          </button>
        </div>
      </div>

      {/* Carte */}
      <div
        id="student-qr-card"
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden print:shadow-none print:border-2 print:border-tahfidz-green print:rounded-none"
      >
        {/* En-tête carte */}
        <div className="bg-tahfidz-green text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {school.logo ? (
              <Image src={school.logo} alt={school.name} width={56} height={56} className="object-contain bg-white rounded-lg p-1" unoptimized />
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded-lg flex items-center justify-center text-2xl font-bold">
                {school.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">{school.name}</h1>
              <p className="text-xs text-white/80">{school.slug}</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-white/80 uppercase tracking-wider">{t("studentCode", L)}</p>
            <p className="font-mono font-semibold">{student.studentCode}</p>
          </div>
        </div>

        {/* Corps carte */}
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Photo */}
            <div className="w-32 h-40 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
              {student.avatar ? (
                <Image src={student.avatar} alt={student.fullName} width={128} height={160} className="w-full h-full object-cover" unoptimized />
              ) : (
                <span className="text-4xl font-bold text-gray-300">{student.fullName.charAt(0)}</span>
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 text-center md:text-start">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{student.fullName}</h2>
              {student.fullNameAr && <p className="text-lg text-gray-600 dark:text-gray-400 arabic mt-1">{student.fullNameAr}</p>}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 text-start">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t("group", L)}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{student.group?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{t("teacher", L)}</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-200">{student.teacher?.user?.fullName || "—"}</p>
                </div>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-2">
              <div className="bg-white p-3 rounded-xl border-2 border-gray-200 dark:border-gray-700">
                <QRCodeSVG value={qrCodeUrl} size={160} level="H" />
              </div>
              <p className="text-xs text-gray-500 text-center max-w-[180px]">{t("scanInfo", L)}</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium">
                {t("validToday", L)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t border-gray-200 dark:border-gray-800 text-center text-xs text-gray-500">
          {t("validToday", L)} · {new Date(generatedAt).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR")}
        </div>
      </div>

      {/* Instructions d'impression */}
      <div className="mt-6 text-sm text-gray-500 print:hidden">
        <p>💡 {t("regenerateInfo", L)}</p>
      </div>
    </div>
  )
}
