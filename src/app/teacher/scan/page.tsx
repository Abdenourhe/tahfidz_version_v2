"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Html5Qrcode, type CameraDevice } from "html5-qrcode"
import { useLanguage } from "@/contexts/LanguageContext"
import { decodeAnyQrValue } from "@/lib/qr-code"
import { Loader2, AlertCircle, Camera, RefreshCw, ScanLine, CheckCircle2 } from "lucide-react"

const TEXTS: Record<string, Record<string, string>> = {
  title:         { fr: "Scanner une carte", en: "Scan a card", ar: "مسح بطاقة" },
  subtitle:      { fr: "Placez le QR code de l'élève dans le cadre", en: "Position the student's QR code in the frame", ar: "ضع رمز QR للطالب في الإطار" },
  starting:      { fr: "Démarrage de la caméra...", en: "Starting camera...", ar: "جاري تشغيل الكاميرا..." },
  error:         { fr: "Impossible d'accéder à la caméra", en: "Unable to access camera", ar: "تعذر الوصول إلى الكاميرا" },
  noCamera:      { fr: "Aucune caméra détectée", en: "No camera detected", ar: "لم يتم اكتشاف كاميرا" },
  switchCamera:  { fr: "Inverser", en: "Switch", ar: "تبديل" },
  frontCamera:   { fr: "Frontale", en: "Front", ar: "أمامية" },
  backCamera:    { fr: "Arrière", en: "Back", ar: "خلفية" },
  camera:        { fr: "Caméra", en: "Camera", ar: "الكاميرا" },
  permission:    { fr: "Autorisez l'accès à la caméra pour scanner", en: "Allow camera access to scan", ar: "اسمح بالوصول إلى الكاميرا للمسح" },
  scanned:       { fr: "QR code détecté", en: "QR code detected", ar: "تم اكتشاف رمز QR" },
  invalidQr:     { fr: "QR non reconnu, réessayez", en: "QR not recognized, try again", ar: "رمز QR غير معروف، حاول مرة أخرى" },
}

function t(key: string, locale: string): string {
  return TEXTS[key]?.[locale] || TEXTS[key]?.fr || key
}

function isBackCamera(label: string): boolean {
  const lower = label.toLowerCase()
  return lower.includes("back") || lower.includes("rear") || lower.includes("environment") || lower.includes("arrière") || lower.includes("trasera")
}

function playBeep() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = "sine"
    osc.frequency.value = 1200
    gain.gain.setValueAtTime(0.1, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.15)
  } catch {
    // ignore
  }
}

function triggerVibration() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(100)
  }
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
  const [scanned, setScanned] = useState(false)

  const stopScanner = useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch {}
    }
  }, [])

  const handleDecoded = useCallback((decodedText: string) => {
    console.log("[QR Scan] decoded:", decodedText)
    const payload = decodeAnyQrValue(decodedText)

    if (!payload) {
      console.log("[QR Scan] payload non reconnu")
      setError(t("invalidQr", L))
      setTimeout(() => setError(null), 2000)
      scannerRef.current?.resume()
      return
    }

    console.log("[QR Scan] payload valide:", payload.s, payload.t)
    setScanned(true)
    playBeep()
    triggerVibration()

    const encoded = encodeURIComponent(`${payload.s}:${payload.t}:${payload.h}`)
    router.push(`/teacher/scan/verify?d=${encoded}`)
  }, [L, router])

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return

    setLoading(true)
    setError(null)
    setScanned(false)

    try {
      await stopScanner()
      const cameraConfig = selectedCameraId ? selectedCameraId : { facingMode }

      await scannerRef.current.start(
        cameraConfig as any,
        { fps: 15, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0 },
        (decodedText) => {
          scannerRef.current?.pause(true)
          handleDecoded(decodedText)
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan intermédiaires
          console.debug("[QR Scan] error:", errorMessage)
        }
      )
    } catch (err) {
      console.error(err)
      setError(t("error", L))
    } finally {
      setLoading(false)
    }
  }, [facingMode, selectedCameraId, handleDecoded, stopScanner, L])

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
        const back = devices.find((d) => isBackCamera(d.label))
        setSelectedCameraId((back ?? devices[devices.length - 1]).id)
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
      setFacingMode((prev) => (prev === "environment" ? "user" : "environment"))
      setSelectedCameraId(null)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-8" dir={dir}>
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-tahfidz-green/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ScanLine size={28} className="text-tahfidz-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title", L)}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle", L)}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-square">
          <div id="qr-reader" className="w-full h-full" />

          {/* Cadre de scan */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-56 h-56 border-2 border-white/40 rounded-2xl relative">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-s-4 border-tahfidz-green rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-e-4 border-tahfidz-green rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-s-4 border-tahfidz-green rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-e-4 border-tahfidz-green rounded-br-xl" />
            </div>
          </div>

          {loading && !scanned && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
              <Loader2 size={32} className="animate-spin mb-2" />
              <p className="text-sm">{t("starting", L)}</p>
            </div>
          )}

          {scanned && (
            <div className="absolute inset-0 bg-tahfidz-green/90 flex flex-col items-center justify-center text-white">
              <CheckCircle2 size={56} className="mb-2" />
              <p className="text-lg font-semibold">{t("scanned", L)}</p>
            </div>
          )}

          {error && !scanned && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertCircle size={40} className="text-red-400 mb-3" />
              <p className="font-semibold">{error}</p>
              <p className="text-sm text-white/70 mt-2">{t("permission", L)}</p>
            </div>
          )}
        </div>

        {/* Contrôles */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSwitchCamera}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw size={16} />
            {t("switchCamera", L)}
          </button>
        </div>

        {cameras.length > 0 && (
          <div className="mt-3 relative">
            <Camera size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <select
              value={selectedCameraId ?? "facing-" + facingMode}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            >
              {cameras.map((camera) => (
                <option key={camera.id} value={camera.id}>
                  {camera.label || `${t("camera", L)} ${camera.id.slice(0, 8)}`}
                  {isBackCamera(camera.label) ? ` (${t("backCamera", L)})` : ` (${t("frontCamera", L)})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
