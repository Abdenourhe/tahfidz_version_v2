"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
import { ArrowLeft, Printer, RefreshCw, Loader2, AlertCircle, QrCode } from "lucide-react"

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
  regenerate:    { fr: "Régénérer", en: "Regenerate", ar: "إعادة إنشاء" },
  regenerateInfo:{ fr: "En cas de perte ou vol, régénérez le secret pour invalider l'ancienne carte.", en: "In case of loss or theft, regenerate the secret to invalidate the old card.", ar: "في حالة الفقدان أو السرقة، أعد إنشاء السر لإبطال البطاقة القديمة." },
  scanInfo:      { fr: "Scannez pour valider la présence", en: "Scan to validate attendance", ar: "امسح لتسجيل الحضور" },
  validToday:    { fr: "Valable aujourd'hui", en: "Valid today", ar: "صالح لهذا اليوم" },
  studentCode:   { fr: "Code élève", en: "Student code", ar: "رمز الطالب" },
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

  const fetchCard = useCallback(async () => {
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
  }, [id])

  useEffect(() => {
    fetchCard()
  }, [fetchCard])

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
  const logoUrl = school.logo || "/images/logo_icon.png"

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8" dir={dir}>
      {/* En-tête */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50 rounded-xl transition disabled:opacity-50"
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

      {/* Carte professionnelle */}
      <div
        id="student-qr-card"
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden print:shadow-none print:border-2 print:border-tahfidz-green print:rounded-none print:w-[86mm] print:h-[54mm]"
        style={{ aspectRatio: "1.586" }}
      >
        {/* Bandeau supérieur */}
        <div className="bg-gradient-to-r from-tahfidz-green to-emerald-600 text-white px-6 py-4 md:px-8 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl p-1 flex items-center justify-center overflow-hidden">
              <Image src={logoUrl} alt={school.name} width={40} height={40} className="object-contain" unoptimized />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold leading-tight">{school.name}</h1>
              <p className="text-[10px] md:text-xs text-white/80 uppercase tracking-wider">{school.slug}</p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-[10px] md:text-xs text-white/80 uppercase tracking-wider">{t("studentCode", L)}</p>
            <p className="font-mono font-bold text-sm md:text-base">{student.studentCode}</p>
          </div>
        </div>

        {/* Corps */}
        <div className="px-6 py-5 md:px-8 md:py-6 flex items-center gap-4 md:gap-8">
          {/* Photo */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 shadow-inner">
            {student.avatar ? (
              <Image src={student.avatar} alt={student.fullName} width={128} height={128} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-4xl md:text-5xl font-bold text-gray-300">{student.fullName.charAt(0)}</span>
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">{student.fullName}</h2>
            {student.fullNameAr && <p className="text-base md:text-lg text-gray-500 dark:text-gray-400 arabic mt-0.5">{student.fullNameAr}</p>}

            <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4">
              <div>
                <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{t("group", L)}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base">{student.group?.name || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider">{t("teacher", L)}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm md:text-base truncate">{student.teacher?.user?.fullName || "—"}</p>
              </div>
            </div>
          </div>

          {/* QR Code avec logo */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
              <QRCodeSVG
                value={qrCodeUrl}
                size={120}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: logoUrl,
                  height: 28,
                  width: 28,
                  excavate: true,
                }}
              />
            </div>
            <p className="text-[10px] text-gray-400 text-center max-w-[120px] leading-tight">{t("scanInfo", L)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-2 md:px-8 md:py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[10px] md:text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <QrCode size={12} className="text-tahfidz-green" />
            {t("validToday", L)}
          </span>
          <span>{new Date(generatedAt).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR")}</span>
        </div>
      </div>

      {/* Note */}
      <p className="mt-6 text-sm text-gray-500 print:hidden">
        💡 {t("regenerateInfo", L)}
      </p>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #student-qr-card,
          #student-qr-card * {
            visibility: visible;
          }
          #student-qr-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 86mm;
            height: 54mm;
            margin: 0;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
