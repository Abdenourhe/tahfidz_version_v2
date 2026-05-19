"use client"
// src/components/admin/CertificatePrint.tsx
// Certificat professionnel avec styles islamiques — Impression A4

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, BookOpen, Star, Award, Crown } from "lucide-react"
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
}

// Motifs décoratifs SVG
const BORDER_PATTERNS: Record<string, JSX.Element> = {
  islamic: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <pattern id="border-islamic" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
          <rect width="60" height="60" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          <polygon points="30,5 55,30 30,55 5,30" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>
          <circle cx="30" cy="30" r="8" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#border-islamic)"/>
    </svg>
  ),
  andalous: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <pattern id="border-andalous" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M20 40 Q40 20 60 40 Q40 60 20 40" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          <circle cx="40" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.1"/>
          <path d="M40 10 Q50 25 40 40 Q30 25 40 10" fill="currentColor" opacity="0.08"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#border-andalous)"/>
    </svg>
  ),
  ottoman: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <pattern id="border-ottoman" x="0" y="0" width="100" height="40" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q25 5 50 20 Q75 35 100 20" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.2"/>
          <path d="M0 20 Q25 35 50 20 Q75 5 100 20" fill="none" stroke="currentColor" strokeWidth="0.8" opacity="0.1"/>
          <circle cx="50" cy="20" r="4" fill="currentColor" opacity="0.15"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#border-ottoman)"/>
    </svg>
  ),
  mamlouk: (
    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
      <defs>
        <pattern id="border-mamlouk" x="0" y="0" width="70" height="70" patternUnits="userSpaceOnUse">
          <path d="M15 70 L15 35 Q35 15 55 35 L55 70" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.15"/>
          <rect x="30" y="25" width="10" height="12" fill="currentColor" opacity="0.1"/>
          <circle cx="35" cy="50" r="3" fill="currentColor" opacity="0.12"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#border-mamlouk)"/>
    </svg>
  ),
}

// Ornement central
const CENTER_ORNAMENT = (
  <svg width="120" height="40" viewBox="0 0 120 40" className="mx-auto">
    <path d="M10 20 L30 20 M90 20 L110 20" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
    <path d="M30 20 Q45 5 60 20 Q75 35 90 20" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.5"/>
    <circle cx="60" cy="20" r="6" fill="currentColor" opacity="0.2"/>
    <path d="M55 20 L60 14 L65 20 L60 26 Z" fill="currentColor" opacity="0.3"/>
  </svg>
)

