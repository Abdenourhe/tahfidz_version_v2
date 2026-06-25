"use client"
// src/components/admin/ExportStudentsButton.tsx
// Bouton d'export "pro" : multi-formats (Excel/CSV/PDF), portée filtrée/tous,
// sélection des colonnes et documents professionnels avec identité école.

import { useState, useRef, useEffect, useMemo } from "react"
import { StudentRow, SchoolInfo } from "./students"
import { calculateAge, cn } from "@/lib/utils"
import {
  FileSpreadsheet,
  FileText,
  Download,
  ChevronDown,
  Check,
  Settings2,
  X,
  Columns,
  Filter,
} from "lucide-react"

// ─── Types ──────────────────────────────────────────────────────────────────
type ExportFormat = "xlsx" | "pdf"
type ExportScope = "all" | "filtered"
type Locale = "fr" | "en" | "ar"

interface Props {
  allStudents: StudentRow[]
  filteredStudents: StudentRow[]
  locale: Locale
  school?: SchoolInfo
}

interface ColumnDef {
  key: string
  label: Record<Locale, string>
  getValue: (s: StudentRow, L: Locale) => string | number
  default?: boolean
}

// ─── i18n local ─────────────────────────────────────────────────────────────
const T = {
  exportLabel:       { fr: "Exporter",          en: "Export",            ar: "تصدير" },
  exportExcel:       { fr: "Excel (.xlsx)",     en: "Excel (.xlsx)",     ar: "Excel (.xlsx)" },
  exportCsv:         { fr: "CSV (.csv)",        en: "CSV (.csv)",        ar: "CSV (.csv)" },
  exportPdf:         { fr: "PDF (.pdf)",        en: "PDF (.pdf)",        ar: "PDF (.pdf)" },
  configureExport:   { fr: "Configurer l'export", en: "Configure export", ar: "تكوين التصدير" },
  scope:             { fr: "Portée",            en: "Scope",             ar: "النطاق" },
  scopeAll:          { fr: "Tous les élèves",   en: "All students",      ar: "جميع الطلاب" },
  scopeFiltered:     { fr: "Résultats filtrés", en: "Filtered results",  ar: "النتائج المصفاة" },
  columns:           { fr: "Colonnes",          en: "Columns",           ar: "الأعمدة" },
  export:            { fr: "Exporter",          en: "Export",            ar: "تصدير" },
  cancel:            { fr: "Annuler",           en: "Cancel",            ar: "إلغاء" },
  exportTitle:       { fr: "Liste des élèves",  en: "Student list",      ar: "قائمة الطلاب" },
  active:            { fr: "Actif",             en: "Active",            ar: "نشط" },
  inactive:          { fr: "Inactif",           en: "Inactive",          ar: "غير نشط" },
  generatedOn:       { fr: "Généré le",         en: "Generated on",      ar: "تم إنشاؤه بتاريخ" },
  total:             { fr: "Total",             en: "Total",             ar: "الإجمالي" },
  noData:            { fr: "Aucune donnée à exporter", en: "No data to export", ar: "لا توجد بيانات للتصدير" },
  selectAll:         { fr: "Tout sélectionner",     en: "Select all",        ar: "تحديد الكل" },
  deselectAll:       { fr: "Tout désélectionner",   en: "Deselect all",      ar: "إلغاء التحديد" },
}

function t(k: keyof typeof T, L: Locale): string {
  return T[k][L] ?? T[k].fr
}

