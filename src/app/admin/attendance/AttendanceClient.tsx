"use client"
// src/app/admin/attendance/AttendanceClient.tsx
// UI complète : aperçu des présences + exports CSV / Excel / PDF.

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Calendar,
  CalendarCheck,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Search,
  Settings2,
} from "lucide-react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { cn } from "@/lib/utils"

// ─── Types ──────────────────────────────────────────────────────────────────
type Preset = "day" | "week" | "month" | "custom"
type ExportFormat = "xlsx" | "pdf"
type Locale = "fr" | "en" | "ar"

interface SchoolInfo {
  id: string
  name: string
  nameAr?: string | null
  logo?: string | null
  address?: string | null
  city?: string | null
  country?: string | null
  phone?: string | null
}

interface Group {
  id: string
  name: string
  _count?: { students: number }
  teacher: { user: { fullName: string } }
}

interface StudentPreview {
  id: string
  fullName: string
  fullNameAr: string | null
  dates: Record<string, string>
  stats: { present: number; absent: number; late: number; excused: number; total: number; rate: number }
}

interface GroupPreview {
  id: string
  name: string
  teacherName: string
  schedule: Record<string, string>
  students: StudentPreview[]
}

interface PreviewData {
  groups: GroupPreview[]
  dateList: string[]
}

interface Props {
  school: SchoolInfo | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function loadImageBase64(url?: string | null): Promise<string | null> {
  if (!url) return null
  try {
    const res = await fetch(url, { mode: "cors" })
    const blob = await res.blob()
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function containsArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s)
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function fmtDate(d: string, L: Locale) {
  return new Date(`${d}T12:00:00`).toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "short" }
  )
}

function fmtLongDate(d: string, L: Locale) {
  return new Date(`${d}T12:00:00`).toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "2-digit", month: "long", year: "numeric" }
  )
}

function computeDates(p: Preset) {
  const today = new Date()
  const todayStr = toDateKey(today)
  let from = todayStr
  if (p === "week") {
    const d = new Date(today); d.setDate(d.getDate() - 6)
    from = toDateKey(d)
  } else if (p === "month") {
    const d = new Date(today); d.setDate(d.getDate() - 29)
    from = toDateKey(d)
  }
  return { from, to: todayStr }
}

const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

function isCourseDay(dateStr: string, schedule: Record<string, string>) {
  const d = new Date(`${dateStr}T12:00:00`)
  return !!schedule[DAY_KEYS[d.getDay()]]
}

