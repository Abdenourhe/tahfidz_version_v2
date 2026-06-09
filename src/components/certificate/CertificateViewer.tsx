"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useLanguage } from "@/contexts/LanguageContext"
import { Printer, Download, Loader2, ArrowLeft, ChevronDown } from "lucide-react"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"
import { QRCodeSVG } from "qrcode.react"
import type { CertificateTemplate, StudentCertData, SchoolCertData } from "./types"

interface Props {
  student: StudentCertData
  school: SchoolCertData
  templates: CertificateTemplate[]
  defaultTemplateId?: string
  hideToolbar?: boolean
}

export function CertificateViewer({ student, school, templates, defaultTemplateId, hideToolbar }: Props) {
  const { locale, dir } = useLanguage()
  const L = (locale as "fr" | "en" | "ar") ?? "fr"
  const isAr = L === "ar"
  const certRef = useRef<HTMLDivElement>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [activeId, setActiveId] = useState(defaultTemplateId || templates[0]?.id)
  const [note, setNote] = useState("")

  useEffect(() => {
    setMounted(true)
  }, [])

  const template = templates.find((t) => t.id === activeId) ?? templates[0]
  if (!template) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-xl font-bold text-gray-800">Aucun template de certificat</h1>
        <p className="text-gray-500 mt-2">Créez un template dans Paramètres &gt; Certificats.</p>
      </div>
    )
  }

  const t = template.config
  const isLandscape = t.orientation === "landscape"
  const pageWidth = isLandscape ? "297mm" : "210mm"
  const pageHeight = isLandscape ? "210mm" : "297mm"

  const verifyUrl =
    school.slug && student.studentCode
      ? `https://${school.slug}.tahfidz.app/verify?student=${encodeURIComponent(student.studentCode)}`
      : `https://tahfidz.app/verify?student=${encodeURIComponent(student.id)}`

  const today = new Date().toLocaleDateString(
    L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR",
    { day: "numeric", month: "long", year: "numeric" }
  )

  const stats = [
    { label: isAr ? "السور" : L === "en" ? "Surahs" : "Sourates", value: student.memorizedCount, color: t.primaryColor },
    { label: isAr ? "النجوم" : L === "en" ? "Stars" : "Étoiles", value: student.totalStars, color: t.accentColor },
    { label: isAr ? "المستوى" : L === "en" ? "Level" : "Niveau", value: student.level, color: t.primaryColor },
    ...(student.avgScore !== undefined
      ? [{ label: isAr ? "المعدل" : L === "en" ? "Average" : "Moyenne", value: `${student.avgScore}%`, color: t.primaryColor }]
      : []),
    ...(student.attendanceRate !== undefined
      ? [{ label: isAr ? "الحضور" : L === "en" ? "Attendance" : "Présence", value: `${student.attendanceRate}%`, color: "#10b981" }]
      : []),
    ...(student.tajwidScore !== undefined
      ? [{ label: isAr ? "التجويد" : L === "en" ? "Tajwid" : "Tajwīd", value: `${student.tajwidScore}%`, color: t.accentColor }]
      : []),
  ]

  const handleDownloadPDF = useCallback(async () => {
    if (!certRef.current) return
    setIsPdfLoading(true)
    await new Promise((r) => setTimeout(r, 300))

    const el = certRef.current
    const original = {
      position: el.style.position,
      left: el.style.left,
      top: el.style.top,
      zIndex: el.style.zIndex,
    }

    try {
      el.style.position = "absolute"
      el.style.left = "-9999px"
      el.style.top = "0"
      el.style.zIndex = "auto"

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready
      }
      await new Promise((r) => setTimeout(r, 200))

      const canvas = await html2canvas(el, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF(isLandscape ? "l" : "p", "mm", "a4")
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, "PNG", 0, 0, pw, ph)
      pdf.save(`certificat-${student.studentCode || student.id}.pdf`)
    } catch (err) {
      console.error("[PDF ERROR]", err)
    } finally {
      el.style.position = original.position
      el.style.left = original.left
      el.style.top = original.top
      el.style.zIndex = original.zIndex
      setIsPdfLoading(false)
    }
  }, [isLandscape, student.id, student.studentCode])

  const handlePrint = useCallback(() => {
    const style = document.createElement("style")
    style.id = "cert-print-style"
    style.innerHTML = `
      @media print {
        @page { size: ${isLandscape ? "297mm 210mm" : "210mm 297mm"}; margin: 0; }
        body > * { visibility: hidden !important; }
        #certificate-print-container, #certificate-print-container * { visibility: visible !important; }
        #certificate-print-container {
          position: fixed !important; top: 0 !important; left: 0 !important;
          width: ${pageWidth} !important; height: ${pageHeight} !important;
          margin: 0 !important; padding: 0 !important; overflow: hidden !important;
        }
        .no-print { display: none !important; }
      }
    `
    document.head.appendChild(style)
    window.print()
    setTimeout(() => {
      document.getElementById("cert-print-style")?.remove()
    }, 1000)
  }, [isLandscape, pageWidth, pageHeight])

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      {!hideToolbar && <div className="flex items-center gap-3 no-print">
        <Link href={`/admin/students/${student.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isAr ? "الشهادة" : L === "en" ? "Certificate" : "Certificat"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{student.fullName}</p>
        </div>

        {templates.length > 1 && (
          <div className="relative">
            <select
              value={activeId}
              onChange={(e) => setActiveId(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 text-sm rounded-xl pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isPdfLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-60 transition shadow-lg"
          >
            {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-lg"
          >
            <Printer size={16} /> {isAr ? "طباعة" : L === "en" ? "Print" : "Imprimer"}
          </button>
        </div>
      </div>}

      {/* Certificate DOM (hidden for PDF capture) */}
      {mounted && (
        <div
          id="certificate-print-container"
          ref={certRef}
          className="mx-auto shadow-2xl"
          style={{
            width: pageWidth,
            height: pageHeight,
            position: "relative",
            overflow: "hidden",
            boxSizing: "border-box",
            background: `linear-gradient(135deg, ${t.lightColor}, #ffffff)`,
            fontFamily: isAr
              ? "'Noto Naskh Arabic', 'Amiri', 'Arial', serif"
              : "'Georgia', 'Times New Roman', serif",
            direction: dir,
          }}
        >
          {/* Fine border */}
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "16px",
              border: `2px solid ${t.primaryColor}30`,
              borderRadius: "4px",
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              inset: "22px",
              border: `1px solid ${t.primaryColor}15`,
              borderRadius: "2px",
            }}
          />

          {/* Content */}
          <div
            className="relative z-10 flex flex-col items-center h-full"
            style={{ padding: isLandscape ? "28px 48px" : "36px 40px" }}
          >
            {/* Header : Logo + School */}
            <div className="flex items-center gap-3 mb-2" style={{ textAlign: isAr ? "right" : "left" }}>
              {school.logo ? (
                <img src={school.logo} alt={school.name} crossOrigin="anonymous" className="w-10 h-10 object-contain rounded" />
              ) : (
                <div
                  className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                  style={{ background: t.primaryColor }}
                >
                  {school.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-sm" style={{ color: t.textColor }}>
                  {school.name}
                </p>
                {school.city && (
                  <p className="text-[10px] font-semibold uppercase" style={{ color: t.primaryColor }}>
                    {isAr ? school.city : school.city.toUpperCase()}
                  </p>
                )}
              </div>
            </div>

            {/* Arabic verse */}
            {t.arabicVerse && (
              <p
                dir="rtl"
                className="text-center my-2 opacity-75"
                style={{
                  color: t.primaryColor,
                  fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              >
                {t.arabicVerse}
              </p>
            )}

            {/* Subtitle */}
            {t.subtitle && (
              <p
                className="text-[10px] font-bold mb-1"
                style={{
                  color: t.accentColor,
                  textTransform: isAr ? undefined : "uppercase",
                  letterSpacing: isAr ? undefined : "0.2em",
                }}
              >
                {t.subtitle}
              </p>
            )}

            {/* Title FR */}
            <h1
              className="font-bold text-center leading-tight"
              style={{
                color: t.textColor,
                fontSize: isLandscape ? "1.6rem" : "1.8rem",
                textTransform: isAr ? undefined : "uppercase",
                letterSpacing: isAr ? undefined : "0.08em",
                fontFamily: "'Georgia', 'Times New Roman', serif",
              }}
            >
              {t.title}
            </h1>

            {/* Title AR */}
            {t.titleAr && (
              <p
                dir="rtl"
                className="text-center font-bold mt-1 mb-2"
                style={{
                  color: t.primaryColor,
                  fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
                  fontSize: "1.1rem",
                }}
              >
                {t.titleAr}
              </p>
            )}

            {/* Divider */}
            <div className="w-16 h-[3px] rounded-full mb-4" style={{ background: t.accentColor, opacity: 0.7 }} />

            {/* Body */}
            <div className="flex-1 flex flex-col items-center w-full" style={{ maxWidth: isLandscape ? "85%" : "460px" }}>
              {/* Awarded to */}
              <p
                className="text-[10px] font-semibold mb-2"
                style={{
                  color: "#9ca3af",
                  textTransform: isAr ? undefined : "uppercase",
                  letterSpacing: isAr ? undefined : "0.25em",
                }}
              >
                {isAr ? "تُمنح هذه الشهادة لـ" : L === "en" ? "This certificate is awarded to" : "Ce certificat est décerné à"}
              </p>

              {/* Student name */}
              <h2
                className="italic text-center"
                style={{
                  color: t.textColor,
                  fontSize: isLandscape ? "1.4rem" : "1.6rem",
                  fontFamily: "'Georgia', 'Times New Roman', serif",
                }}
              >
                {student.fullName}
              </h2>
              {student.fullNameAr && (
                <p
                  dir="rtl"
                  className="text-center mt-1 opacity-80"
                  style={{
                    color: t.primaryColor,
                    fontFamily: "'Noto Naskh Arabic', 'Amiri', serif",
                    fontSize: "0.95rem",
                  }}
                >
                  {student.fullNameAr}
                </p>
              )}

              {/* Underline */}
              <div
                className="w-[55%] max-w-[220px] h-[2px] my-3 rounded-full"
                style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)` }}
              />

              {/* Body text */}
              {t.bodyText && (
                <p
                  className="text-center italic text-sm mb-4 opacity-85 leading-relaxed"
                  style={{
                    color: t.textColor,
                    fontFamily: "'Georgia', 'Times New Roman', serif",
                  }}
                >
                  « {t.bodyText} »
                </p>
              )}

              {/* Stats */}
              {t.showStats !== false && (
                <div className="flex flex-wrap justify-center gap-3 mb-4">
                  {stats.map((stat, i) => (
                    <div
                      key={i}
                      className="text-center px-3 py-2 rounded-lg"
                      style={{
                        background: `${stat.color}08`,
                        border: `1px solid ${stat.color}20`,
                      }}
                    >
                      <p className="font-bold text-sm" style={{ color: stat.color }}>
                        {stat.value}
                      </p>
                      <p
                        className="text-[9px] font-semibold mt-1"
                        style={{
                          color: "#9ca3af",
                          textTransform: isAr ? undefined : "uppercase",
                          letterSpacing: isAr ? undefined : "0.1em",
                        }}
                      >
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Group */}
              {student.groupName && (
                <div
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-3"
                  style={{
                    border: `1.5px solid ${t.accentColor}30`,
                    background: `${t.primaryColor}06`,
                    color: t.textColor,
                  }}
                >
                  {isAr ? "المجموعة" : L === "en" ? "Group" : "Groupe"} : {student.groupName}
                </div>
              )}

              {/* Note / Observation */}
              <div className="w-full mb-4" style={{ maxWidth: isLandscape ? "85%" : "460px" }}>
                {hideToolbar ? (
                  note && (
                    <p
                      className="text-center text-sm italic leading-relaxed px-4 py-3"
                      style={{ color: t.textColor + "cc", fontFamily: "'Georgia', 'Times New Roman', serif" }}
                    >
                      « {note} »
                    </p>
                  )
                ) : (
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isAr ? "اكتب ملاحظة أو تعليق…" : L === "en" ? "Write a note or observation…" : "Écrivez une note ou observation…"}
                    maxLength={200}
                    rows={2}
                    className="w-full px-4 py-3 text-sm italic text-center leading-relaxed bg-transparent border-0 focus:outline-none focus:ring-0 resize-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
                    style={{
                      color: t.textColor + "cc",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                    }}
                  />
                )}
                {!hideToolbar && note.length > 0 && (
                  <p className="text-[9px] text-gray-300 dark:text-gray-600 text-right pr-2">{note.length}/200</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="w-full mt-auto">
              <div
                className="w-full max-w-[460px] mx-auto mb-3 h-[2px] rounded-full"
                style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}30, transparent)` }}
              />

              <div className="flex items-end justify-between gap-4 px-2">
                {/* QR */}
                {t.showQr !== false && (
                  <div className="w-[90px] text-center">
                    <QRCodeSVG value={verifyUrl} size={72} level="M" />
                    <p
                      className="text-[7px] font-semibold mt-1"
                      style={{
                        color: `${t.primaryColor}60`,
                        textTransform: isAr ? undefined : "uppercase",
                        letterSpacing: isAr ? undefined : "0.1em",
                      }}
                    >
                      {isAr ? "تحقق" : L === "en" ? "Verify" : "Vérifier"}
                    </p>
                  </div>
                )}

                {/* Signatures */}
                <div className="flex-1 flex items-end justify-center gap-8">
                  {/* Director */}
                  <div className="text-center w-[120px]">
                    <div className="w-full h-[2px] rounded-full mb-2" style={{ background: t.accentColor, opacity: 0.4 }} />
                    <p
                      className="text-[8px] font-semibold mb-1"
                      style={{
                        color: "#9ca3af",
                        textTransform: isAr ? undefined : "uppercase",
                        letterSpacing: isAr ? undefined : "0.15em",
                      }}
                    >
                      {isAr ? "المدير" : L === "en" ? "Director" : "Directeur"}
                    </p>
                    {school.directorSignature ? (
                      <img src={school.directorSignature} alt="Signature" className="h-8 mx-auto object-contain" />
                    ) : (
                      <p className="text-xs font-semibold" style={{ color: t.textColor }}>{t.directorName}</p>
                    )}
                    {t.directorNameAr && (
                      <p dir="rtl" className="text-[9px] mt-1" style={{ color: t.primaryColor, fontFamily: "'Noto Naskh Arabic', serif" }}>
                        {t.directorNameAr}
                      </p>
                    )}
                  </div>

                  {/* Teacher */}
                  {t.showTeacher && (
                    <div className="text-center w-[120px]">
                      <div className="w-full h-[2px] rounded-full mb-2" style={{ background: t.accentColor, opacity: 0.4 }} />
                      <p
                        className="text-[8px] font-semibold mb-1"
                        style={{
                          color: "#9ca3af",
                          textTransform: isAr ? undefined : "uppercase",
                          letterSpacing: isAr ? undefined : "0.15em",
                        }}
                      >
                        {isAr ? "المعلم" : L === "en" ? "Teacher" : "Enseignant"}
                      </p>
                      {school.teacherSignature ? (
                        <img src={school.teacherSignature} alt="Signature" className="h-8 mx-auto object-contain" />
                      ) : (
                        <p className="text-xs font-semibold" style={{ color: t.textColor }}>{t.teacherName || student.teacherName || "—"}</p>
                      )}
                      {t.teacherNameAr && (
                        <p dir="rtl" className="text-[9px] mt-1" style={{ color: t.primaryColor, fontFamily: "'Noto Naskh Arabic', serif" }}>
                          {t.teacherNameAr}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  <div className="text-center w-[120px]">
                    <div className="w-full h-[2px] rounded-full mb-2" style={{ background: t.accentColor, opacity: 0.4 }} />
                    <p
                      className="text-[8px] font-semibold mb-1"
                      style={{
                        color: "#9ca3af",
                        textTransform: isAr ? undefined : "uppercase",
                        letterSpacing: isAr ? undefined : "0.15em",
                      }}
                    >
                      {isAr ? "التاريخ" : L === "en" ? "Date" : "Date"}
                    </p>
                    <p className="text-xs font-semibold" style={{ color: t.textColor }}>{today}</p>
                  </div>
                </div>

                {/* Seal */}
                <div className="w-[80px] opacity-70">
                  <svg width="80" height="80" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="none" stroke={t.accentColor} strokeWidth="3" opacity="0.9" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={t.accentColor} strokeWidth="1.2" opacity="0.5" strokeDasharray="5 3" />
                    <circle cx="50" cy="50" r="34" fill={t.accentColor} opacity="0.08" />
                    <text x="50" y="38" textAnchor="middle" fill={t.textColor} fontSize="10" fontWeight="bold" fontFamily="Georgia,serif">TAHFIDZ</text>
                    <text x="50" y="55" textAnchor="middle" fill={t.textColor} fontSize="9" fontWeight="bold" fontFamily="Georgia,serif">AWARD</text>
                    <path d="M38 65 L50 82 L62 65" fill="none" stroke={t.accentColor} strokeWidth="2.5" opacity="0.85" />
                  </svg>
                </div>
              </div>

              {/* Footer school */}
              <div className="flex items-center gap-3 max-w-[460px] mx-auto mt-3">
                <div className="flex-1 h-[2px] rounded-full" style={{ background: `linear-gradient(to right, transparent, ${t.primaryColor})` }} />
                <span
                  className="text-[8px] font-semibold whitespace-nowrap"
                  style={{
                    color: `${t.accentColor}60`,
                    textTransform: isAr ? undefined : "uppercase",
                    letterSpacing: isAr ? undefined : "0.2em",
                  }}
                >
                  {school.name}{school.city ? ` — ${school.city}` : ""} — TAHFIDZ
                </span>
                <div className="flex-1 h-[2px] rounded-full" style={{ background: `linear-gradient(to left, transparent, ${t.primaryColor})` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
