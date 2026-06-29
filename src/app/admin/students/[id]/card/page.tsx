"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import Image from "next/image"
import { useLanguage } from "@/contexts/LanguageContext"
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
  regenerate:    { fr: "Régénérer", en: "Regenerate", ar: "إعادة إنشاء" },
  regenerateInfo:{ fr: "En cas de perte ou vol, régénérez le secret pour invalider l'ancienne carte.", en: "In case of loss or theft, regenerate the secret to invalidate the old card.", ar: "في حالة الفقدان أو السرقة، أعد إنشاء السر لإبطال البطاقة القديمة." },
  scanInfo:      { fr: "Scannez pour valider la présence", en: "Scan to validate attendance", ar: "امسح لتسجيل الحضور" },
  validToday:    { fr: "Valable aujourd'hui", en: "Valid today", ar: "صالح لهذا اليوم" },
  studentCode:   { fr: "N° d'identification", en: "Student ID", ar: "رقم التعريف" },
  group:         { fr: "Groupe", en: "Group", ar: "المجموعة" },
  teacher:       { fr: "Enseignant", en: "Teacher", ar: "المعلم" },
  loading:       { fr: "Chargement...", en: "Loading...", ar: "جاري التحميل..." },
  error:         { fr: "Erreur", en: "Error", ar: "خطأ" },
  cardTitle:     { fr: "CARTE D'ÉTUDIANT", en: "STUDENT CARD", ar: "بطاقة الطالب" },
  issuedOn:      { fr: "Émise le", en: "Issued on", ar: "تاريخ الإصدار" },
  previewInfo:   { fr: "Format d'impression : 86 × 54 mm (taille carte de crédit)", en: "Print format: 86 × 54 mm (credit card size)", ar: "تنسيق الطباعة: 86 × 54 ملم (حجم بطاقة الائتمان)" },
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
  const displayDate = new Date(generatedAt).toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR")

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8" dir={dir}>
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

      <p className="text-center text-sm text-gray-500 mb-6 print:hidden">
        {t("previewInfo", L)}
      </p>

      {/* Conteneur centré pour la prévisualisation (échelle ×1.5 à l'écran) */}
      <div className="flex justify-center print:block">
        <div
          className="print:hidden flex items-center justify-center"
          style={{ width: "129mm", height: "81mm", backgroundColor: "#f3f4f6", borderRadius: "4mm" }}
        >
          <div
            style={{
              width: "86mm",
              height: "54mm",
              transform: "scale(1.5)",
              transformOrigin: "center center",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <StudentCardContent
              student={student}
              school={school}
              qrCodeUrl={qrCodeUrl}
              displayDate={displayDate}
              locale={L}
              logoUrl={logoUrl}
            />
          </div>
        </div>

        {/* Version imprimable */}
        <div className="hidden print:block">
          <div id="student-qr-card" style={{ width: "86mm", height: "54mm" }}>
            <StudentCardContent
              student={student}
              school={school}
              qrCodeUrl={qrCodeUrl}
              displayDate={displayDate}
              locale={L}
              logoUrl={logoUrl}
            />
          </div>
        </div>
      </div>

      {/* Note */}
      <p className="mt-6 text-sm text-gray-500 print:hidden text-center max-w-2xl mx-auto">
        💡 {t("regenerateInfo", L)}
      </p>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          @page {
            size: 86mm 54mm;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #student-qr-card,
          #student-qr-card * {
            visibility: visible !important;
          }
          #student-qr-card {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 86mm !important;
            height: 54mm !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            overflow: hidden !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function StudentCardContent({
  student,
  school,
  qrCodeUrl,
  displayDate,
  locale,
  logoUrl,
}: {
  student: CardData["student"]
  school: CardData["school"]
  qrCodeUrl: string
  displayDate: string
  locale: string
  logoUrl: string
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: "86mm",
        height: "54mm",
        backgroundColor: "#ffffff",
        color: "#1f2937",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Bandeau supérieur */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{ height: "10mm", backgroundColor: "#1e1b4b" }}
      >
        <span
          className="font-bold uppercase"
          style={{ color: "#ffffff", fontSize: "3.2mm", letterSpacing: "0.22em", lineHeight: 1 }}
        >
          {t("cardTitle", locale)}
        </span>
      </div>

      {/* Logo école */}
      <div
        className="absolute flex items-center justify-center overflow-hidden"
        style={{
          left: "4mm",
          top: "11mm",
          width: "7.5mm",
          height: "7.5mm",
          backgroundColor: "#ffffff",
          borderRadius: "50%",
          boxShadow: "0 0 0 0.4mm rgba(0,0,0,0.08)",
        }}
      >
        <Image src={logoUrl} alt={school.name} width={64} height={64} className="object-contain w-full h-full" unoptimized />
      </div>

      {/* Nom école + slug + ville */}
      <div
        className="absolute"
        style={{ right: "4mm", top: "11mm", maxWidth: "46mm", textAlign: "right" }}
      >
        <p className="truncate" style={{ color: "#1f2937", fontWeight: 700, fontSize: "2.6mm", lineHeight: 1.2 }}>
          {school.name}
        </p>
        <p className="truncate" style={{ color: "#4b5563", fontSize: "1.8mm", lineHeight: 1.2, marginTop: "0.3mm" }}>
          {school.slug}
        </p>
        {school.city && (
          <p className="truncate" style={{ color: "#6b7280", fontSize: "2mm", lineHeight: 1.2, marginTop: "0.3mm" }}>
            {school.city}
          </p>
        )}
      </div>

      {/* Photo de l'étudiant */}
      <div
        className="absolute overflow-hidden flex items-center justify-center"
        style={{
          left: "4mm",
          top: "17mm",
          width: "23mm",
          height: "26mm",
          backgroundColor: "#f3f4f6",
          border: "0.4mm solid #e5e7eb",
        }}
      >
        {student.avatar ? (
          <Image
            src={student.avatar}
            alt={student.fullName}
            width={128}
            height={160}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <span style={{ color: "#d1d5db", fontWeight: 700, fontSize: "10mm" }}>
            {student.fullName.charAt(0)}
          </span>
        )}
      </div>

      {/* Colonne d'informations */}
      <div
        className="absolute flex flex-col"
        style={{ left: "29mm", top: "19mm", width: "32mm", gap: "1mm" }}
      >
        {/* N° d'identification */}
        <div>
          <div
            className="font-bold uppercase"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e3a8a",
              fontSize: "1.8mm",
              letterSpacing: "0.08em",
              padding: "0.6mm 1.5mm 0.5mm 1.5mm",
              lineHeight: 1,
            }}
          >
            {t("studentCode", locale)}
          </div>
          <div
            className="font-mono truncate"
            style={{ color: "#111827", fontWeight: 600, fontSize: "2.6mm", padding: "0.5mm 1.5mm 0 1.5mm", lineHeight: 1.2 }}
          >
            {student.studentCode}
          </div>
        </div>

        {/* Nom */}
        <div>
          <div
            className="font-bold uppercase"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e3a8a",
              fontSize: "1.8mm",
              letterSpacing: "0.08em",
              padding: "0.6mm 1.5mm 0.5mm 1.5mm",
              lineHeight: 1,
            }}
          >
            {locale === "ar" ? "الاسم" : "Nom"}
          </div>
          {locale === "ar" ? (
            <div
              className="arabic truncate"
              style={{ color: "#111827", fontWeight: 700, fontSize: "3mm", padding: "0.5mm 1.5mm 0 1.5mm", lineHeight: 1.2 }}
            >
              {student.fullNameAr || student.fullName}
            </div>
          ) : (
            <div
              className="truncate"
              style={{ color: "#111827", fontWeight: 700, fontSize: "3mm", padding: "0.5mm 1.5mm 0 1.5mm", lineHeight: 1.2 }}
            >
              {student.fullName}
            </div>
          )}
        </div>

        {/* Groupe */}
        <div>
          <div
            className="font-bold uppercase"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e3a8a",
              fontSize: "1.8mm",
              letterSpacing: "0.08em",
              padding: "0.6mm 1.5mm 0.5mm 1.5mm",
              lineHeight: 1,
            }}
          >
            {t("group", locale)}
          </div>
          <div
            className="truncate"
            style={{ color: "#111827", fontWeight: 600, fontSize: "2.4mm", padding: "0.5mm 1.5mm 0 1.5mm", lineHeight: 1.2 }}
          >
            {student.group?.name || "—"}
          </div>
        </div>

        {/* Enseignant */}
        <div>
          <div
            className="font-bold uppercase"
            style={{
              backgroundColor: "#dbeafe",
              color: "#1e3a8a",
              fontSize: "1.8mm",
              letterSpacing: "0.08em",
              padding: "0.6mm 1.5mm 0.5mm 1.5mm",
              lineHeight: 1,
            }}
          >
            {t("teacher", locale)}
          </div>
          <div
            className="truncate"
            style={{ color: "#111827", fontWeight: 600, fontSize: "2.4mm", padding: "0.5mm 1.5mm 0 1.5mm", lineHeight: 1.2 }}
          >
            {student.teacher?.user?.fullName || "—"}
          </div>
        </div>
      </div>

      {/* QR Code */}
      <div
        className="absolute flex items-center justify-center"
        style={{ right: "4mm", top: "21mm", width: "20mm", height: "20mm" }}
      >
        <div
          className="flex items-center justify-center"
          style={{ width: "20mm", height: "20mm", padding: "1.5mm", backgroundColor: "#ffffff", border: "0.4mm solid #e5e7eb" }}
        >
          <QRCodeSVG
            value={qrCodeUrl}
            size={68}
            level="H"
            includeMargin={false}
            imageSettings={{
              src: logoUrl,
              height: 14,
              width: 14,
              excavate: true,
            }}
          />
        </div>
      </div>

      {/* Bandeau inférieur */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center"
        style={{ bottom: 0, height: "5.5mm", backgroundColor: "#8b5cf6", paddingLeft: "4mm", paddingRight: "4mm" }}
      >
        <span
          className="uppercase text-center truncate"
          style={{ color: "#ffffff", fontWeight: 900, fontSize: "3mm", letterSpacing: "0.12em", lineHeight: 1 }}
        >
          {school.name}
        </span>
      </div>

      {/* Date d'émission */}
      <div
        className="absolute"
        style={{ right: "4mm", bottom: "1.2mm", color: "#ffffff", fontWeight: 500, fontSize: "1.5mm", lineHeight: 1 }}
      >
        {displayDate}
      </div>
    </div>
  )
}
