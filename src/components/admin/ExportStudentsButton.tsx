"use client"
// src/components/admin/ExportStudentsButton.tsx
// Bouton d'export "pro" : multi-formats (Excel/CSV/PDF), portée filtrée/tous,
// sélection des colonnes et nom de fichier dynamique.

import { useState, useRef, useEffect, useMemo } from "react"
import { StudentRow } from "./students"
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
type ExportFormat = "xlsx" | "csv" | "pdf"
type ExportScope = "all" | "filtered"
type Locale = "fr" | "en" | "ar"

interface Props {
  allStudents: StudentRow[]
  filteredStudents: StudentRow[]
  locale: Locale
  schoolName?: string
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

function buildRows(students: StudentRow[], columns: ColumnDef[], L: Locale): Record<string, string | number>[] {
  return students.map(s => {
    const row: Record<string, string | number> = {}
    columns.forEach(col => {
      let v = col.getValue(s, L)
      if (col.key === "level") v = levelLabel(String(v), L)
      row[col.label[L] ?? col.label.fr] = v
    })
    return row
  })
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
export function ExportStudentsButton({ allStudents, filteredStudents, locale: L, schoolName }: Props) {
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
      if (format === "xlsx") await exportExcel(scopeStudents, activeColumns, L, schoolName)
      else if (format === "csv") exportCsv(scopeStudents, activeColumns, L)
      else if (format === "pdf") await exportPdf(scopeStudents, activeColumns, L, schoolName)
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
      if (fmt === "xlsx") await exportExcel(scopeStudents, activeColumns, L, schoolName)
      else if (fmt === "csv") exportCsv(scopeStudents, activeColumns, L)
      else if (fmt === "pdf") await exportPdf(scopeStudents, activeColumns, L, schoolName)
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
            label={t("exportCsv", L)}
            active={format === "csv"}
            onClick={() => quickExport("csv")}
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
              <div className="grid grid-cols-3 gap-2">
                <FormatButton format="xlsx" current={format} setFormat={setFormat} label={t("exportExcel", L)} />
                <FormatButton format="csv" current={format} setFormat={setFormat} label={t("exportCsv", L)} />
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

// ─── Export Excel ───────────────────────────────────────────────────────────
async function exportExcel(students: StudentRow[], columns: ColumnDef[], L: Locale, schoolName?: string) {
  const XLSX = await import("xlsx")
  const rows = buildRows(students, columns, L)
  const ws = XLSX.utils.json_to_sheet(rows)

  // Largeurs de colonnes
  ws["!cols"] = columns.map(col => {
    const header = col.label[L] ?? col.label.fr
    const maxData = Math.max(header.length, ...rows.map(r => String(r[header] ?? "").length))
    return { wch: Math.min(Math.max(maxData + 2, 10), 40) }
  })

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Elèves")
  XLSX.writeFile(wb, `eleves_${schoolName ? `${schoolName}_` : ""}${formatFileDate()}.xlsx`)
}

// ─── Export CSV ─────────────────────────────────────────────────────────────
function exportCsv(students: StudentRow[], columns: ColumnDef[], L: Locale) {
  const headers = columns.map(c => c.label[L] ?? c.label.fr)
  const rows = students.map(s =>
    columns.map(col => {
      let v = col.getValue(s, L)
      if (col.key === "level") v = levelLabel(String(v), L)
      const str = String(v ?? "").replace(/"/g, '""')
      return `"${str}"`
    }).join(";")
  )
  const csv = [headers.join(";"), ...rows].join("\n")
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" })
  downloadBlob(blob, `eleves_${formatFileDate()}.csv`)
}

// ─── Export PDF ─────────────────────────────────────────────────────────────
async function exportPdf(students: StudentRow[], columns: ColumnDef[], L: Locale, schoolName?: string) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 12
  let y = 18

  // En-tête
  doc.setFillColor(5, 150, 105) // emerald-600
  doc.rect(0, 0, pageWidth, 10, "F")
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text("TAHFIDZ", margin, 7)

  // Titre
  y = 24
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text(t("exportTitle", L), margin, y)

  // Sous-titre
  y += 7
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  const metaParts = [
    schoolName,
    `${t("generatedOn", L)} : ${new Date().toLocaleDateString("fr-FR")}`,
    `${t("total", L)} : ${students.length}`,
  ].filter(Boolean)
  doc.setTextColor(107, 114, 128)
  doc.text(metaParts.join("  •  "), margin, y)

  // Tableau
  y += 10
  const usableWidth = pageWidth - margin * 2
  const colCount = columns.length
  const colWidth = usableWidth / colCount
  const rowHeight = 7

  // En-têtes tableau
  doc.setFillColor(236, 253, 245) // emerald-50
  doc.setDrawColor(209, 250, 229)
  doc.rect(margin, y, usableWidth, rowHeight, "FD")
  doc.setTextColor(6, 95, 70)
  doc.setFont("helvetica", "bold")
  doc.setFontSize(8)

  columns.forEach((col, i) => {
    const x = margin + i * colWidth + 1.5
    const label = col.label[L] ?? col.label.fr
    doc.text(truncateForPdf(doc, label, colWidth - 3), x, y + 4.8)
  })

  y += rowHeight

  // Lignes
  doc.setFont("helvetica", "normal")
  doc.setDrawColor(229, 231, 235)
  students.forEach((s, idx) => {
    if (y + rowHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage()
      y = margin
    }

    if (idx % 2 === 0) {
      doc.setFillColor(249, 250, 251)
      doc.rect(margin, y, usableWidth, rowHeight, "F")
    }

    doc.setTextColor(55, 65, 81)
    columns.forEach((col, i) => {
      let v = col.getValue(s, L)
      if (col.key === "level") v = levelLabel(String(v), L)
      const x = margin + i * colWidth + 1.5
      doc.text(truncateForPdf(doc, String(v ?? ""), colWidth - 3), x, y + 4.8)
    })

    y += rowHeight
  })

  doc.save(`eleves_${formatFileDate()}.pdf`)
}

function truncateForPdf(doc: any, text: string, maxWidth: number): string {
  let truncated = text
  while (doc.getTextWidth(truncated) > maxWidth && truncated.length > 0) {
    truncated = truncated.slice(0, -1)
  }
  return truncated
}
