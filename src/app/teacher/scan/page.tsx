"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import { Html5Qrcode, Html5QrcodeSupportedFormats, type CameraDevice } from "html5-qrcode"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { decodeAnyQrValue, decodeBarcodeValue } from "@/lib/qr-code"
import { motion, AnimatePresence } from "framer-motion"
import {
  Loader2, AlertCircle, RefreshCw, ScanLine, CheckCircle2,
  ArrowLeft, Keyboard, Search, Zap, Camera, Upload, History,
  User, Users, X, ShieldCheck, ToggleLeft, ToggleRight,
  Clock, CheckCircle, Trash2
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

function formatTimeAgo(timestamp: number, t: (key: string) => string) {
  const diffMs = Date.now() - timestamp
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return t("justNow")
  return t("minutesAgo").replace("{n}", String(diffMin))
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const HISTORY_KEY = "tahfidz:teacher-scan-history"
const PREFS_KEY = "tahfidz:teacher-scan-prefs"

type ScanHistoryItem = {
  id: string
  timestamp: number
  studentName: string
  groupName?: string | null
  avatar?: string | null
  status: "success" | "error"
  error?: string
  method: "scan" | "manual"
}

type PendingStudent = {
  id: string
  fullName: string
  avatar?: string | null
  groupName?: string | null
}

type Toast = {
  id: string
  type: "success" | "error" | "info"
  title: string
  message?: string
  badge?: string
}

export default function TeacherScanPage() {
  const { dir } = useLanguage()
  const t = useT("teacherScan")

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const barcodeLoopRef = useRef<number | null>(null)
  const processingRef = useRef(false)
  const autoConfirmRef = useRef(true)
  const continuousScanRef = useRef(true)
  const recentScansRef = useRef<Map<string, number>>(new Map())
  const RECENT_WINDOW_MS = 8000

  const [cameras, setCameras] = useState<CameraDevice[]>([])
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scanned, setScanned] = useState(false)
  const [manualCode, setManualCode] = useState("")
  const [torchOn, setTorchOn] = useState(false)
  const [captureBusy, setCaptureBusy] = useState(false)
  const [autoConfirm, setAutoConfirm] = useState(true)
  const [continuousScan, setContinuousScan] = useState(true)
  const [history, setHistory] = useState<ScanHistoryItem[]>([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingStudent, setPendingStudent] = useState<PendingStudent | null>(null)
  const [pendingEncoded, setPendingEncoded] = useState<string | null>(null)
  const [confirmBusy, setConfirmBusy] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)

  // Synchroniser les refs avec les states
  useEffect(() => { autoConfirmRef.current = autoConfirm }, [autoConfirm])
  useEffect(() => { continuousScanRef.current = continuousScan }, [continuousScan])

  // Charger préférences et historique
  useEffect(() => {
    try {
      const rawPrefs = localStorage.getItem(PREFS_KEY)
      if (rawPrefs) {
        const prefs = JSON.parse(rawPrefs)
        if (typeof prefs.autoConfirm === "boolean") setAutoConfirm(prefs.autoConfirm)
        if (typeof prefs.continuousScan === "boolean") setContinuousScan(prefs.continuousScan)
      }
    } catch {}

    try {
      const rawHistory = localStorage.getItem(HISTORY_KEY)
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory) as ScanHistoryItem[]
        if (Array.isArray(parsed)) {
          const last = parsed[0]
          if (last && !isSameDay(new Date(last.timestamp), new Date())) {
            localStorage.removeItem(HISTORY_KEY)
            setHistory([])
          } else {
            setHistory(parsed.slice(0, 50))
          }
        }
      }
    } catch {}
  }, [])

  // Persister les préférences
  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ autoConfirm, continuousScan }))
    } catch {}
  }, [autoConfirm, continuousScan])

  // Vider l'historique automatiquement au changement de jour
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory((prev) => {
        if (prev.length === 0) return prev
        if (!isSameDay(new Date(prev[0].timestamp), new Date())) {
          try { localStorage.removeItem(HISTORY_KEY) } catch {}
          return []
        }
        return prev
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const showToast = useCallback((type: "success" | "error" | "info", title: string, message?: string, badge?: string) => {
    const id = generateId()
    setToast({ id, type, title, message, badge })
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current))
    }, 4000)
  }, [])

  const addHistory = useCallback((item: ScanHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev].slice(0, 50)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const stopScanner = useCallback(async () => {
    if (barcodeLoopRef.current) {
      clearInterval(barcodeLoopRef.current)
      barcodeLoopRef.current = null
    }
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch {}
    }
  }, [])

  const startBarcodeDetectorLoop = useCallback(() => {
    const BarcodeDetectorCls = (window as any).BarcodeDetector
    if (!BarcodeDetectorCls) return

    const video = document.querySelector("#qr-reader video") as HTMLVideoElement | null
    if (!video) return

    try {
      const detector = new BarcodeDetectorCls({
        formats: ["code_128", "code_39", "ean_13", "ean_8", "upc_a", "upc_e", "qr_code"],
      })

      if (barcodeLoopRef.current) clearInterval(barcodeLoopRef.current)
      barcodeLoopRef.current = window.setInterval(async () => {
        try {
          const results = await detector.detect(video)
          if (results && results.length > 0) {
            const raw = results[0].rawValue
            if (raw && !processingRef.current) {
              processingRef.current = true
              console.log("[BarcodeDetector] detected:", raw)
              await processDecodedRef.current?.(raw, "scan")
            }
          }
        } catch {
          // Ignorer les erreurs de détection intermédiaires
        }
      }, 300)
    } catch {
      // BarcodeDetector non supporté ou erreur d'init
    }
  }, [])

  const startScanner = useCallback(async () => {
    if (!scannerRef.current) return

    setLoading(true)
    setError(null)
    setScanned(false)
    processingRef.current = false

    try {
      await stopScanner()

      let cameraConfig: string | { facingMode: string }
      if (selectedCameraId) {
        cameraConfig = selectedCameraId
      } else {
        cameraConfig = { facingMode }
      }

      const qrbox = (viewfinderWidth: number, viewfinderHeight: number) => ({
        width: Math.max(120, Math.min(640, Math.round(viewfinderWidth * 0.8))),
        height: Math.max(60, Math.min(360, Math.round(viewfinderHeight * 0.5))),
      })

      await scannerRef.current.start(
        cameraConfig as any,
        { fps: 20, qrbox, aspectRatio: 1.777778, disableFlip: false },
        (decodedText) => {
          if (processingRef.current) return
          processingRef.current = true
          processDecodedRef.current?.(decodedText, "scan")
        },
        () => {
          // Ignorer les erreurs de scan intermédiaires
        }
      )

      try {
        await (scannerRef.current as any).applyVideoConstraints({
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        })
      } catch {
        // contraintes avancées optionnelles
      }

      // Démarrer le décodeur natif en parallèle pour de meilleures performances sur mobile
      startBarcodeDetectorLoop()
    } catch (err: any) {
      console.error("[Scan] start error:", err)
      const errorName = err?.name || ""
      const errorMessage = err?.message || ""

      if (errorMessage.toLowerCase().includes("transition")) {
        setTimeout(() => startScanner(), 800)
        return
      }

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
  }, [facingMode, selectedCameraId, stopScanner, startBarcodeDetectorLoop, t])

  const restartScanner = useCallback(async () => {
    setScanned(false)
    setShowConfirm(false)
    setPendingStudent(null)
    setPendingEncoded(null)
    processingRef.current = false
    setError(null)
    // Sur mobile, un redémarrage complet est plus stable que resume()
    await startScanner()
  }, [startScanner])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  async function processDecoded(raw: string, method: "scan" | "manual") {
    const trimmed = raw.trim()
    let encoded: string | null = null

    const qrPayload = decodeAnyQrValue(trimmed)
    if (qrPayload) {
      encoded = `${qrPayload.s}:${qrPayload.t}:${qrPayload.h}`
    }

    if (!encoded) {
      const barcodePayload = decodeBarcodeValue(trimmed)
      if (barcodePayload) {
        encoded = trimmed
      }
    }

    if (!encoded && trimmed.length >= 3) {
      encoded = trimmed
    }

    if (!encoded) {
      showToast("error", t("invalidQr"))
      addHistory({
        id: generateId(),
        timestamp: Date.now(),
        studentName: trimmed || "—",
        status: "error",
        error: t("invalidQr"),
        method,
      })
      await restartScanner()
      return
    }

    // Cooldown pour éviter les doubles scans
    const recentTs = recentScansRef.current.get(encoded)
    if (recentTs && Date.now() - recentTs < RECENT_WINDOW_MS) {
      showToast("error", t("alreadyScanned"))
      await restartScanner()
      return
    }
    recentScansRef.current.set(encoded, Date.now())

    if (autoConfirmRef.current) {
      try {
        const res = await fetch("/api/teacher/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: encoded }),
        })
        const data = await res.json()

        if (res.status === 409 || data.code === "ALREADY_PRESENT") {
          showToast("error", t("alreadyPresent"), t("alreadyPresentMessage").replace("{name}", data.studentName || ""))
          await restartScanner()
          return
        }

        if (!res.ok) throw new Error(data.error || t("verifyError"))

        addHistory({
          id: generateId(),
          timestamp: Date.now(),
          studentName: data.studentName || "—",
          status: "success",
          method,
        })
        playBeep()
        triggerVibration()
        showToast("success", data.studentName || t("attendanceConfirmed"), data.message, t("presentBadge"))

        if (continuousScanRef.current) {
          setTimeout(() => restartScanner(), 1200)
        } else {
          setScanned(true)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : t("verifyError")
        addHistory({
          id: generateId(),
          timestamp: Date.now(),
          studentName: "—",
          status: "error",
          error: message,
          method,
        })
        showToast("error", message)
        if (continuousScanRef.current) {
          setTimeout(() => restartScanner(), 1500)
        } else {
          setScanned(true)
        }
      }
    } else {
      // Mode manuel
      try {
        const res = await fetch(`/api/teacher/scan/verify?d=${encodeURIComponent(encoded)}`)
        const data = await res.json()
        if (!res.ok || !data.valid) throw new Error(data.error || t("invalidCode"))

        setPendingStudent(data.student)
        setPendingEncoded(encoded)
        setShowConfirm(true)
        playBeep()
        triggerVibration()
      } catch (err) {
        const message = err instanceof Error ? err.message : t("invalidCode")
        addHistory({
          id: generateId(),
          timestamp: Date.now(),
          studentName: "—",
          status: "error",
          error: message,
          method,
        })
        showToast("error", message)
        if (continuousScanRef.current) {
          setTimeout(() => restartScanner(), 1500)
        } else {
          setScanned(true)
        }
      }
    }
  }

  const processDecodedRef = useRef(processDecoded)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { processDecodedRef.current = processDecoded }, [processDecoded])

  const confirmPending = useCallback(async () => {
    if (!pendingEncoded) return
    setConfirmBusy(true)
    try {
      const res = await fetch("/api/teacher/attendance/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: pendingEncoded }),
      })
      const data = await res.json()

      if (res.status === 409 || data.code === "ALREADY_PRESENT") {
        showToast("error", t("alreadyPresent"), t("alreadyPresentMessage").replace("{name}", data.studentName || pendingStudent?.fullName || ""))
        setShowConfirm(false)
        await restartScanner()
        return
      }

      if (!res.ok) throw new Error(data.error || t("verifyError"))

      addHistory({
        id: generateId(),
        timestamp: Date.now(),
        studentName: data.studentName || pendingStudent?.fullName || "—",
        groupName: pendingStudent?.groupName,
        avatar: pendingStudent?.avatar,
        status: "success",
        method: "scan",
      })
      showToast("success", data.studentName || t("attendanceConfirmed"), data.message, t("presentBadge"))
      setShowConfirm(false)

      if (continuousScanRef.current) {
        setTimeout(() => restartScanner(), 1200)
      } else {
        setScanned(true)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t("verifyError")
      addHistory({
        id: generateId(),
        timestamp: Date.now(),
        studentName: pendingStudent?.fullName || "—",
        groupName: pendingStudent?.groupName,
        avatar: pendingStudent?.avatar,
        status: "error",
        error: message,
        method: "scan",
      })
      showToast("error", message)
      setShowConfirm(false)
      if (continuousScanRef.current) {
        setTimeout(() => restartScanner(), 1500)
      } else {
        setScanned(true)
      }
    } finally {
      setConfirmBusy(false)
    }
  }, [addHistory, pendingEncoded, pendingStudent, restartScanner, showToast, t])

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
        if (!back) setFacingMode("user")
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
      const timer = setTimeout(() => startScanner(), 300)
      return () => clearTimeout(timer)
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

  const handleToggleTorch = async () => {
    if (!scannerRef.current) return
    try {
      const next = !torchOn
      await (scannerRef.current as any).applyVideoConstraints({ advanced: [{ torch: next }] })
      setTorchOn(next)
    } catch {
      showToast("error", t("torchUnavailable"))
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !scannerRef.current) return

    try {
      setLoading(true)
      const decodedText = await (scannerRef.current as any).scanFile(file, false)
      if (decodedText) {
        await processDecoded(decodedText, "scan")
        return
      }
      throw new Error("Aucun code détecté")
    } catch (err) {
      console.warn("[Scan] upload failed", err)
      showToast("error", t("uploadError"))
      await restartScanner()
    } finally {
      setLoading(false)
      e.target.value = ""
    }
  }

  const handleCapture = async () => {
    const scanner = scannerRef.current
    if (!scanner || captureBusy) return

    setCaptureBusy(true)
    try {
      const video = document.querySelector("#qr-reader video") as HTMLVideoElement | null
      if (!video) throw new Error("Vidéo non disponible")

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
        await processDecoded(decodedText, "scan")
        return
      }
      throw new Error("Aucun code détecté")
    } catch (err) {
      console.warn("[Scan] capture failed", err)
      showToast("error", t("captureError"))
    } finally {
      setCaptureBusy(false)
    }
  }

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualCode.trim()) return
    processDecoded(manualCode, "manual")
    setManualCode("")
  }

  const handleEndSession = () => {
    if (typeof window !== "undefined" && !window.confirm(t("confirmEndSession"))) return
    setHistory([])
    try { localStorage.removeItem(HISTORY_KEY) } catch {}
    showToast("info", t("sessionEnded"))
  }

  const todayHistory = history.filter((h) => isSameDay(new Date(h.timestamp), new Date()))

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8" dir={dir}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-tahfidz-green transition"
        >
          <ArrowLeft size={16} />
          {t("back")}
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-tahfidz-green/10 rounded-xl flex items-center justify-center">
            <ScanLine size={20} className="text-tahfidz-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{t("title")}</h1>
            <p className="text-xs text-gray-500">{t("subtitle")}</p>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="relative bg-black overflow-hidden aspect-video">
          <div id="qr-reader" className="w-full h-full" />

          {/* Overlay de scan */}
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
            <div className="w-full max-w-[85%] h-44 relative">
              <div className="absolute inset-0 bg-black/40 rounded-xl" />
              <div className="absolute inset-0 rounded-xl ring-2 ring-white/30 ring-offset-0" />
              <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-s-4 border-tahfidz-green rounded-tl-xl" />
              <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-e-4 border-tahfidz-green rounded-tr-xl" />
              <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-s-4 border-tahfidz-green rounded-bl-xl" />
              <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-e-4 border-tahfidz-green rounded-br-xl" />
              <div className="absolute left-0 right-0 h-0.5 bg-tahfidz-green/80 shadow-[0_0_10px_rgba(16,185,129,0.8)] animate-scan-laser" />
            </div>
          </div>

          {loading && !scanned && !showConfirm && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white">
              <Loader2 size={32} className="animate-spin mb-2" />
              <p className="text-sm">{t("starting")}</p>
            </div>
          )}

          {scanned && !showConfirm && (
            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-white p-6 text-center">
              <CheckCircle2 size={56} className="text-tahfidz-green mb-3" />
              <p className="text-lg font-semibold mb-4">{t("scanned")}</p>
              <button
                onClick={() => restartScanner()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green hover:bg-tahfidz-green/90 text-white rounded-xl text-sm font-medium transition"
              >
                <RefreshCw size={16} />
                {t("resumeScan")}
              </button>
            </div>
          )}

          {error && !scanned && !showConfirm && (
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

          {/* Overlay de confirmation inline */}
          <AnimatePresence>
            {showConfirm && pendingStudent && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                <div className="w-20 h-20 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden mb-4 ring-4 ring-tahfidz-green/10">
                  {pendingStudent.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pendingStudent.avatar} alt={pendingStudent.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={36} className="text-gray-400" />
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tahfidz-green/10 text-tahfidz-green text-xs font-medium mb-2">
                  <ShieldCheck size={12} />
                  {t("studentDetected")}
                </div>

                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{pendingStudent.fullName}</h2>
                {pendingStudent.groupName && (
                  <div className="flex items-center justify-center gap-2 mt-1 text-gray-500 text-sm">
                    <Users size={14} />
                    <span>{pendingStudent.groupName}</span>
                  </div>
                )}

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 mb-5">{t("confirmToValidate")}</p>

                <div className="w-full max-w-xs space-y-3">
                  <button
                    onClick={confirmPending}
                    disabled={confirmBusy}
                    className="w-full py-3.5 px-4 bg-tahfidz-green hover:bg-tahfidz-green/90 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {confirmBusy ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                    {t("confirm")}
                  </button>
                  <button
                    onClick={() => restartScanner()}
                    disabled={confirmBusy}
                    className="w-full py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <X size={18} />
                    {t("cancel")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Contrôles */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={handleSwitchCamera}
              title={t("switchCamera")}
              className="inline-flex items-center justify-center gap-2 px-3 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">{t("switchCamera")}</span>
            </button>

            <button
              onClick={handleToggleTorch}
              title={t("torch")}
              className={`inline-flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium transition ${
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
              className="inline-flex items-center justify-center gap-2 px-3 py-3 bg-tahfidz-green hover:bg-tahfidz-green/90 text-white rounded-xl text-sm font-medium transition disabled:opacity-60"
            >
              {captureBusy ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
              <span className="hidden sm:inline">{t("capture")}</span>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              title={t("uploadImage")}
              className="inline-flex items-center justify-center gap-2 px-3 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium transition disabled:opacity-60"
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

          {/* Toggles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setAutoConfirm((v) => !v)}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition ${
                autoConfirm
                  ? "bg-tahfidz-green/5 border-tahfidz-green/20 dark:bg-tahfidz-green/10 dark:border-tahfidz-green/30"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${autoConfirm ? "text-tahfidz-green" : "text-gray-700 dark:text-gray-200"}`}>
                  {t("autoConfirm")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("autoConfirmHint")}</p>
              </div>
              {autoConfirm ? <ToggleRight size={28} className="text-tahfidz-green shrink-0" /> : <ToggleLeft size={28} className="text-gray-400 shrink-0" />}
            </button>

            <button
              onClick={() => setContinuousScan((v) => !v)}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition ${
                continuousScan
                  ? "bg-tahfidz-green/5 border-tahfidz-green/20 dark:bg-tahfidz-green/10 dark:border-tahfidz-green/30"
                  : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
              }`}
            >
              <div>
                <p className={`text-sm font-semibold ${continuousScan ? "text-tahfidz-green" : "text-gray-700 dark:text-gray-200"}`}>
                  {t("continuousScan")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("continuousScanHint")}</p>
              </div>
              {continuousScan ? <ToggleRight size={28} className="text-tahfidz-green shrink-0" /> : <ToggleLeft size={28} className="text-gray-400 shrink-0" />}
            </button>
          </div>

          {/* Saisie manuelle */}
          <form onSubmit={handleManualVerify} className="pt-2 border-t border-gray-100 dark:border-gray-800">
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
      </div>

      {/* Historique */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <History size={18} className="text-gray-500" />
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">{t("history")}</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-400">{todayHistory.length}</span>
            {todayHistory.length > 0 && (
              <button
                onClick={handleEndSession}
                title={t("endSession")}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 rounded-lg transition"
              >
                <Trash2 size={12} />
                {t("endSession")}
              </button>
            )}
          </div>
        </div>

        {todayHistory.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-6 text-center text-sm text-gray-500">
            {t("historyEmpty")}
          </div>
        ) : (
          <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-1">
            {todayHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm"
              >
                <div className={`w-10 h-10 mt-0.5 rounded-full flex items-center justify-center shrink-0 ${
                  item.status === "success" ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                }`}>
                  {item.status === "success" ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-words leading-snug">{item.studentName}</p>
                  {item.groupName && <p className="text-xs text-gray-500 break-words leading-snug">{item.groupName}</p>}
                  {item.status === "error" && item.error && (
                    <p className="text-xs text-red-500 break-words leading-snug">{item.error}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 shrink-0 pt-1">
                  <Clock size={12} />
                  {formatTimeAgo(item.timestamp, t)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Toast / étiquette rapide */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 shadow-2xl flex flex-col items-center text-center min-w-[18rem] max-w-[92vw] overflow-hidden ${
              toast.type === "success"
                ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl"
                : toast.type === "info"
                ? "bg-gray-900 text-white rounded-2xl"
                : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 rounded-2xl"
            }`}
          >
            {toast.type === "success" && (
              <div className="w-full bg-white/10 py-2 px-4 flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-white" />
                {toast.badge && (
                  <span className="text-xs font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                    {toast.badge}
                  </span>
                )}
              </div>
            )}
            <div className="px-6 py-4 flex items-center gap-3">
              {toast.type !== "success" && (
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  toast.type === "info"
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"
                }`}>
                  {toast.type === "info" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold truncate ${toast.type === "success" ? "text-lg" : "text-sm"}`}>{toast.title}</p>
                {toast.message && <p className="text-xs opacity-90 truncate mt-0.5">{toast.message}</p>}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