// ─── Définition des colonnes exportables ────────────────────────────────────
function getColumns(): ColumnDef[] {
  return [
    { key: "code",        label: { fr: "Code",       en: "Code",        ar: "الرمز" },       getValue: s => s.studentCode, default: true },
    { key: "fullName",    label: { fr: "Nom",        en: "Name",        ar: "الاسم" },       getValue: s => s.user.fullName, default: true },
    { key: "fullNameAr",  label: { fr: "Nom arabe",  en: "Arabic name", ar: "الاسم العربي" }, getValue: s => s.user.fullNameAr || "", default: true },
    { key: "age",         label: { fr: "Âge",        en: "Age",         ar: "العمر" },       getValue: (s, L) => s.dateOfBirth ? `${calculateAge(s.dateOfBirth) ?? ""} ${tYears(L)}` : "", default: true },
    { key: "gender",      label: { fr: "Genre",      en: "Gender",      ar: "الجنس" },      getValue: s => s.user.gender || "", default: true },
    { key: "group",       label: { fr: "Groupe",     en: "Group",       ar: "المجموعة" },    getValue: s => s.group?.name || "", default: true },
    { key: "level",       label: { fr: "Niveau",     en: "Level",       ar: "المستوى" },     getValue: s => s.group?.level || "", default: true },
    { key: "teacher",     label: { fr: "Enseignant", en: "Teacher",     ar: "المعلم" },      getValue: s => s.teacher?.user.fullName || "", default: true },
    { key: "parent",      label: { fr: "Parent",     en: "Parent",      ar: "ولي الأمر" },  getValue: s => s.parentLinks?.[0]?.parent.user.fullName || "", default: true },
    { key: "email",       label: { fr: "Email",      en: "Email",       ar: "البريد" },      getValue: s => s.user.email, default: true },
    { key: "phone",       label: { fr: "Téléphone",  en: "Phone",       ar: "الهاتف" },      getValue: s => s.user.phone || "", default: false },
    { key: "emergency",   label: { fr: "Urgence",    en: "Emergency",   ar: "الطوارئ" },     getValue: s => s.emergencyPhone || "", default: true },
    { key: "status",      label: { fr: "Statut",     en: "Status",      ar: "الحالة" },      getValue: (s, L) => s.user.isActive ? t("active", L) : t("inactive", L), default: true },
    { key: "enrolled",    label: { fr: "Inscrit",    en: "Enrolled",    ar: "تاريخ التسجيل" }, getValue: s => new Date(s.user.createdAt).toLocaleDateString("fr-FR"), default: true },
    { key: "surahs",      label: { fr: "Sourates",   en: "Surahs",      ar: "السور" },       getValue: s => s._count?.memorizedSurahs || 0, default: true },
  ]
}

