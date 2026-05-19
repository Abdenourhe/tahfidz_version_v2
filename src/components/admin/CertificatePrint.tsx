"use client"
// src/components/admin/CertificatePrint.tsx
// Certificat avec signatures compactes et centrées

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
  subtitle: "Niveau Débutant",
  bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran, et avoir démontré de belles qualités d'apprentissage et de dévotion.",
  arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  primaryColor: "#1a5f4a",
  accentColor: "#c9a227",
  lightColor: "#f0f7f4",
  textColor: "#0d3326",
  badgeEmoji: "🌱",
  borderStyle: "islamic",
  fontFamily: "Georgia",
  fontFamilyAr: "Scheherazade New",
  decorativePattern: "geometric",
  signatureStyle: "elegant",
  paperTexture: "parchment",
  orientation: "portrait",
  directorName: "Directeur",
  directorNameAr: "المدير",
  showTeacher: true,
  teacherName: "",
  teacherNameAr: "",
}

// Ornement décoratif
const ORNAMENT_TOP = (
  <svg width="200" height="24" viewBox="0 0 200 24" className="mx-auto">
    <path d="M0 12 L80 12" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/>
    <path d="M120 12 L200 12" stroke="currentColor" strokeWidth="0.8" opacity="0.3"/>
    <circle cx="100" cy="12" r="5" fill="currentColor" opacity="0.25"/>
    <path d="M100 7 L100 17 M95 12 L105 12" stroke="currentColor" strokeWidth="0.5" opacity="0.4"/>
  </svg>
)

const ORNAMENT_BOTTOM = (
  <svg width="160" height="16" viewBox="0 0 160 16" className="mx-auto">
    <path d="M0 8 L60 8" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
    <path d="M100 8 L160 8" stroke="currentColor" strokeWidth="0.6" opacity="0.3"/>
    <circle cx="80" cy="8" r="3" fill="currentColor" opacity="0.2"/>
  </svg>
)

