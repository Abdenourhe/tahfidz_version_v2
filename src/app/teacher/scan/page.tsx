"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode, type CameraDevice } from "html5-qrcode"
import { useLanguage } from "@/contexts/LanguageContext"
import { Loader2, AlertCircle, Camera, RefreshCw } from "lucide-react"

const TEXTS: Record<string, Record<string, string>> = {
  title:         { fr: "Scanner une carte", en: "Scan a card", ar: "مسح بطاقة" },
  subtitle:      { fr: "Placez le QR code de l'élève dans le cadre", en: "Position the student's QR code in the frame", ar: "ضع رمز QR للطالب في الإطار" },
  starting:      { fr: "Démarrage de la caméra...", en: "Starting camera...", ar: "جاري تشغيل الكاميرا..." },
  error:         { fr: "Impossible d'accéder à la caméra", en: "Unable to access camera", ar: "تعذر الوصول إلى الكاميرا" },
  noCamera:      { fr: "Aucune caméra détectée", en: "No camera detected", ar: "لم يتم اكتشاف كاميرا" },
  switchCamera:  { fr: "Changer de caméra", en: "Switch camera", ar: "تبديل الكاميرا" },
  frontCamera:   { fr: "Caméra frontale", en: "Front camera", ar: "الكاميرا الأمامية" },
  backCamera:    { fr: "Caméra arrière", en: "Back camera", ar: "الكاميرا الخلفية" },
  camera:        { fr: "Caméra", en: "Camera", ar: "الكاميرا" },
  permission:    { fr: "Autorisez l'accès à la caméra pour scanner", en: "Allow camera access to scan", ar: "اسمح بالوصول إلى الكاميرا للمسح" },
}

function t(key: string, locale: string): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

function isBackCamera(label: string): boolean {
  const lower = label.toLowerCase()
  return lower.includes("back") || lower.includes("rear") || lower.includes("environment") || lower.includes("arrière") || lower.includes("trasera")
}

function isFrontCamera(label: string): boolean {
  const lower = label.toLowerCase()
  return lower.includes("front") || lower.includes("user") || lower.includes("avant") || lower.includes("frontal") || lower.includes("selfie")
}

export default function TeacherScanPage() {
  const { locale, dir } = useLanguage()
  const L = locale
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch {
        // ignore
      }
    }
    setIsScanning(false)
  }, [])

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return

    setLoading(true)
    setError(null)

    try {
      await stopScanner()

      // Choix de la caméra : cameraId si connu, sinon facingMode
      const cameraConfig = selectedCameraId ? selectedCameraId : { facingMode }

      await scannerRef.current.start(
        cameraConfig as any,
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
        (decodedText) => {
          scannerRef.current?.pause(true)
          try {
            const url = new URL(decodedText)
            const d = url.searchParams.get("d")
            if (d) {
              router.push(`/teacher/scan/verify?d=${encodeURIComponent(d)}`)
            } else {
              router.push(`/teacher/scan/verify?d=${encodeURIComponent(decodedText)}`)
            }
          } catch {
            router.push(`/teacher/scan/verify?d=${encodeURIComponent(decodedText)}`)
          }
        },
        () => {}
      )

      setIsScanning(true)
    } catch (err) {
      console.error(err)
      setError(t("error", L))
    } finally {
      setLoading(false)
    }
  }, [facingMode, selectedCameraId, L, router, stopScanner])

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader")
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices)

        if (devices.length === 0) {
          setError(t("noCamera", L))
          setLoading(false)
          return
        }

        // Par défaut : caméra arrière si disponible, sinon la dernière
        const back = devices.find((d) => isBackCamera(d.label))
        const selected = back ?? devices[devices.length - 1]
        setSelectedCameraId(selected.id)
      })
      .catch((err) => {
        console.error(err)
        setError(t("error", L))
        setLoading(false)
      })

    return () => {
      stopScanner()
      try { scanner.clear() } catch {}
    }
  }, [L, stopScanner])

  // Démarrer le scanner quand la caméra sélectionnée change
  useEffect(() => {
    if (selectedCameraId !== null) {
      startScanner()
    }
  }, [selectedCameraId, startScanner])

  const handleSwitchCamera = () => {
    if (cameras.length >= 2) {
      const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId)
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % cameras.length
      setSelectedCameraId(cameras[nextIndex].id)
    } else {
      // Fallback sur mobile : bascule facingMode
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
      setSelectedCameraId(null)
    }
  }

  const handleSelectCamera = (id: string) => {
    setSelectedCameraId(id)
  }

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
            <p className="text-sm text-white/70 mt-2">{t("permission", L)}</p>
          </div>
        )}
      </div>

      {/* Contrôles caméra */}
      <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
        {cameras.length > 0 && (
          <div className="relative flex-1 w-full">
            <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCameraId ?? "facing-" + facingMode}
              onChange={(e) => handleSelectCamera(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `${t("camera", L)} ${camera.id.slice(0, 8)}`}
                  {isBackCamera(camera.label) ? ` (${t("backCamera", L)})` : isFrontCamera(camera.label) ? ` (${t("frontCamera", L)})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSwitchCamera}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
        >
          <RefreshCw size={16} />
          {t("switchCamera", L)}
        </button>
      </div>

      {isScanning && (
        <p className="mt-3 text-xs text-center text-gray-500">
          {facingMode === "environment" ? t("backCamera", L) : t("frontCamera", L)}
        </p>
      )}
    </div>
  )
}
