"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { useLanguage } from "@/contexts/LanguageContext"
import { Loader2, AlertCircle } from "lucide-react"

const TEXTS: Record<string, Record<string, string>> = {
  title:      { fr: "Scanner une carte", en: "Scan a card", ar: "مسح بطاقة" },
  subtitle:   { fr: "Placez le QR code de l'élève dans le cadre", en: "Position the student's QR code in the frame", ar: "ضع رمز QR للطالب في الإطار" },
  starting:   { fr: "Démarrage de la caméra...", en: "Starting camera...", ar: "جاري تشغيل الكاميرا..." },
  error:      { fr: "Impossible d'accéder à la caméra", en: "Unable to access camera", ar: "تعذر الوصول إلى الكاميرا" },
  noCamera:   { fr: "Aucune caméra détectée", en: "No camera detected", ar: "لم يتم اكتشاف كاميرا" },
}

function t(key: string, locale: string): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

export default function TeacherScanPage() {
  const { locale, dir } = useLanguage()
  const L = locale
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((cameras) => {
        if (cameras.length === 0) {
          setError(t("noCamera", L))
          setLoading(false)
          return
        }

        const cameraId = cameras[cameras.length - 1].id
        scanner
          .start(
            cameraId,
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              // Pause pour éviter les scans multiples
              scanner.pause(true)
              // Redirection vers la page de confirmation
              const url = new URL(decodedText)
              router.push(`/teacher/scan/verify?d=${url.searchParams.get("d") || ""}`)
            },
            () => {}
          )
          .then(() => setLoading(false))
          .catch((err) => {
            console.error(err)
            setError(t("error", L))
            setLoading(false)
          })
      })
      .catch((err) => {
        console.error(err)
        setError(t("error", L))
        setLoading(false)
      })

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
    }
  }, [L, router])

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8" dir={dir}>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t("title", L)}</h1>
      <p className="text-sm text-gray-500 mb-6">{t("subtitle", L)}</p>

      <div className="relative bg-black rounded-2xl overflow-hidden aspect-square md:aspect-[4/3] flex items-center justify-center">
        <div id="qr-reader" className="w-full h-full" />

        {loading && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
            <Loader2 size={32} className="animate-spin mb-2" />
            <p>{t("starting", L)}</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
            <AlertCircle size={40} className="text-red-400 mb-3" />
            <p className="font-semibold">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