export function CertificatePrint({ student, school, template = DEFAULT_TEMPLATE }: Props) {
  const [note, setNote] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const t = template
  const isLandscape = t.orientation === "landscape"

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

  const printStyles = `
    @import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&family=Scheherazade+New:wght@400;700&family=Reem+Kufi:wght@400;700&display=swap');

    @media print {
      @page { size: ${printSize}; margin: 0; }
      html, body { width: ${pageWidth} !important; height: ${pageHeight} !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      body * { visibility: hidden !important; }
      #certificate-area, #certificate-area * { visibility: visible !important; }
      #certificate-area { position: fixed !important; inset: 0 !important; width: ${pageWidth} !important; height: ${pageHeight} !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; box-shadow: none !important; background: white !important; }
      .no-print { display: none !important; }
    }
  `

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* Interface admin */}
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

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
          <div className="border-2 border-current rounded flex-shrink-0" style={{ color: t.primaryColor, width: isLandscape ? "28px" : "20px", height: isLandscape ? "20px" : "28px" }}/>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Format : {isLandscape ? "Paysage (A4 horizontal)" : "Portrait (A4 vertical)"}</p>
            <p className="text-xs text-gray-400">{isLandscape ? "297mm × 210mm" : "210mm × 297mm"}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">📝 Note personnalisée <span className="font-normal text-gray-400">(optionnelle)</span></label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={200} placeholder="Félicitations..." className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition"/>
          <p className="text-xs text-gray-400 text-right">{note.length}/200</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={handlePrint} disabled={isPrinting} className="flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-lg text-sm" style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor})` }}>
            <Printer size={16} /> Imprimer
          </button>
          <p className="text-xs text-gray-400">{printSize}</p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CERTIFICAT — SIGNATURES COMPACTES ET CENTRÉES
          ═══════════════════════════════════════════════════════════ */}
      <div id="certificate-area" ref={certRef}
        className="mt-4 relative overflow-hidden shadow-2xl print:shadow-none"
        style={{ width: pageWidth, height: pageHeight, boxSizing: "border-box", background: t.lightColor, fontFamily: `${t.fontFamily}, Georgia, serif` }}>

        {/* Bordure fine */}
        <div className="absolute inset-4 border rounded-lg pointer-events-none" style={{ borderColor: t.accentColor + "25" }}>
          <div className="absolute inset-2 border pointer-events-none" style={{ borderColor: t.primaryColor + "10" }}>
            <div className="absolute inset-1 border border-dashed pointer-events-none" style={{ borderColor: t.accentColor + "8"}}/>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="relative z-10 flex flex-col items-center"
          style={{ height: pageHeight, padding: isLandscape ? "28px 40px" : "36px 32px" }}>

          {/* ═══ EN-TÊTE ═══ */}
          <div className="text-center w-full" style={{ marginBottom: "16px" }}>
            <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`, fontSize: "1.15rem", lineHeight: 1.6, marginBottom: "8px", letterSpacing: "0.02em" }}>
              {t.arabicVerse}
            </p>
            <div style={{ color: t.accentColor }}>{ORNAMENT_TOP}</div>
          </div>

          {/* ═══ INFO ÉCOLE ═══ */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {school.logo ? (
              <img src={school.logo} alt={school.name} className="w-12 h-12 object-contain rounded-lg border p-1" style={{ borderColor: t.accentColor + "30" }}/>
            ) : (
              <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow" style={{ background: `linear-gradient(135deg, ${t.primaryColor}, ${t.accentColor})` }}>
                <span className="text-white font-bold text-xl">{school.name.charAt(0)}</span>
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-base" style={{ color: t.textColor, letterSpacing: "0.01em" }}>{school.name}</p>
              {school.nameAr && <p className="text-sm" dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif` }}>{school.nameAr}</p>}
            </div>
          </div>

          {/* ═══ TITRE CERTIFICAT ═══ */}
          <div className="text-center w-full" style={{ marginBottom: "20px" }}>
            <p style={{ color: t.accentColor, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "6px" }}>
              {t.subtitle}
            </p>
            <h1 style={{ color: t.textColor, fontSize: "2.2rem", fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1.2, marginBottom: "4px" }}>
              {t.title}
            </h1>
            <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, 'Scheherazade New', serif`, fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 }}>
              {t.titleAr}
            </p>
          </div>

          {/* ═══ CORPS ═══ */}
          <div className="flex-1 flex flex-col items-center w-full" style={{ maxWidth: "600px" }}>

            {/* Texte du corps — largeur indépendante */}
            <div className="text-center w-full" style={{ marginBottom: "20px", maxWidth: "600px", marginLeft: "auto", marginRight: "auto" }}>
              <p style={{ color: t.textColor, fontSize: "0.95rem", lineHeight: 1.5, fontStyle: "italic" }}>
                &ldquo;{t.bodyText}&rdquo;
              </p>
            </div>

            {/* Ligne décorative */}
            <div className="w-full flex items-center gap-3" style={{ marginBottom: "20px" }}>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor})` }}/>
              <div style={{ color: t.accentColor }}>{ORNAMENT_BOTTOM}</div>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${t.accentColor})` }}/>
            </div>

            {/* ═══ NOM ÉTUDIANT ═══ */}
            <div className="text-center w-full" style={{ marginBottom: "20px" }}>
              <p style={{ color: "#9ca3af", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.2em", marginBottom: "4px" }}>Ce certificat est décerné à</p>
              <h2 style={{ color: t.textColor, fontSize: "1.8rem", fontWeight: 700, lineHeight: 1.2 }}>{student.fullName}</h2>
              {student.fullNameAr && (
                <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`, fontSize: "1.2rem", marginTop: "4px" }}>
                  {student.fullNameAr}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-5" style={{ marginBottom: "16px" }}>
              {[
                { icon: BookOpen, label: "Sourates", value: student.memorizedCount, color: t.primaryColor },
                { icon: Star, label: "Étoiles", value: student.totalStars, color: t.accentColor },
                { icon: Award, label: "Niveau", value: student.level === "beginner" ? "1" : student.level === "intermediate" ? "2" : student.level === "advanced" ? "3" : "4", color: t.primaryColor },
              ].map((stat, i) => (
                <div key={i} className="text-center px-5 py-3 rounded-lg border" style={{ borderColor: t.accentColor + "18", background: "rgba(255,255,255,0.6)" }}>
                  <stat.icon size={18} style={{ color: stat.color }} className="mx-auto mb-1.5"/>
                  <p style={{ color: t.textColor, fontSize: "1.3rem", fontWeight: 700, lineHeight: 1 }}>{stat.value}</p>
                  <p style={{ color: "#9ca3af", fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.15em" }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Sourates */}
            {student.memorizedSurahs.length > 0 && (
              <div className="w-full p-3 rounded-lg border mb-3" style={{ background: "rgba(255,255,255,0.5)", borderColor: t.accentColor + "12" }}>
                <p className="text-center mb-2" style={{ color: t.textColor, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em" }}>Sourates mémorisées</p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {student.memorizedSurahs.slice(0, 10).map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white rounded border text-xs" style={{ borderColor: t.primaryColor + "15" }}>
                      <span className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px]" style={{ background: t.primaryColor }}>{s.id}</span>
                      <span style={{ color: t.textColor, fontWeight: 500 }}>{s.nameFr}</span>
                    </span>
                  ))}
                  {student.memorizedSurahs.length > 10 && <span className="text-xs text-gray-400">+{student.memorizedSurahs.length - 10}</span>}
                </div>
              </div>
            )}

            {/* Note */}
            {note && (
              <div className="w-full p-3 rounded-lg border mb-3" style={{ background: "rgba(255,255,255,0.7)", borderColor: t.accentColor + "15" }}>
                <p className="text-center text-sm italic" style={{ color: t.textColor + "cc", lineHeight: 1.5 }}>&ldquo;{note}&rdquo;</p>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════
              SIGNATURES COMPACTES — CENTRÉES PAR RAPPORT À LEUR AXE
              ═══════════════════════════════════════════════════════════ */}
          <div className="w-full" style={{ marginTop: "auto", paddingTop: "6px" }}>

            {/* Ligne de séparation subtile */}
            <div className="w-full mb-4" style={{ maxWidth: "600px", margin: "0 auto 16px" }}>
              <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}30, transparent)` }}/>
            </div>

            <div className="flex items-start justify-between" style={{ padding: "0 40px" }}>

              {/* ═══ GAUCHE : Directeur (centré sur son axe) ═══ */}
              <div className="text-center" style={{ width: "100px" }}>
                <div className="w-full h-px mb-2" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}40, transparent)` }}/>
                <p style={{ color: "#9ca3af", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>Directeur</p>
                <p style={{ color: t.textColor, fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>{t.directorName}</p>
                {t.directorNameAr && (
                  <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`, fontSize: "0.7rem", marginTop: "1px" }}>
                    {t.directorNameAr}
                  </p>
                )}
              </div>

              {/* ═══ CENTRE : Enseignant (si activé) ═══ */}
              {t.showTeacher && (
                <div className="text-center" style={{ width: "100px" }}>
                  <div className="w-full h-px mb-2" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}40, transparent)` }}/>
                  <p style={{ color: "#9ca3af", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>Enseignant</p>
                  <p style={{ color: t.textColor, fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>
                    {t.teacherName || student.teacherName || "Enseignant"}
                  </p>
                  {t.teacherNameAr && (
                    <p dir="rtl" style={{ color: t.primaryColor, fontFamily: `${t.fontFamilyAr}, serif`, fontSize: "0.7rem", marginTop: "1px" }}>
                      {t.teacherNameAr}
                    </p>
                  )}
                </div>
              )}

              {/* ═══ DROITE : Date (centrée sur son axe) ═══ */}
              <div className="text-center" style={{ width: "100px" }}>
                <div className="w-full h-px mb-2" style={{ background: `linear-gradient(to right, transparent, ${t.accentColor}40, transparent)` }}/>
                <p style={{ color: "#9ca3af", fontSize: "0.55rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "2px" }}>Date</p>
                <p style={{ color: t.textColor, fontSize: "0.8rem", fontWeight: 600, lineHeight: 1.2 }}>{today}</p>
                <p style={{ color: "#9ca3af", fontSize: "0.6rem", marginTop: "4px" }}>
                  {new Date().toLocaleDateString("ar-SA", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>

            {/* Footer compact */}
            <div className="mt-3 flex items-center gap-2" style={{ maxWidth: "600px", margin: "12px auto 0" }}>
              <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${t.primaryColor})` }}/>
              <span style={{ color: t.accentColor + "60", fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
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