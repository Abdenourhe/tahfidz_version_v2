"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { QRCodeSVG } from "qrcode.react"
import Barcode from "react-barcode"
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
  student:       { fr: "Élève", en: "Student", ar: "طالب" },
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
      {/* Coins décoratifs haut droit */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "22mm",
          height: "14mm",
          background: "#0e76a8",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "14mm",
          height: "9mm",
          background: "#085c8c",
          clipPath: "polygon(100% 0, 0 0, 100% 100%)",
        }}
      />

      {/* En-tête : logo + école */}
      <div
        className="absolute left-0 right-0 flex items-center"
        style={{ top: 0, height: "9mm", paddingLeft: "3mm", paddingRight: "3mm", gap: "2mm" }}
      >
        <div
          style={{
            width: "6mm",
            height: "6mm",
            borderRadius: "50%",
            overflow: "hidden",
            background: "#fff",
            boxShadow: "0 0 0 0.3mm rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        >
          <Image src={logoUrl} alt={school.name} width={48} height={48} className="object-contain w-full h-full" unoptimized />
        </div>
        <div>
          <p className="truncate" style={{ fontSize: "2.4mm", fontWeight: 700, color: "#1f2937", lineHeight: 1.1 }}>
            {school.name}
          </p>
          <p style={{ fontSize: "1.5mm", color: "#6b7280", lineHeight: 1.1, marginTop: "0.3mm" }}>
            {school.slug}
          </p>
        </div>
      </div>

      {/* Bandeau bleu avec nom */}
      <div
        className="absolute left-0 right-0 flex items-center justify-between"
        style={{ top: "9mm", height: "10mm", background: "#0e76a8", paddingLeft: "3mm", paddingRight: "3mm" }}
      >
        <div style={{ maxWidth: "75%" }}>
          <p
            className="uppercase truncate"
            style={{ fontSize: "4mm", fontWeight: 800, color: "#ffffff", letterSpacing: "0.03em", lineHeight: 1.1 }}
          >
            {student.fullName}
          </p>
          <p style={{ fontSize: "2.2mm", color: "#dbeafe", lineHeight: 1.1, marginTop: "0.8mm" }}>
            {t("student", locale)}
          </p>
        </div>
        <div
          className="text-right"
          style={{ color: "rgba(255,255,255,0.85)", fontWeight: 500, fontSize: "1.3mm", lineHeight: 1.2 }}
        >
          <p style={{ fontSize: "1.1mm", opacity: 0.8, textTransform: "uppercase" }}>{t("issuedOn", locale)}</p>
          <p>{displayDate}</p>
        </div>
      </div>

      {/* Corps : infos + photo */}
      <div
        className="absolute left-0 right-0 flex"
        style={{ top: "19mm", height: "16mm", paddingLeft: "3mm", paddingRight: "3mm" }}
      >
        <div className="flex flex-col" style={{ flex: 1, gap: "0.7mm", paddingTop: "0.5mm" }}>
          <IdInfoRow label={t("studentCode", locale)} value={student.studentCode} />
          <IdInfoRow label={t("group", locale)} value={student.group?.name || "—"} />
          <IdInfoRow label="Email" value={student.email || "—"} />
          {student.phone && <IdInfoRow label={t("phone", locale)} value={student.phone} />}
        </div>

        {/* Photo */}
        <div
          className="flex items-center justify-center overflow-hidden flex-shrink-0"
          style={{
            width: "19mm",
            height: "16mm",
            border: "0.5mm solid #0e76a8",
            background: "#f8fafc",
            marginLeft: "2mm",
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
            <span style={{ color: "#cbd5e1", fontWeight: 700, fontSize: "8mm" }}>
              {student.fullName.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Code-barres */}
      <div style={{ position: "absolute", left: "3mm", width: "52mm", bottom: "2mm" }}>
        <Barcode
          value={student.studentCode}
          width={1.1}
          height={28}
          fontSize={9}
          background="#ffffff"
          lineColor="#000000"
          margin={0}
          displayValue
        />
      </div>

      {/* QR code */}
      <div
        className="flex items-center justify-center bg-white"
        style={{ position: "absolute", right: "3mm", bottom: "2mm", width: "20mm", height: "20mm" }}
      >
        <QRCodeSVG value={qrCodeUrl} size={76} level="M" bgColor="#ffffff" fgColor="#000000" />
      </div>

      {/* Bandeau inférieur */}
      <div className="absolute left-0 right-0" style={{ bottom: 0, height: "1.5mm", background: "#0e76a8" }} />
    </div>
  )
}

function IdInfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: "1.4mm",
          color: "#6b7280",
          fontWeight: 700,
          textTransform: "uppercase",
          lineHeight: 1,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </p>
      <p
        className="truncate"
        style={{
          fontSize: "2.2mm",
          color: "#111827",
          fontWeight: 700,
          lineHeight: 1.2,
          maxWidth: "52mm",
          marginTop: "0.3mm",
        }}
      >
        {value}
      </p>
    </div>
  )
}
