"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Html5Qrcode, Html5QrcodeSupportedFormats, type CameraDevice } from "html5-qrcode"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { decodeAnyQrValue, decodeBarcodeValue } from "@/lib/qr-code"
import {
  Loader2, AlertCircle, RefreshCw, ScanLine, CheckCircle2,
  ArrowLeft, Keyboard, Search, Zap, Camera, Upload
} from "lucide-react"

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
  const { dir } = useLanguage()
  const t = useT("teacherScan")
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [torchOn, setTorchOn] = useState(false)
  const [captureBusy, setCaptureBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const barcodeLoopRef = useRef<number | null>(null)

  const stopScanner = useCallback(async () => {
    if (barcodeLoopRef.current) {
      clearInterval(barcodeLoopRef.current)
      barcodeLoopRef.current = null
    }
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch {}
    }
  }, [])

  const handleDecoded = useCallback((decodedText: string) => {
    const trimmed = decodedText.trim()
    console.log("[Scan] decoded:", trimmed)

    let encoded: string | null = null

    // QR code / payload compact
    const qrPayload = decodeAnyQrValue(trimmed)
    if (qrPayload) {
      encoded = `${qrPayload.s}:${qrPayload.t}:${qrPayload.h}`
    }

    // Code-barres au format schoolSlug:studentCode
    if (!encoded) {
      const barcodePayload = decodeBarcodeValue(trimmed)
      if (barcodePayload) {
        encoded = trimmed
      }
    }

    // Code étudiant seul (ex: TAH-2026-0001)
    if (!encoded && trimmed.length >= 3) {
      encoded = trimmed
    }

    if (encoded) {
      setScanned(true)
      playBeep()
      triggerVibration()
      router.push(`/teacher/scan/verify?d=${encodeURIComponent(encoded)}`)
      return
    }

    console.log("[Scan] payload non reconnu")
    setError(t("invalidQr"))
    setTimeout(() => setError(null), 2000)
    scannerRef.current?.resume()
  }, [router, t])

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    handleDecoded(manualCode)
  }

  // Décodeur natif du navigateur, souvent bien meilleur que zxing pour les
  // codes-barres 1D (CODE_128, EAN, etc.) sur webcam frontale.
  const startBarcodeDetectorLoop = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    const BarcodeDetectorCls = (window as any).BarcodeDetector
    if (!BarcodeDetectorCls) {
      console.log("[Scan] BarcodeDetector non disponible")
      return
    }

    try {
      const detector = new BarcodeDetectorCls({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
      })

      barcodeLoopRef.current = window.setInterval(async () => {
        try {
          const results = await detector.detect(video)
          if (results && results.length > 0) {
            const raw = results[0].rawValue
            if (raw && !scanned) {
              console.log("[BarcodeDetector] detected:", raw)
              if (barcodeLoopRef.current) {
                clearInterval(barcodeLoopRef.current)
                barcodeLoopRef.current = null
              }
              await stopScanner()
              handleDecoded(raw)
            }
          }
        } catch (err) {
          console.debug("[BarcodeDetector] detect error", err)
        }
      }, 250)
    } catch (err) {
      console.warn("[BarcodeDetector] init error", err)
    }
  }, [handleDecoded, scanned, stopScanner])

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return

    setLoading(true)
    setError(null)
    setScanned(false)

    try {
      await stopScanner()

      // html5-qrcode impose un objet avec exactement 1 clé : deviceId ou facingMode.
      let cameraConfig: string | { facingMode: string }
      if (selectedCameraId) {
        cameraConfig = selectedCameraId
      } else {
        cameraConfig = { facingMode }
      }

      // Zone de scan rectangulaire pour les codes-barres horizontaux,
      // adaptée dynamiquement à la taille du lecteur (min 100×50 px).
      const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.max(100, Math.min(640, Math.round(viewfinderWidth * 0.75))),
        height: Math.max(50, Math.min(320, Math.round(viewfinderHeight * 0.45))),
      })

      await scannerRef.current.start(
        cameraConfig as any,
        { fps: 25, qrbox, aspectRatio: 1.777778, disableFlip: false },
        (decodedText) => {
          scannerRef.current?.pause(true)
          handleDecoded(decodedText)
        },
        (errorMessage) => {
          // Ignorer les erreurs de scan intermédiaires
          console.debug("[Scan] error:", errorMessage)
        }
      )

      // Appliquer une résolution plus élevée après démarrage.
      // (focusMode est retiré car il provoque une OverconstrainedError sur certains navigateurs.)
      try {
        await (scannerRef.current as any).applyVideoConstraints({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        })
      } catch (constraintErr) {
        console.warn("[Scan] contraintes avancées non appliquées", constraintErr)
      }

      // Stocker la référence vidéo pour les captures et la lampe
      const video = document.querySelector("#qr-reader video") as HTMLVideoElement | null
      if (video) {
        videoRef.current = video
        // Lancer le décodeur natif en parallèle pour améliorer la détection des codes-barres.
        await startBarcodeDetectorLoop()
      }
    } catch (err: any) {
      console.error(err)
      const errorName = err?.name || ""
      if (errorName === "NotAllowedError" || errorName === "PermissionDeniedError") {
        setError(t("permissionDenied"))
      } else if (errorName === "NotReadableError" || errorName === "TrackStartError") {
        setError(t("cameraInUse"))
      } else if (errorName === "OverconstrainedError" || errorName === "ConstraintNotSatisfiedError") {
        setError(t("cameraNotSupported"))
      } else {
        setError(t("error"))
      }
    } finally {
      setLoading(false)
    }
  }, [facingMode, selectedCameraId, handleDecoded, stopScanner, startBarcodeDetectorLoop, t])

  useEffect(() => {
    const scanner = new Html5Qrcode("qr-reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
    })
    scannerRef.current = scanner

    Html5Qrcode.getCameras()
      .then((devices) => {
        setCameras(devices)
        if (devices.length === 0) {
          setError(t("noCamera"))
          setLoading(false)
          return
        }
        const back = devices.find((d) => isBackCamera(d.label))
        if (!back) {
          setFacingMode("user")
        }
        setSelectedCameraId((back ?? devices[devices.length - 1]).id)
      })
      .catch((err) => {
        console.error(err)
        setError(t("error"))
        setLoading(false)
      })

    return () => {
      stopScanner()
      try { scanner.clear() } catch {}
    }
  }, [t, stopScanner])

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !scannerRef.current) return

    try {
      setLoading(true)
      await stopScanner()
      const decodedText = await (scannerRef.current as any).scanFile(file, false)
      if (decodedText) {
        handleDecoded(decodedText)
        return
      }
      throw new Error("Aucun code détecté")
    } catch (err) {
      console.warn("[Scan] upload échoué", err)
      setError(t("uploadError"))
      setTimeout(() => setError(null), 2500)
      await startScanner()
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  const handleToggleTorch = async () => {
    if (!scannerRef.current) return
    try {
      const next = !torchOn
      await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch (err) {
      console.warn("[Scan] torch non supporté", err)
      setError(t("torchUnavailable"))
      setTimeout(() => setError(null), 2000)
    }
  }

  const handleCapture = async () => {
    const video = videoRef.current
    const scanner = scannerRef.current
    if (!video || !scanner || captureBusy) return

    setCaptureBusy(true)
    try {
      await scanner.pause(true)

      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("Canvas non disponible")
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"))
      if (!blob) throw new Error("Capture impossible")

      const file = new File([blob], "scan.png", { type: "image/png" })
      const decodedText = await scanner.scanFile(file, false)
      if (decodedText) {
        handleDecoded(decodedText)
        return
      }
      throw new Error("Aucun code détecté")
    } catch (err) {
      console.warn("[Scan] capture échouée", err)
      setError(t("captureError"))
      setTimeout(() => setError(null), 2500)
      try { await scanner.resume() } catch {}
    } finally {
      setCaptureBusy(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8" dir={dir}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Link>
      </div>

      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-tahfidz-green/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <ScanLine size={28} className="text-tahfidz-green" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("subtitle")}</p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video">
          <div id="qr-reader" className="w-full h-full" />

          {/* Masque autour du cadre de scan */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-full max-w-[85%] h-36 relative">
              {/* Bords transparents (masque) */}
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
              {/* Zone de scan transparente */}
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/30 ring-offset-0" />
              {/* Coins */}
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-s-4 border-tahfidz-green rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-e-4 border-tahfidz-green rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-s-4 border-tahfidz-green rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-e-4 border-tahfidz-green rounded-br-xl" />
              {/* Ligne laser animée */}
              <div className="absolute left-0 right-0 h-0.5 bg-tahfidz-green/80 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-scan-laser" />
            </div>
          </div>

          {loading && !scanned && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
              <Loader2 size={32} className="animate-spin mb-2" />
              <p className="text-sm">{t("starting")}</p>
            </div>
          )}

          {scanned && (
            <div className="absolute inset-0 bg-tahfidz-green/90 flex flex-col items-center justify-center text-white">
              <CheckCircle2 size={56} className="mb-2" />
              <p className="text-lg font-semibold">{t("scanned")}</p>
            </div>
          )}

          {error && !scanned && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
              <AlertCircle size={40} className="text-red-400 mb-3" />
              <p className="font-semibold">{error}</p>
              <p className="text-sm text-white/70 mt-2 mb-4">{t("permission")}</p>
              <button
                onClick={() => startScanner()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-lg text-sm font-medium hover:bg-gray-100 transition"
              >
                <RefreshCw size={16} />
                {t("retry")}
              </button>
            </div>
          )}
        </div>

        {/* Contrôles simplifiés */}
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSwitchCamera}
            title={t("switchCamera")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
          >
            <RefreshCw size={16} />
            <span className="hidden sm:inline">{t("switchCamera")}</span>
          </button>

          <button
            onClick={handleToggleTorch}
            title={t("torch")}
            className={`inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition ${
              torchOn
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300"
                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            }`}
          >
            <Zap size={16} className={torchOn ? "fill-current" : ""} />
            <span className="hidden sm:inline">{t(torchOn ? "torchOn" : "torch")}</span>
          </button>

          <button
            onClick={handleCapture}
            disabled={captureBusy || loading}
            title={t("capture")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-tahfidz-green hover:bg-tahfidz-green/90 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
          >
            {captureBusy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
            <span className="hidden sm:inline">{t("capture")}</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            title={t("uploadImage")}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition disabled:opacity-60"
          >
            <Upload size={16} />
            <span className="hidden sm:inline">{t("uploadImage")}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Saisie manuelle */}
        <form onSubmit={handleManualVerify} className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Keyboard size={12} />
            {t("orEnterCode")}
          </p>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={t("enterCode")}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={!manualCode.trim()}
              className="px-4 py-2.5 bg-tahfidz-green text-white text-sm font-medium rounded-xl hover:bg-tahfidz-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {t("verify")}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        @keyframes scan-laser {
          0%, 100% { top: 0; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-scan-laser {
          animation: scan-laser 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
