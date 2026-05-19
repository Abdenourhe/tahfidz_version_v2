"use client"
// src/components/admin/CertificatePrint.tsx
// Certificat professionnel compact — tient sur 1 page A4

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, BookOpen, Star, Award } from "lucide-react"
import type { CertTemplate } from "./CertificateTemplateEditor"

interface StudentData {
  id: string
  fullName: string
  fullNameAr?: string
  avatar?: string
  level: string
  groupName?: string
  teacherName?: string
  memorizedCount: number
  totalStars: number
  memorizedSurahs: { id: number; nameFr: string; nameAr: string }[]
}

interface SchoolData {
  name: string
  nameAr?: string
  logo?: string
  city?: string
}

interface Props {
  student: StudentData
  school: SchoolData
  template: CertTemplate
}

const DEFAULT_TEMPLATE: CertTemplate = {
  id: "islamic",
  title: "Certificat de Mémorisation",
  titleAr: "شَهَادَةُ الْحِفْظ",
  subtitle: "Niveau",
  bodyText: "Pour avoir accompli avec succès son programme de mémorisation du Saint Coran.",
  arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  primaryColor: "#1a5f4a",
  accentColor: "#c9a227",
  lightColor: "#f0f7f4",
  textColor: "#0d3326",
  badgeEmoji: "🌱",
  borderStyle: "islamic",
  fontFamily: "Amiri",
  fontFamilyAr: "Scheherazade New",
  decorativePattern: "geometric",
  signatureStyle: "elegant",
  paperTexture: "parchment",
  orientation: "portrait",
}

// Ornement simple
const CENTER_ORNAMENT = (
  <svg width="80" height="20" viewBox="0 0 80 20" className="mx-auto">
    <path d="M0 10 L20 10 M60 10 L80 10" stroke="currentColor" strokeWidth="0.8" opacity="0.4"/>
    <circle cx="40" cy="10" r="4" fill="currentColor" opacity="0.3"/>
  </svg>
)