export function CertificatePrint({ student, school, template = DEFAULT_TEMPLATE }: Props) {
  const [note, setNote] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const t = template

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

  const borderPattern = BORDER_PATTERNS[t.borderStyle] || BORDER_PATTERNS.islamic

  return (
    <>
      {/* ─── Styles d'impression ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;700&display=swap');

        @media print {
          body * { visibility: hidden !important; }
          #certificate-area, #certificate-area * { visibility: visible !important; }
          #certificate-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      {/* ─── Interface admin ─── */}
      <div className="space-y-6 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/admin/students/${student.id}`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Certificat</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{student.fullName}</p>
          </div>
        </div>

        {/* Note personnalisée */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
            📝 Note personnalisée <span className="font-normal text-gray-400">(optionnelle)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Félicitations pour votre persévérance et votre dévouement dans la mémorisation du Saint Coran…"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"
          />
          <p className="text-xs text-gray-400 text-right">{note.length}/300 caractères</p>
        </div>

        {/* Bouton imprimer */}
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-lg"
            style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }}
          >
            <Printer size={18} />
            Imprimer le certificat
          </button>
          <p className="text-xs text-gray-400">Format A4 — Qualité professionnelle</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CERTIFICAT PROFESSIONNEL — VISIBLE À L'IMPRESSION
          ═══════════════════════════════════════════════════════════ */}
      <div id="certificate-area" ref={certRef}
        className="mt-6 relative overflow-hidden shadow-2xl print:shadow-none"
        style={{
          width: "210mm",
          minHeight: "297mm",
          background: `linear-gradient(135deg, ${t.lightColor} 0%, #ffffff 50%, ${t.lightColor} 100%)`,
          fontFamily: `${t.fontFamily}, Georgia, serif`,
        }}>

        {/* Bordure décorative */}
        <div className="absolute inset-4 border-2 rounded-lg pointer-events-none"
          style={{ borderColor: t.accentColor + "40" }}>
          <div className="absolute inset-1 border pointer-events-none"
            style={{ borderColor: t.primaryColor + "20" }}>
            <div className="absolute inset-2 border-2 border-dashed pointer-events-none"
              style={{ borderColor: t.accentColor + "15" }}/>
          </div>
        </div>

        {/* Motif de fond */}
        <div className="absolute inset-0 text-current opacity-30 pointer-events-none"
          style={{ color: t.primaryColor }}>
          {borderPattern}
        </div>

        <div className="relative z-10 p-12 print:p-16 flex flex-col min-h-[297mm]">

          {/* ═══ EN-TÊTE ═══ */}
          <div className="text-center mb-8">
            {/* Verset arabe */}
            <p className="text-2xl mb-4 leading-loose" dir="rtl"
              style={{
                color: t.primaryColor,
                fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
                fontSize: "1.6rem",
                letterSpacing: "0.05em",
              }}>
              {t.arabicVerse}
            </p>

            {/* Ornement */}
            <div style={{ color: t.accentColor }}>{CENTER_ORNAMENT}</div>
          </div>

          {/* ═══ LOGO + INFO ÉCOLE ═══ */}
          <div className="flex items-center justify-between mb-10 px-4">
            <div className="flex items-center gap-5">
              {school.logo ? (
                <img src={school.logo} alt={school.name}
                  className="w-24 h-24 object-contain rounded-xl border-2 p-2"
                  style={{ borderColor: t.accentColor + "40" }}/>
              ) : (
                <div className="w-24 h-24 rounded-xl flex items-center justify-center shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                  <span className="text-white font-bold text-4xl">{school.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-xl" style={{ color: t.textColor }}>{school.name}</p>
                {school.nameAr && (
                  <p className="text-lg mt-1" dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif` }}>
                    {school.nameAr}
                  </p>
                )}
                {school.city && <p className="text-sm text-gray-400 mt-1">{school.city}</p>}
              </div>
            </div>

            {/* Badge niveau */}
            <div className="text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg mx-auto mb-2"
                style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                {t.badgeEmoji}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: t.accentColor }}>
                {t.subtitle}
              </p>
            </div>
          </div>

          {/* ═══ TITRE PRINCIPAL ═══ */}
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-[0.4em] uppercase mb-2" style={{ color: t.accentColor }}>
              {t.subtitle}
            </p>
            <h1 className="text-5xl font-bold mb-3" style={{ color: t.textColor, letterSpacing: "0.02em" }}>
              {t.title}
            </h1>
            <p className="text-3xl" dir="rtl" style={{
              color: t.primaryColor,
              fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`,
              fontWeight: 700,
            }}>
              {t.titleAr}
            </p>
            <div className="mt-4" style={{ color: t.accentColor }}>{CENTER_ORNAMENT}</div>
          </div>

          {/* ═══ CORPS + ÉTUDIANT ═══ */}
          <div className="flex-1">
            {/* Texte du corps */}
            <div className="max-w-2xl mx-auto text-center mb-10">
              <p className="text-lg leading-relaxed italic" style={{ color: t.textColor + "cc" }}>
                &ldquo;{t.bodyText}&rdquo;
              </p>
            </div>

            {/* Photo + Nom étudiant */}
            <div className="flex items-center justify-center gap-8 mb-10">
              {student.avatar ? (
                <img src={student.avatar} alt={student.fullName}
                  className="w-32 h-32 rounded-full object-cover shadow-xl border-4"
                  style={{ borderColor: t.accentColor + "60" }}/>
              ) : (
                <div className="w-32 h-32 rounded-full flex items-center justify-center shadow-xl border-4 text-white font-bold text-5xl"
                  style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})`, borderColor: t.accentColor + "60" }}>
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="text-left">
                <p className="text-sm text-gray-400 uppercase tracking-widest mb-1">Décerné à</p>
                <h2 className="text-4xl font-bold" style={{ color: t.textColor }}>{student.fullName}</h2>
                {student.fullNameAr && (
                  <p className="text-2xl mt-1" dir="rtl" style={{
                    color: t.primaryColor,
                    fontFamily: `${t.fontFamilyAr}, serif`,
                  }}>
                    {student.fullNameAr}
                  </p>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-6 mb-10">
              {[
                { icon: BookOpen, label: "Sourates", value: student.memorizedCount, color: t.primaryColor },
                { icon: Star, label: "Étoiles", value: student.totalStars, color: "#d4a843" },
                { icon: Award, label: "Niveau", value: student.level, color: t.accentColor },
              ].map((stat, i) => (
                <div key={i} className="text-center px-6 py-4 rounded-xl border-2"
                  style={{ borderColor: t.accentColor + "30", background: t.lightColor + "80" }}>
                  <stat.icon size={24} style={{ color: stat.color }} className="mx-auto mb-2"/>
                  <p className="text-2xl font-bold" style={{ color: t.textColor }}>{stat.value}</p>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Sourates mémorisées */}
            {student.memorizedSurahs.length > 0 && (
              <div className="max-w-3xl mx-auto mb-10 p-6 rounded-xl border"
                style={{ background: t.lightColor + "60", borderColor: t.accentColor + "25" }}>
                <p className="text-center text-sm font-bold uppercase tracking-widest mb-4" style={{ color: t.textColor }}>
                  Sourates mémorisées
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  {student.memorizedSurahs.map(s => (
                    <span key={s.id}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm text-sm"
                      style={{ borderColor: t.primaryColor + "25" }}>
                      <span className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs shadow"
                        style={{ background: t.primaryColor }}>
                        {s.id}
                      </span>
                      <span className="font-medium" style={{ color: t.textColor }}>{s.nameFr}</span>
                      <span className="text-gray-400" dir="rtl" style={{ fontFamily: `${t.fontFamilyAr}, serif` }}>
                        {s.nameAr}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Note personnalisée */}
            {note && (
              <div className="max-w-2xl mx-auto mb-10 p-6 rounded-xl border relative"
                style={{ background: t.lightColor + "90", borderColor: t.accentColor + "30" }}>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 py-1 rounded-full text-xs font-bold shadow-sm"
                  style={{ color: t.primaryColor, border: `1px solid ${t.accentColor}40` }}>
                  Note de l&apos;administration
                </div>
                <p className="text-center text-base italic leading-relaxed mt-2" style={{ color: t.textColor + "cc" }}>
                  &ldquo;{note}&rdquo;
                </p>
              </div>
            )}
          </div>

          {/* ═══ PIED DE PAGE ═══ */}
          <div className="mt-auto pt-8">
            <div className="flex items-center justify-between">
              {/* Signature direction */}
              <div className="text-center flex-1">
                <div className="w-48 h-px mx-auto mb-4" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)` }}/>
                <p className="text-sm font-bold mb-1" style={{ color: t.textColor }}>Direction</p>
                <p className="text-sm" style={{ color: t.primaryColor }}>{school.name}</p>
                {school.nameAr && (
                  <p className="text-sm mt-0.5" dir="rtl" style={{ color: t.accentColor, fontFamily: `${t.fontFamilyAr}, serif` }}>
                    {school.nameAr}
                  </p>
                )}
              </div>

              {/* Ornement central */}
              <div className="px-8" style={{ color: t.accentColor }}>
                <svg width="60" height="60" viewBox="0 0 60 60" className="mx-auto opacity-40">
                  <circle cx="30" cy="30" r="25" fill="none" stroke="currentColor" strokeWidth="1"/>
                  <path d="M30 10 L30 50 M10 30 L50 30" stroke="currentColor" strokeWidth="0.5" opacity="0.5"/>
                  <circle cx="30" cy="30" r="8" fill="currentColor" opacity="0.15"/>
                </svg>
              </div>

              {/* Date */}
              <div className="text-center flex-1">
                <div className="w-48 h-px mx-auto mb-4" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}, transparent)` }}/>
                <p className="text-sm font-bold mb-1" style={{ color: t.textColor }}>Date d&apos;émission</p>
                <p className="text-sm" style={{ color: t.primaryColor }}>{today}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}</p>
              </div>
            </div>

            {/* Ligne finale */}
            <div className="mt-8 flex items-center gap-4">
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${t.primaryColor})` }}/>
              <span className="text-xs tracking-[0.3em] uppercase" style={{ color: t.accentColor + "80" }}>
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