function tYears(L: Locale): string {
  return { fr: "ans", en: "yrs", ar: "سنة" }[L]
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatFileDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`
}

function levelLabel(level: string | undefined, L: Locale): string {
  if (!level) return ""
  const map: Record<string, Record<Locale, string>> = {
    beginner:     { fr: "Débutant",      en: "Beginner",     ar: "مبتدئ" },
    intermediate: { fr: "Intermédiaire", en: "Intermediate", ar: "متوسط" },
    advanced:     { fr: "Avancé",        en: "Advanced",     ar: "متقدم" },
  }
  return map[level]?.[L] ?? level
}

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

// ─── Composant principal ────────────────────────────────────────────────────
export function ExportStudentsButton({ allStudents, filteredStudents, locale: L, school }: Props) {
  const [open, setOpen] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [format, setFormat] = useState<ExportFormat>("xlsx")
  const [scope, setScope] = useState<ExportScope>("filtered")
  const [selectedCols, setSelectedCols] = useState<string[]>(() => getColumns().filter(c => c.default !== false).map(c => c.key))
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(() => getColumns(), [])
  const scopeStudents = scope === "filtered" ? filteredStudents : allStudents

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const toggleColumn = (key: string) => {
    setSelectedCols(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  const activeColumns = useMemo(() => columns.filter(c => selectedCols.includes(c.key)), [columns, selectedCols])

  const doExport = async () => {
    if (scopeStudents.length === 0) {
      alert(t("noData", L))
      return
    }
    setLoading(true)
    try {
      if (format === "xlsx") await exportExcel(scopeStudents, activeColumns, L, school)
      else if (format === "pdf") await exportPdf(scopeStudents, activeColumns, L, school)
      setOpen(false)
      setShowConfig(false)
    } finally {
      setLoading(false)
    }
  }

  const quickExport = async (fmt: ExportFormat) => {
    setFormat(fmt)
    if (scopeStudents.length === 0) {
      alert(t("noData", L))
      return
    }
    setLoading(true)
    try {
      if (fmt === "xlsx") await exportExcel(scopeStudents, activeColumns, L, school)
      else if (fmt === "pdf") await exportPdf(scopeStudents, activeColumns, L, school)
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const isRtl = L === "ar"

  return (
    <div ref={menuRef} className="relative" dir={isRtl ? "rtl" : "ltr"}>
      {/* Bouton principal */}
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className={cn(
          "flex items-center gap-2 pl-4 pr-3 py-2 rounded-xl text-sm font-semibold text-white transition-all shadow-lg",
          "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500",
          "hover:shadow-emerald-500/25 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        )}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Download size={16} />
        )}
        <span>{t("exportLabel", L)}</span>
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {/* Menu déroulant */}
      {open && (
        <div
          className={cn(
            "absolute z-50 mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-1.5",
            isRtl ? "left-0" : "right-0"
          )}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {t("exportLabel", L)}
          </div>

          <MenuItem
            icon={FileSpreadsheet}
            label={t("exportExcel", L)}
            active={format === "xlsx"}
            onClick={() => quickExport("xlsx")}
          />
          <MenuItem
            icon={FileText}
            label={t("exportPdf", L)}
            active={format === "pdf"}
            onClick={() => quickExport("pdf")}
          />

          <div className="my-1.5 h-px bg-gray-100 dark:bg-gray-800" />

          {/* Portée rapide */}
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t("scope", L)}</p>
            <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
              <ScopeButton active={scope === "filtered"} onClick={() => setScope("filtered")}>
                <Filter size={12} /> {t("scopeFiltered", L)}
              </ScopeButton>
              <ScopeButton active={scope === "all"} onClick={() => setScope("all")}>
                {t("scopeAll", L)}
              </ScopeButton>
            </div>
          </div>

          <div className="my-1.5 h-px bg-gray-100 dark:bg-gray-800" />

          <MenuItem
            icon={Settings2}
            label={t("configureExport", L)}
            onClick={() => setShowConfig(true)}
          />
        </div>
      )}

      {/* Modal de configuration */}
      {showConfig && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfig(false)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Columns size={20} className="text-tahfidz-green" />
                {t("configureExport", L)}
              </h3>
              <button onClick={() => setShowConfig(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Format */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">Format</label>
              <div className="grid grid-cols-2 gap-2">
                <FormatButton format="xlsx" current={format} setFormat={setFormat} label={t("exportExcel", L)} />
                <FormatButton format="pdf" current={format} setFormat={setFormat} label={t("exportPdf", L)} />
              </div>
            </div>

            {/* Scope */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">{t("scope", L)}</label>
              <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1">
                <ScopeButton active={scope === "filtered"} onClick={() => setScope("filtered")}>
                  <Filter size={12} /> {t("scopeFiltered", L)}
                </ScopeButton>
                <ScopeButton active={scope === "all"} onClick={() => setScope("all")}>
                  {t("scopeAll", L)}
                </ScopeButton>
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                {scope === "filtered" ? `${filteredStudents.length} ${t("scopeFiltered", L).toLowerCase()}` : `${allStudents.length} ${t("scopeAll", L).toLowerCase()}`}
              </p>
            </div>

            {/* Colonnes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t("columns", L)}</label>
                <button
                  onClick={() => setSelectedCols(selectedCols.length === columns.length ? [] : columns.map(c => c.key))}
                  className="text-xs text-tahfidz-green hover:underline"
                >
                  {selectedCols.length === columns.length ? t("deselectAll", L) : t("selectAll", L)}
                </button>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 p-2 space-y-1">
                {columns.map(col => {
                  const checked = selectedCols.includes(col.key)
                  return (
                    <label
                      key={col.key}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition",
                        checked ? "bg-emerald-50 dark:bg-emerald-900/20 text-gray-900 dark:text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      <div className={cn(
                        "w-4 h-4 rounded border flex items-center justify-center transition",
                        checked ? "bg-emerald-600 border-emerald-600" : "border-gray-300 dark:border-gray-600"
                      )}>
                        {checked && <Check size={10} className="text-white" />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleColumn(col.key)}
                      />
                      {col.label[L] ?? col.label.fr}
                    </label>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={() => setShowConfig(false)} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                {t("cancel", L)}
              </button>
              <button
                onClick={doExport}
                disabled={loading || selectedCols.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {t("export", L)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composants ────────────────────────────────────────────────────────
function MenuItem({ icon: Icon, label, active, onClick }: { icon: any; label: string; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition text-left",
        active
          ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
          : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
    >
      <Icon size={16} className={active ? "text-emerald-600" : "text-gray-400"} />
      {label}
    </button>
  )
}

function ScopeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium rounded-md transition",
        active
          ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-300 shadow-sm"
          : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
      )}
    >
      {children}
    </button>
  )
}

function FormatButton({ format, current, setFormat, label }: { format: ExportFormat; current: ExportFormat; setFormat: (f: ExportFormat) => void; label: string }) {
  const active = current === format
  return (
    <button
      onClick={() => setFormat(format)}
      className={cn(
        "px-3 py-2 rounded-lg text-xs font-semibold border transition",
        active
          ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
          : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      )}
    >
      {label}
    </button>
  )
}

// ─── Helpers document ───────────────────────────────────────────────────────
function schoolDisplayName(school?: SchoolInfo, L?: Locale): string {
  if (!school) return "TAHFIDZ"
  return (L === "ar" && school.nameAr) ? school.nameAr : school.name
}

function schoolAddress(school?: SchoolInfo): string {
  if (!school) return ""
  return [school.address, school.city, school.country].filter(Boolean).join(", ")
}

async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function getImageFormat(url: string): "PNG" | "JPEG" {
  const ext = url.split(".").pop()?.toLowerCase()
  if (ext === "png") return "PNG"
  return "JPEG"
}

function getImageExtension(url: string): "png" | "jpeg" {
  return getImageFormat(url) === "PNG" ? "png" : "jpeg"
}

function stripDataUrlPrefix(dataUrl: string): string {
  return dataUrl.replace(/^data:image\/[a-z]+;base64,/, "")
}

function safeFileNamePart(school?: SchoolInfo, L?: Locale): string {
  return schoolDisplayName(school, L).replace(/[^a-zA-Z0-9]/g, "_").toLowerCase()
}

// ─── Export Excel ───────────────────────────────────────────────────────────
async function exportExcel(students: StudentRow[], columns: ColumnDef[], L: Locale, school?: SchoolInfo) {
  const ExcelJS = await import("exceljs")
  const wb = new ExcelJS.Workbook()
  const ws = wb.addWorksheet("Elèves")

  const displayName = schoolDisplayName(school, L)
  const address = schoolAddress(school)

  // Logo
  if (school?.logo) {
    const logoBase64 = await loadImageBase64(school.logo)
    if (logoBase64) {
      const imageId = wb.addImage({
        base64: stripDataUrlPrefix(logoBase64),
        extension: getImageExtension(school.logo),
      })
      ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 70, height: 70 } })
    }
  }

  // Métadonnées école
  ws.mergeCells("B1:E1")
  const titleCell = ws.getCell("B1")
  titleCell.value = displayName
  titleCell.font = { name: "Calibri", size: 20, bold: true, color: { argb: "FF059669" } }
  titleCell.alignment = { vertical: "middle" }

  let metaRow = 2
  if (address) {
    ws.mergeCells(`B${metaRow}:E${metaRow}`)
    const cell = ws.getCell(`B${metaRow}`)
    cell.value = address
    cell.font = { size: 11, color: { argb: "FF6B7280" } }
    metaRow++
  }
  if (school?.phone) {
    ws.mergeCells(`B${metaRow}:E${metaRow}`)
    const cell = ws.getCell(`B${metaRow}`)
    cell.value = school.phone
    cell.font = { size: 11, color: { argb: "FF6B7280" } }
    metaRow++
  }
  ws.mergeCells(`B${metaRow}:E${metaRow}`)
  const metaCell = ws.getCell(`B${metaRow}`)
  metaCell.value = `${t("generatedOn", L)} : ${new Date().toLocaleDateString("fr-FR")}  •  ${t("total", L)} : ${students.length}`
  metaCell.font = { size: 10, italic: true, color: { argb: "FF9CA3AF" } }
  metaRow += 2

  // Hauteur lignes en-tête
  ws.getRow(1).height = 30

  // En-têtes de tableau
  const headerRow = ws.getRow(metaRow)
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.label[L] ?? col.label.fr
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true }
    cell.border = {
      top: { style: "thin", color: { argb: "FF059669" } },
      bottom: { style: "thin", color: { argb: "FF059669" } },
      left: { style: "thin", color: { argb: "FFD1FAE5" } },
      right: { style: "thin", color: { argb: "FFD1FAE5" } },
    }
  })
  headerRow.height = 28
  const dataStartRow = metaRow + 1

  // Données
  students.forEach((s, rowIdx) => {
    const row = ws.getRow(dataStartRow + rowIdx)
    columns.forEach((col, colIdx) => {
      let v = col.getValue(s, L)
      if (col.key === "level") v = levelLabel(String(v), L)
      const cell = row.getCell(colIdx + 1)
      cell.value = v as string | number
      cell.alignment = { vertical: "middle", wrapText: true }
      cell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
        bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
        left: { style: "thin", color: { argb: "FFE5E7EB" } },
        right: { style: "thin", color: { argb: "FFE5E7EB" } },
      }
      if (rowIdx % 2 === 0) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF9FAFB" } }
      }
    })
    row.height = 22
  })

  // Largeurs de colonnes
  ws.columns = columns.map(col => {
    const header = col.label[L] ?? col.label.fr
    const maxData = Math.max(
      header.length,
      ...students.map(s => {
        let v = col.getValue(s, L)
        if (col.key === "level") v = levelLabel(String(v), L)
        return String(v ?? "").length
      })
    )
    return { width: Math.min(Math.max(maxData + 2, 12), 35) }
  })

  // Figer l'en-tête et les métadonnées
  ws.views = [{ state: "frozen", ySplit: dataStartRow - 1 }]

  // Filtres automatiques
  ws.autoFilter = { from: { row: dataStartRow - 1, column: 1 }, to: { row: dataStartRow - 1, column: columns.length } }

  // Télécharger
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
  downloadBlob(blob, `eleves_${safeFileNamePart(school, L)}_${formatFileDate()}.xlsx`)
}

// ─── Export PDF ─────────────────────────────────────────────────────────────
async function exportPdf(students: StudentRow[], columns: ColumnDef[], L: Locale, school?: SchoolInfo) {
  const displayName = schoolDisplayName(school, L)
  const address = schoolAddress(school)
  const generatedText = `${t("generatedOn", L)} : ${new Date().toLocaleDateString("fr-FR")}  •  ${t("total", L)} : ${students.length}`
  const titleText = t("exportTitle", L)

  // Construction du HTML professionnel
  const container = document.createElement("div")
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 1080px;
    background: #ffffff;
    padding: 32px 36px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    color: #111827;
    box-sizing: border-box;
  `

  const logoHtml = school?.logo
    ? `<img src="${school.logo}" alt="logo" style="width:70px;height:70px;object-fit:contain;border-radius:8px;" />`
    : `<div style="width:70px;height:70px;background:linear-gradient(135deg,#059669,#14b8a6);border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:22px;">${escapeHtml(displayName.charAt(0))}</div>`

  const addressHtml = [address, school?.phone].filter(Boolean).join(" • ")

  const headerRowHtml = columns.map(col => {
    const label = col.label[L] ?? col.label.fr
    return `<th style="padding:7px 4px;background:#059669;color:#ffffff;font-size:11px;font-weight:600;text-align:center;border:1px solid #059669;word-wrap:break-word;overflow-wrap:break-word;">${escapeHtml(label)}</th>`
  }).join("")

  const bodyRowsHtml = students.map((s, idx) => {
    const bg = idx % 2 === 0 ? "#f9fafb" : "#ffffff"
    const cells = columns.map(col => {
      let v = col.getValue(s, L)
      if (col.key === "level") v = levelLabel(String(v), L)
      const align = typeof v === "number" ? "center" : "left"
      const dir = containsArabic(String(v)) ? "rtl" : "ltr"
      return `<td style="padding:6px 4px;border:1px solid #e5e7eb;background:${bg};font-size:11px;text-align:${align};direction:${dir};word-wrap:break-word;overflow-wrap:break-word;vertical-align:middle;">${escapeHtml(String(v ?? ""))}</td>`
    }).join("")
    return `<tr>${cells}</tr>`
  }).join("")

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:18px;margin-bottom:10px;">
      ${logoHtml}
      <div>
        <div style="font-size:26px;font-weight:700;color:#059669;margin-bottom:3px;">${escapeHtml(displayName)}</div>
        <div style="font-size:12px;color:#6b7280;">${escapeHtml(addressHtml)}</div>
      </div>
    </div>
    <div style="height:2px;background:#d1fae5;margin-bottom:20px;"></div>
    <div style="font-size:20px;font-weight:700;color:#111827;margin-bottom:5px;">${escapeHtml(titleText)}</div>
    <div style="font-size:11px;color:#6b7280;margin-bottom:18px;">${escapeHtml(generatedText)}</div>
    <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
      <thead>${headerRowHtml}</thead>
      <tbody>${bodyRowsHtml}</tbody>
    </table>
  `

  document.body.appendChild(container)

  try {
    const html2canvas = (await import("html2canvas")).default
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
    })

    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const margin = 10
    const imgWidth = pageWidth - margin * 2
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const imgHeight = (imgWidth * canvasHeight) / canvasWidth
    const pageContentHeight = pageHeight - margin * 2
    let heightLeft = imgHeight
    let position = 0
    let pageCount = 0

    while (heightLeft > 0) {
      if (pageCount > 0) doc.addPage()
      const sliceHeight = Math.min(pageContentHeight, heightLeft)
      // Source Y décalé à chaque page
      const sourceY = (position / imgHeight) * canvasHeight
      const sliceCanvasHeight = (sliceHeight / imgHeight) * canvasHeight

      const sliceCanvas = document.createElement("canvas")
      sliceCanvas.width = canvasWidth
      sliceCanvas.height = sliceCanvasHeight
      const ctx = sliceCanvas.getContext("2d")
      if (ctx) {
        ctx.drawImage(
          canvas,
          0, sourceY, canvasWidth, sliceCanvasHeight,
          0, 0, canvasWidth, sliceCanvasHeight
        )
      }

      const imgData = sliceCanvas.toDataURL("image/png")
      doc.addImage(imgData, "PNG", margin, margin, imgWidth, sliceHeight)

      // Pied de page
      doc.setFontSize(8)
      doc.setTextColor(156, 163, 175)
      doc.text(`TAHFIDZ • ${t("exportTitle", "fr")}`, margin, pageHeight - 6)
      doc.text(`${pageCount + 1}`, pageWidth - margin - 5, pageHeight - 6, { align: "right" })

      heightLeft -= pageContentHeight
      position += pageContentHeight
      pageCount++
    }

    doc.save(`eleves_${safeFileNamePart(school, L)}_${formatFileDate()}.pdf`)
  } finally {
    document.body.removeChild(container)
  }
}

function containsArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F]/.test(text)
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