export function CertificatePrint({ student, school, template = DEFAULT_TEMPLATE }: Props) {
  const [note, setNote] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const t = template
  const isLandscape = t.orientation === "landscape"

  // MESURES A4 PRÉCISES
  const pageWidth  = isLandscape ? "297mm" : "210mm"
  const pageHeight = isLandscape ? "210mm" : "297mm"
  const printSize  = isLandscape ? "A4 landscape" : "A4 portrait"

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })

  // CSS d'impression dynamique
  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;700&display=swap');

    @media print {
      @page {
        size: ${printSize};
        margin: 0;
      }

      html, body {
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: white !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body * {
        visibility: hidden !important;
      }

      #certificate-area,
      #certificate-area * {
        visibility: visible !important;
      }

      #certificate-area {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${pageWidth} !important;
        height: ${pageHeight} !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        box-shadow: none !important;
        background: white !important;
      }

      .no-print {
        display: none !important;
      }
    }
  `

  return (
    <>
      {/* ─── Styles d'impression ─── */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* ─── Interface admin ─── */}
      <div className="space-y-4 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/admin/students/${student.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.fullName}</p>
          </div>
        </div>

        {/* Info orientation */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div 
            className="border-2 border-current rounded flex-shrink-0"
            style={{ 
              color: t.primaryColor,
              width: isLandscape ? "28px" : "20px",
              height: isLandscape ? "20px" : "28px",
            }}
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Format : {isLandscape ? "Paysage (A4 horizontal)" : "Portrait (A4 vertical)"}
            </p>
            <p className="text-xs text-gray-400">
              {isLandscape ? "297mm × 210mm" : "210mm × 297mm"}
            </p>
          </div>
        </div>

        {/* Note personnalisée */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            📝 Note personnalisée <span className="font-normal text-gray-400">(optionnelle)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="Félicitations..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
          />
          <p className="text-xs text-gray-400 text-right">{note.length}/200</p>
        </div>

        {/* Bouton imprimer */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-lg text-sm"
            style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }}
          >
            <Printer size={16} />
            Imprimer
          </button>
          <p className="text-xs text-gray-400">{printSize}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CERTIFICAT COMPACT — TIENT SUR 1 PAGE A4
          ═══════════════════════════════════════════════════════════ */}
      <div id="certificate-area" ref={certRef}
        className="mt-4 relative overflow-hidden shadow-2xl print:shadow-none"
        style={{
          width: pageWidth,
          height: pageHeight,
          boxSizing: "border-box",
          background: `linear-gradient(135deg, ${t.lightColor} 0%, #ffffff 50%, ${t.lightColor} 100%)`,
          fontFamily: `${t.fontFamily}, Georgia, serif`,
        }}>

        {/* Bordure décorative fine */}
        <div className="absolute inset-3 border rounded-lg pointer-events-none"
          style={{ borderColor: t.accentColor + "30" }}>
          <div className="absolute inset-1 border pointer-events-none"
            style={{ borderColor: t.primaryColor + "15" }}>
            <div className="absolute inset-1 border border-dashed pointer-events-none"
              style={{ borderColor: t.accentColor + "10" }}/>
          </div>
        </div>

        <div className="relative z-10 flex flex-col"
          style={{ 
            height: pageHeight,
            padding: isLandscape ? "24px 32px" : "32px 24px",
          }}>

          {/* ═══ EN-TÊTE COMPACT ═══ */}
          <div className="text-center mb-2">
            <p className="text-sm mb-1 leading-relaxed" dir="rtl"
              style={{
                color: t.primaryColor,
                fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
                fontSize: "1.1rem",
              }}>
              {t.arabicVerse}
            </p>
            <div style={{ color: t.accentColor }}>{CENTER_ORNAMENT}</div>
          </div>

          {/* ═══ LOGO + INFO ÉCOLE ═══ */}
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center gap-3">
              {school.logo ? (
                <img src={school.logo} alt={school.name}
                  className="w-14 h-14 object-contain rounded-lg border p-1"
                  style={{ borderColor: t.accentColor + "30" }}/>
              ) : (
                <div className="w-14 h-14 rounded-lg flex items-center justify-center shadow"
                  style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                  <span className="text-white font-bold text-2xl">{school.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-base" style={{ color: t.textColor }}>{school.name}</p>
                {school.nameAr && (
                  <p className="text-sm" dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif` }}>
                    {school.nameAr}
                  </p>
                )}
              </div>
            </div>

            {/* Badge niveau */}
            <div className="text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow mx-auto mb-1"
                style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                {t.badgeEmoji}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: t.accentColor }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* ═══ TITRE PRINCIPAL ═══ */}
          <div className="text-center mb-3">
            <p className="text-[10px] font-bold tracking-[0.3em] uppercase mb-1" style={{ color: t.accentColor }}>
              {t.subtitle}
            </p>
            <h1 className="text-3xl font-bold mb-1" style={{ color: t.textColor }}>
              {t.title}
            </h1>
            <p className="text-xl" dir="rtl" style={{
              color: t.primaryColor,
              fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
              fontWeight: 700,
            }}>
              {t.titleAr}
            </p>
          </div>

          {/* ═══ CORPS ═══ */}
          <div className="flex-1 flex flex-col">
            {/* Texte du corps */}
            <div className="max-w-xl mx-auto text-center mb-3">
              <p className="text-sm leading-relaxed italic" style={{ color: t.textColor + "cc" }}>
                &ldquo;{t.bodyText}&rdquo;
              </p>
            </div>

            {/* Photo + Nom étudiant */}
            <div className="flex items-center justify-center gap-4 mb-3">
              {student.avatar ? (
                <img src={student.avatar} alt={student.fullName}
                  className="w-20 h-20 rounded-full object-cover shadow-lg border-2"
                  style={{ borderColor: t.accentColor + "50" }}/>
              ) : (
                <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg border-2 text-white font-bold text-3xl"
                  style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})`, borderColor: t.accentColor + "50" }}>
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-left">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">Décerné à</p>
                <h2 className="text-2xl font-bold" style={{ color: t.textColor }}>{student.fullName}</h2>
                {student.fullNameAr && (
                  <p className="text-lg" dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif` }}>
                    {student.fullNameAr}
                  </p>
                )}
              </div>
            </div>

            {/* Stats compactes */}
            <div className="flex justify-center gap-4 mb-3">
              {[
                { icon: BookOpen, label: "Sourates", value: student.memorizedCount, color: t.primaryColor },
                { icon: Star, label: "Étoiles", value: student.totalStars, color: "#d4a843" },
                { icon: Award, label: "Niveau", value: student.level, color: t.accentColor },
              ].map((stat, i) => (
                <div key={i} className="text-center px-4 py-2 rounded-lg border"
                  style={{ borderColor: t.accentColor + "20", background: t.lightColor + "60" }}>
                  <stat.icon size={16} style={{ color: stat.color }} className="mx-auto mb-1"/>
                  <p className="text-lg font-bold" style={{ color: t.textColor }}>{stat.value}</p>
                  <p className="text-[10px] text-gray-500 uppercase">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Sourates mémorisées (compact) */}
            {student.memorizedSurahs.length > 0 && (
              <div className="max-w-2xl mx-auto mb-3 p-3 rounded-lg border"
                style={{ background: t.lightColor + "40", borderColor: t.accentColor + "15" }}>
                <p className="text-center text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: t.textColor }}>
                  Sourates mémorisées
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {student.memorizedSurahs.slice(0, 8).map(s => (
                    <span key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs"
                      style={{ borderColor: t.primaryColor + "20" }}>
                      <span className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px]"
                        style={{ background: t.primaryColor }}>
                        {s.id}
                      </span>
                      <span className="font-medium" style={{ color: t.textColor }}>{s.nameFr}</span>
                    </span>
                  ))}
                  {student.memorizedSurahs.length > 8 && (
                    <span className="text-xs text-gray-400">+{student.memorizedSurahs.length - 8} autres</span>
                  )}
                </div>
              </div>
            )}

            {/* Note personnalisée */}
            {note && (
              <div className="max-w-xl mx-auto mb-3 p-3 rounded-lg border"
                style={{ background: t.lightColor + "80", borderColor: t.accentColor + "20" }}>
                <p className="text-center text-sm italic" style={{ color: t.textColor + "cc" }}>
                  &ldquo;{note}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* ═══ PIED DE PAGE ═══ */}
          <div className="mt-auto pt-4">
            <div className="flex items-end justify-between">
              {/* Signature direction */}
              <div className="text-center flex-1">
                <div className="w-32 h-px mx-auto mb-2" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)` }}/>
                <p className="text-xs font-bold mb-0.5" style={{ color: t.textColor }}>Direction</p>
                <p className="text-xs" style={{ color: t.primaryColor }}>{school.name}</p>
              </div>

              {/* Date */}
              <div className="text-center flex-1">
                <div className="w-32 h-px mx-auto mb-2" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)` }}/>
                <p className="text-xs font-bold mb-0.5" style={{ color: t.textColor }}>Date</p>
                <p className="text-xs" style={{ color: t.primaryColor }}>{today}</p>
              </div>
            </div>

            {/* Ligne finale */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${t.primaryColor})` }}/>
              <span className="text-[10px] tracking-[0.2em] uppercase" style={{ color: t.accentColor + "80" }}>
                {school.name} — TAHFIDZ
              </span>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${t.primaryColor})` }}/>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}