// ─── Composant principal ────────────────────────────────────────────────────
export default function AttendanceClient({ school }: Props) {
  const { locale } = useLanguage()
  const L = locale as Locale
  const t = useT("attendanceXX")

  const [groups, setGroups] = useState<Group[]>([])
  const [selGroup, setSelGroup] = useState<string>("all")
  const [preset, setPreset] = useState<Preset>("week")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [exportScope, setExportScope] = useState<"group" | "all">("all")
  const [showOnlyCourseDays, setShowOnlyCourseDays] = useState(true)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const initializedCollapse = useRef(false)

  // ── Chargement initial des groupes ───────────────────────────────────────
  useEffect(() => {
    fetch("/api/groups")
      .then(r => r.json())
      .then(d => {
        const g = d.groups || []
        setGroups(g)
      })
      .catch(() => setError(t("errorGroups")))
  }, [t])

  // ── Initialisation des dates ─────────────────────────────────────────────
  useEffect(() => {
    const { from, to } = computeDates(preset)
    setDateFrom(from)
    setDateTo(to)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Chargement de l'aperçu ───────────────────────────────────────────────
  const loadPreview = useCallback(async () => {
    if (!dateFrom || !dateTo || groups.length === 0) return
    setLoadingPreview(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        groupId: selGroup || "all",
        dateFrom: `${dateFrom}T00:00:00.000Z`,
        dateTo: `${dateTo}T23:59:59.999Z`,
      })
      const res = await fetch(`/api/attendance/preview?${params}`)
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || `Erreur ${res.status}`)
      }
      const data: PreviewData = await res.json()
      setPreview(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorDownload"))
    } finally {
      setLoadingPreview(false)
    }
  }, [dateFrom, dateTo, selGroup, groups.length, t])

  useEffect(() => {
    const timer = setTimeout(loadPreview, 300)
    return () => clearTimeout(timer)
  }, [loadPreview])

  // Réduire tous les groupes par défaut au premier chargement de l'aperçu
  useEffect(() => {
    if (preview && !initializedCollapse.current) {
      initializedCollapse.current = true
      setCollapsedGroups(new Set(preview.groups.map(g => g.id)))
    }
  }, [preview])

  // Développer automatiquement le groupe sélectionné
  useEffect(() => {
    if (selGroup && selGroup !== "all") {
      setCollapsedGroups(prev => {
        const next = new Set(prev)
        next.delete(selGroup)
        return next
      })
    }
  }, [selGroup])

  // Synchronise la portée d'export avec le groupe sélectionné
  useEffect(() => {
    if (selGroup === "all") {
      setExportScope("all")
    } else {
      setExportScope("group")
    }
  }, [selGroup])

  // Si on choisit "Tous les groupes" à l'export, on remet le filtre sur "Tous"
  useEffect(() => {
    if (exportScope === "all" && selGroup !== "all") {
      setSelGroup("all")
    }
  }, [exportScope, selGroup])

  // ── Gestion des presets ──────────────────────────────────────────────────
  const handlePreset = (p: Preset) => {
    setPreset(p)
    if (p !== "custom") {
      const { from, to } = computeDates(p)
      setDateFrom(from)
      setDateTo(to)
    }
  }

  const resetMsgs = () => { setError(null); setSuccess(null) }

  const getGroupDateList = useCallback((group: GroupPreview) => {
    if (!preview) return []
    if (!showOnlyCourseDays) return preview.dateList
    return preview.dateList.filter(d => isCourseDay(d, group.schedule))
  }, [preview, showOnlyCourseDays])

  // ── Stats globales (recalculées selon le filtre "Jours de cours") ────────
  const globalStats = useMemo(() => {
    if (!preview) return null
    let present = 0, absent = 0, late = 0, excused = 0
    let totalStudents = 0
    preview.groups.forEach(g => {
      const groupDates = getGroupDateList(g)
      g.students.forEach(s => {
        groupDates.forEach(d => {
          const status = s.dates[d]
          if (status === "PRESENT") present++
          else if (status === "ABSENT") absent++
          else if (status === "LATE") late++
          else if (status === "EXCUSED") excused++
        })
        totalStudents++
      })
    })
    const total = present + absent + late + excused
    const rate = total > 0 ? Math.round(((present + late) / total) * 100) : 0
    return { present, absent, late, excused, total, rate, totalStudents }
  }, [preview, getGroupDateList])

  // ── Export Excel (client) ────────────────────────────────────────────────
  const exportExcel = async (allGroups: boolean) => {
    resetMsgs()
    if (!preview) { setError(t("noAttendance")); return }

    const groupsToExport = allGroups ? preview.groups : preview.groups.filter(g => g.id === selGroup)
    if (groupsToExport.length === 0) { setError(t("noAttendance")); return }

    setBusy(true)
    try {
      const ExcelJS = await import("exceljs")
      const wb = new ExcelJS.Workbook()

      const logoBase64 = await loadImageBase64(school?.logo)

      for (const group of groupsToExport) {
        const ws = wb.addWorksheet(group.name.slice(0, 31))

        // Logo
        if (logoBase64) {
          try {
            const imageId = wb.addImage({ base64: logoBase64, extension: "png" })
            ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 80, height: 60 } })
          } catch {}
        }

        // Infos école
        ws.mergeCells("B1:F1")
        ws.getCell("B1").value = schoolDisplayName()
        ws.getCell("B1").font = { size: 14, bold: true }
        ws.getCell("B1").alignment = { vertical: "middle" }

        ws.mergeCells("B2:F2")
        ws.getCell("B2").value = schoolAddress()
        ws.getCell("B2").font = { size: 10, color: { argb: "FF6B7280" } }

        // Titre
        ws.mergeCells("A4:F4")
        ws.getCell("A4").value = `${t("title")} — ${group.name}`
        ws.getCell("A4").font = { size: 13, bold: true, color: { argb: "FF111827" } }

        // Période
        ws.mergeCells("A5:F5")
        ws.getCell("A5").value = `${t("periodRange")} : ${fmtLongDate(dateFrom, L)} → ${fmtLongDate(dateTo, L)}`
        ws.getCell("A5").font = { size: 10, color: { argb: "FF6B7280" } }

        const dateList = getGroupDateList(group)
        const headerRow = [
          t("fullName") || "Nom",
          t("fullNameAr") || "Nom arabe",
          ...dateList.map(d => fmtDate(d, L)),
          statusLabelWord("PRESENT", L),
          statusLabelWord("ABSENT", L),
          statusLabelWord("LATE", L),
          statusLabelWord("EXCUSED", L),
          "%",
        ]
        const startRow = 7

        // En-tête
        headerRow.forEach((h, i) => {
          const cell = ws.getCell(startRow, i + 1)
          cell.value = h
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }
          cell.alignment = { horizontal: "center", vertical: "middle" }
          cell.border = {
            top: { style: "thin", color: { argb: "FF059669" } },
            bottom: { style: "thin", color: { argb: "FF059669" } },
            left: { style: "thin", color: { argb: "FF059669" } },
            right: { style: "thin", color: { argb: "FF059669" } },
          }
        })

        // Lignes
        group.students.forEach((s, idx) => {
          const rowIdx = startRow + idx + 1
          const bg = idx % 2 === 0 ? "FFFFFFFF" : "FFF0FDF4"
          const values = [
            s.fullName,
            s.fullNameAr || "",
            ...dateList.map(d => statusLabelWord(s.dates[d], L)),
            s.stats.present,
            s.stats.absent,
            s.stats.late,
            s.stats.excused,
            s.stats.rate / 100,
          ]
          values.forEach((v, i) => {
            const cell = ws.getCell(rowIdx, i + 1)
            cell.value = v
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bg } }
            cell.border = {
              top: { style: "thin", color: { argb: "FFE5E7EB" } },
              bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
              left: { style: "thin", color: { argb: "FFE5E7EB" } },
              right: { style: "thin", color: { argb: "FFE5E7EB" } },
            }
            cell.alignment = { horizontal: i >= 2 ? "center" : "left", vertical: "middle" }
            if (i === values.length - 1) cell.numFmt = "0%"
          })
        })

        // Largeurs
        ws.getColumn(1).width = 28
        ws.getColumn(2).width = 22
        for (let i = 3; i <= headerRow.length; i++) ws.getColumn(i).width = 9

        ws.views = [{ state: "frozen", ySplit: startRow }]
      }

      const buffer = await wb.xlsx.writeBuffer()
      const suffix = allGroups ? "tous_groupes" : groupsToExport[0].name.replace(/\s+/g, "_")
      downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `presences_${suffix}_${dateFrom}_${dateTo}.xlsx`)
      setSuccess(t("successMsg"))
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorDownload"))
    } finally {
      setBusy(false)
    }
  }

  // ── Export PDF (client) ──────────────────────────────────────────────────
  const exportPdf = async (allGroups: boolean) => {
    resetMsgs()
    if (!preview) { setError(t("noAttendance")); return }

    const groupsToExport = allGroups ? preview.groups : preview.groups.filter(g => g.id === selGroup)
    if (groupsToExport.length === 0) { setError(t("noAttendance")); return }

    setBusy(true)
    try {
      const logoBase64 = await loadImageBase64(school?.logo)

      const container = document.createElement("div")
      container.style.cssText = "position:absolute;left:-9999px;top:-9999px;width:1122px;padding:24px;background:#ffffff;font-family:Arial,DejaVu Sans,sans-serif;"

      let html = `
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
          ${logoBase64 ? `<img src="${logoBase64}" style="max-width:70px;max-height:60px;" />` : ""}
          <div>
            <div style="font-size:18px;font-weight:700;color:#111827;">${escapeHtml(schoolDisplayName())}</div>
            <div style="font-size:11px;color:#6b7280;">${escapeHtml(schoolAddress())}</div>
          </div>
        </div>
        <div style="height:2px;background:#d1fae5;margin-bottom:16px;"></div>
        <div style="font-size:18px;font-weight:700;color:#111827;margin-bottom:4px;">${escapeHtml(t("title") as string)}</div>
        <div style="font-size:11px;color:#6b7280;margin-bottom:14px;">${escapeHtml(t("periodRange") as string)} : ${escapeHtml(fmtLongDate(dateFrom, L))} → ${escapeHtml(fmtLongDate(dateTo, L))}</div>
      `

      groupsToExport.forEach(group => {
        const dateList = getGroupDateList(group)
        html += `<div style="margin-bottom:20px;">
          <div style="font-size:14px;font-weight:600;color:#374151;margin-bottom:8px;">${escapeHtml(group.name)} — ${escapeHtml(group.teacherName)}</div>
          <table style="width:100%;border-collapse:collapse;table-layout:fixed;font-size:10px;">
            <colgroup><col style="width:110px;" /><col style="width:80px;" />${dateList.map(() => `<col style="width:54px;" />`).join("")}<col style="width:28px;" /><col style="width:28px;" /><col style="width:28px;" /><col style="width:28px;" /><col style="width:32px;" /></colgroup>
            <thead>
              <tr>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:left;border:1px solid #059669;">${escapeHtml(t("fullName") as string || "Nom")}</th>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:left;border:1px solid #059669;">${escapeHtml(t("fullNameAr") as string || "Nom arabe")}</th>
                ${dateList.map(d => `<th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;">${escapeHtml(fmtDate(d, L))}</th>`).join("")}
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;white-space:nowrap;">${escapeHtml(statusLabelWord("PRESENT", L))}</th>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;white-space:nowrap;">${escapeHtml(statusLabelWord("ABSENT", L))}</th>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;white-space:nowrap;">${escapeHtml(statusLabelWord("LATE", L))}</th>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;white-space:nowrap;">${escapeHtml(statusLabelWord("EXCUSED", L))}</th>
                <th style="padding:5px;background:#059669;color:#fff;font-weight:600;text-align:center;border:1px solid #059669;">%</th>
              </tr>
            </thead>
            <tbody>
              ${group.students.map((s, idx) => {
                const bg = idx % 2 === 0 ? "#ffffff" : "#f0fdf4"
                return `<tr>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};font-size:10px;direction:${containsArabic(s.fullName) ? "rtl" : "ltr"};text-align:${containsArabic(s.fullName) ? "right" : "left"};">${escapeHtml(s.fullName)}</td>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};font-size:10px;direction:rtl;text-align:right;">${escapeHtml(s.fullNameAr || "")}</td>
                  ${dateList.map(d => {
                    const st = s.dates[d]
                    const color = st === "PRESENT" ? "#059669" : st === "ABSENT" ? "#dc2626" : st === "LATE" ? "#ea580c" : st === "EXCUSED" ? "#2563eb" : "#9ca3af"
                    const label = st ? statusLabelWord(st, L) : "—"
                    return `<td style="padding:4px;border:1px solid #e5e7eb;background:${bg};color:${color};font-weight:700;text-align:center;font-size:9px;white-space:nowrap;">${escapeHtml(label)}</td>`
                  }).join("")}
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};text-align:center;font-size:10px;">${s.stats.present}</td>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};text-align:center;font-size:10px;">${s.stats.absent}</td>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};text-align:center;font-size:10px;">${s.stats.late}</td>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};text-align:center;font-size:10px;">${s.stats.excused}</td>
                  <td style="padding:4px;border:1px solid #e5e7eb;background:${bg};text-align:center;font-size:10px;">${s.stats.rate}%</td>
                </tr>`
              }).join("")}
            </tbody>
          </table>
        </div>`
      })

      container.innerHTML = html
      document.body.appendChild(container)

      try {
        const html2canvas = (await import("html2canvas")).default
        const canvas = await html2canvas(container, { scale: 2, useCORS: true, allowTaint: true })
        const { jsPDF } = await import("jspdf")
        const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

        const imgData = canvas.toDataURL("image/png")
        const pdfWidth = 297
        const pdfHeight = 210
        const imgWidth = canvas.width
        const imgHeight = canvas.height
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
        const scaledWidth = imgWidth * ratio
        const scaledHeight = imgHeight * ratio

        let heightLeft = scaledHeight
        let position = 0

        doc.addImage(imgData, "PNG", 0, position, scaledWidth, scaledHeight)
        heightLeft -= pdfHeight

        while (heightLeft > 0) {
          position = heightLeft - scaledHeight
          doc.addPage()
          doc.addImage(imgData, "PNG", 0, position, scaledWidth, scaledHeight)
          heightLeft -= pdfHeight
        }

        const suffix = allGroups ? "tous_groupes" : groupsToExport[0].name.replace(/\s+/g, "_")
        doc.save(`presences_${suffix}_${dateFrom}_${dateTo}.pdf`)
      } finally {
        document.body.removeChild(container)
      }

      setSuccess(t("successMsg"))
    } catch (e) {
      setError(e instanceof Error ? e.message : t("errorDownload"))
    } finally {
      setBusy(false)
    }
  }

  // ── Helpers d'affichage école ────────────────────────────────────────────
  function schoolDisplayName() {
    if (L === "ar" && school?.nameAr) return school.nameAr
    return school?.name || ""
  }

  function schoolAddress() {
    const parts = [school?.address, school?.city, school?.country, school?.phone].filter(Boolean)
    return parts.join(" • ")
  }

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // ── Rendu ────────────────────────────────────────────────────────────────
  const currentGroup = groups.find(g => g.id === selGroup)
  const isRtl = L === "ar"

  const PRESETS: { id: Preset; icon: React.ElementType; label: string; desc: string }[] = [
    { id: "day",    icon: Calendar,       label: t("day") as string,    desc: t("dayDesc") as string },
    { id: "week",   icon: CalendarDays,   label: t("week") as string,   desc: t("weekDesc") as string },
    { id: "month",  icon: CalendarRange,  label: t("month") as string,  desc: t("monthDesc") as string },
    { id: "custom", icon: Settings2,      label: t("custom") as string, desc: t("customDesc") as string },
  ]

  const handleExport = async (format: ExportFormat) => {
    const allGroups = exportScope === "all"
    if (format === "xlsx") await exportExcel(allGroups)
    else if (format === "pdf") await exportPdf(allGroups)
  }

  return (
    <div className="space-y-6 max-w-6xl" dir={isRtl ? "rtl" : "ltr"}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t("title")}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t("subtitle")}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span className="break-all">{error}</span>
        </div>
      )}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-700 dark:text-green-300 text-sm">
          <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Période */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Calendar size={18} className="text-tahfidz-green" /> {t("periodTitle")}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {PRESETS.map(p => {
            const Icon = p.icon
            const active = preset === p.id
            return (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center",
                  active
                    ? "border-tahfidz-green bg-tahfidz-green-light text-tahfidz-green"
                    : "border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                )}>
                <Icon size={22} className={active ? "text-tahfidz-green" : "text-gray-400"} />
                <span className="text-sm font-semibold">{p.label}</span>
                <span className="text-xs text-gray-400">{p.desc}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("from")}</label>
            <input
              type="date"
              value={dateFrom}
              max={toDateKey(new Date())}
              onChange={e => { setDateFrom(e.target.value); setPreset("custom") }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("to")}</label>
            <input
              type="date"
              value={dateTo}
              max={toDateKey(new Date())}
              onChange={e => { setDateTo(e.target.value); setPreset("custom") }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green"
            />
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          <CalendarDays size={14} />
          {t("periodRange")} :
          <strong className="text-gray-700 dark:text-gray-300">{fmtLongDate(dateFrom, L)}</strong>
          <span>→</span>
          <strong className="text-gray-700 dark:text-gray-300">{fmtLongDate(dateTo, L)}</strong>
        </p>
      </section>

      {/* Groupe */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <CalendarCheck size={18} className="text-tahfidz-green" /> {t("groupTitle")}
        </h2>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={selGroup}
            onChange={e => setSelGroup(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green appearance-none"
          >
            <option value="all">{t("allGroups") || "Tous les groupes"}</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>
                {g.name} — {g.teacher.user.fullName} ({g._count?.students ?? 0} {t("students")})
              </option>
            ))}
          </select>
        </div>

        {currentGroup && selGroup !== "all" && (
          <div className="mt-4 p-3 bg-tahfidz-green-light dark:bg-emerald-900/20 rounded-xl text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <CalendarCheck size={16} className="text-tahfidz-green" />
            <span>{t("groupInfo")} : <strong>{currentGroup.name}</strong> · {t("teacher")} : <strong>{currentGroup.teacher.user.fullName}</strong></span>
          </div>
        )}
      </section>

      {/* Stats */}
      {globalStats && globalStats.total > 0 && (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label={t("globalRate") as string} value={`${globalStats.rate}%`} color="emerald" />
          <StatCard label={t("totalPresent") as string} value={globalStats.present} color="green" />
          <StatCard label={t("totalAbsent") as string} value={globalStats.absent} color="red" />
          <StatCard label={t("totalLate") as string} value={globalStats.late} color="orange" />
        </section>
      )}

      {/* Aperçu */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <CalendarCheck size={18} className="text-tahfidz-green" /> {t("previewTitle")}
          </h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyCourseDays}
                onChange={e => setShowOnlyCourseDays(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-tahfidz-green focus:ring-tahfidz-green"
              />
              {t("onlyCourseDays") || "Jours de cours uniquement"}
            </label>
            {loadingPreview && <Loader2 size={18} className="animate-spin text-tahfidz-green" />}
          </div>
        </div>

        {!preview || preview.groups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <CalendarCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>{loadingPreview ? t("previewLoading") : t("previewEmpty")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5 space-y-3">
            {preview.groups.map(group => {
              const isCollapsed = collapsedGroups.has(group.id)
              const groupDates = getGroupDateList(group)
              return (
                <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-tahfidz-green" />
                      <span className="font-semibold text-gray-800 dark:text-gray-100">{group.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">— {group.teacherName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                        {group.students.length} {t("students")}
                      </span>
                    </div>
                    {isCollapsed ? <ChevronDown size={18} className="text-gray-400" /> : <ChevronUp size={18} className="text-gray-400" />}
                  </button>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="p-4">
                          {group.students.length === 0 ? (
                            <p className="text-sm text-gray-400">{t("noAttendance")}</p>
                          ) : groupDates.length === 0 ? (
                            <p className="text-sm text-gray-400">{t("noCourseDays") || "Aucun jour de cours dans cette période."}</p>
                          ) : (
                            <table className="w-full border-collapse text-sm min-w-[600px]">
                              <thead>
                                <tr className="bg-emerald-50 dark:bg-emerald-900/20">
                                  <th className="sticky left-0 z-10 px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/30">
                                    {t("fullName") || "Nom"}
                                  </th>
                                  {groupDates.map(d => (
                                    <th key={d} className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                                      {fmtDate(d, L)}
                                    </th>
                                  ))}
                                  <th className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-nowrap">{statusLabelWord("PRESENT", L)}</th>
                                  <th className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-nowrap">{statusLabelWord("ABSENT", L)}</th>
                                  <th className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-nowrap">{statusLabelWord("LATE", L)}</th>
                                  <th className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 whitespace-nowrap">{statusLabelWord("EXCUSED", L)}</th>
                                  <th className="px-2 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700">%</th>
                                </tr>
                              </thead>
                              <tbody>
                                {group.students.map((s, idx) => (
                                  <tr key={s.id} className={idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800/50"}>
                                    <td className="sticky left-0 z-10 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-inherit font-medium text-gray-800 dark:text-gray-200">
                                      {s.fullName}
                                    </td>
                                    {groupDates.map(d => (
                                      <td key={d} className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center">
                                        <StatusBadge status={s.dates[d]} L={L} />
                                      </td>
                                    ))}
                                    <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center text-green-600 font-semibold">{s.stats.present}</td>
                                    <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center text-red-600 font-semibold">{s.stats.absent}</td>
                                    <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center text-orange-600 font-semibold">{s.stats.late}</td>
                                    <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center text-blue-600 font-semibold">{s.stats.excused}</td>
                                    <td className="px-2 py-2 border border-gray-200 dark:border-gray-700 text-center font-semibold text-gray-700 dark:text-gray-300">{s.stats.rate}%</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Export */}
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          <Download size={18} className="text-tahfidz-green" /> {t("downloadTitle")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Portée */}
          <div className="relative">
            <select
              value={exportScope}
              onChange={e => setExportScope(e.target.value as "group" | "all")}
              className="w-full pl-3 pr-8 py-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-tahfidz-green appearance-none"
            >
              <option value="group" disabled={selGroup === "all"}>
                {selGroup === "all"
                  ? t("exportThisGroup")
                  : `${t("exportThisGroup")} (${currentGroup?.name})`}
              </option>
              <option value="all">{t("exportAllGroups")}</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Excel */}
          <button
            onClick={() => handleExport("xlsx")}
            disabled={busy}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border",
              "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30",
              busy && "opacity-60 cursor-not-allowed"
            )}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            {t("exportXlsx")}
          </button>

          {/* PDF */}
          <button
            onClick={() => handleExport("pdf")}
            disabled={busy}
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all border",
              "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30",
              busy && "opacity-60 cursor-not-allowed"
            )}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <FileText size={18} />}
            {t("exportPdf")}
          </button>
        </div>
      </section>
    </div>
  )
}

// ─── Sous-composants ──────────────────────────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string | number; color: "emerald" | "green" | "red" | "orange" }) {
  const colors = {
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-800",
    green:   "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-100 dark:border-green-800",
    red:     "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-100 dark:border-red-800",
    orange:  "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-800",
  }
  return (
    <div className={cn("rounded-2xl border p-4", colors[color])}>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium opacity-80 mt-1">{label}</div>
    </div>
  )
}

function StatusBadge({ status, L }: { status?: string; L: Locale }) {
  if (!status) return <span className="text-gray-300">—</span>
  const map: Record<string, { label: string; class: string }> = {
    PRESENT: { label: statusLabelWord("PRESENT", L), class: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
    ABSENT:  { label: statusLabelWord("ABSENT", L),  class: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
    LATE:    { label: statusLabelWord("LATE", L),    class: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
    EXCUSED: { label: statusLabelWord("EXCUSED", L), class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  }
  const s = map[status] || { label: status, class: "bg-gray-100 text-gray-600" }
  return (
    <span className={cn("inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold whitespace-nowrap", s.class)}>
      {s.label}
    </span>
  )
}

function statusLabelWord(status: string, L: Locale) {
  const map: Record<string, Record<Locale, string>> = {
    PRESENT: { fr: "Présent", en: "Present", ar: "حاضر" },
    ABSENT:  { fr: "Absent",  en: "Absent",  ar: "غائب" },
    LATE:    { fr: "Retard",  en: "Late",    ar: "متأخر" },
    EXCUSED: { fr: "Excusé",  en: "Excused", ar: "معذور" },
  }
  return map[status]?.[L] || status
}

