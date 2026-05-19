"use client"
// src/components/admin/CertificatePrint.tsx — Prévisualisation + impression du certificat

import { useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Printer, BookOpen, Star, User } from "lucide-react"
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
  title: "Certificat de Mémorisation",
  titleAr: "شَهَادَةُ الْحِفْظ",
  subtitle: "Niveau",
  bodyText: "Pour avoir accompli avec succès son programme de mémorisation du Saint Coran.",
  arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  primaryColor: "#10b981",
  accentColor: "#059669",
  lightColor: "#d1fae5",
  textColor: "#065f46",
  badgeEmoji: "🌱",
}

export function CertificatePrint({ student, school, template = DEFAULT_TEMPLATE }: Props) {
  const [note, setNote] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const today = new Date().toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  })

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const t = template

  return (
    <>
      {/* ─── Styles d'impression ─── */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #certificate-area, #certificate-area * { visibility: visible !important; }
          #certificate-area {
            position: fixed !important;
            top: 0 !important; left: 0 !important;
            width: 100vw !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4 portrait; }
        }
      `}</style>

      {/* ─── Interface admin (masquée à l'impression) ─── */}
      <div className="space-y-6 no-print">
        <div className="flex items-center gap-3">
          <Link href={`/admin/students/${student.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={18} className="text-gray-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Certificat</h1>
            <p className="text-sm text-gray-500">{student.fullName}</p>
          </div>
        </div>

        {/* Note personnalisée */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">
            📝 Note personnalisée <span className="font-normal text-gray-400">(optionnelle)</span>
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            maxLength={300}
            placeholder="Ex: Félicitations pour votre persévérance et votre dévouement dans la mémorisation du Saint Coran…"
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-tahfidz-green resize-none"
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
          <p className="text-xs text-gray-400">Le PDF s&apos;ouvrira dans votre navigateur</p>
        </div>
      </div>

      {/* ─── CERTIFICAT (visible à l'impression + prévisualisation) ─── */}
      <div id="certificate-area" ref={certRef}
        className="mt-6 bg-white rounded-2xl overflow-hidden shadow-xl border border-gray-100 print:shadow-none print:rounded-none print:border-0">

        {/* Bandeau supérieur décoratif */}
        <div className="h-3" style={{ background: `linear-gradient(to right, ${t.primaryColor}, ${t.accentColor}, ${t.primaryColor})` }} />

        <div className="p-10 print:p-12">

          {/* Verset arabe en haut */}
          <div className="text-center mb-6">
            <p className="arabic text-xl font-bold" style={{ color: t.primaryColor }}>{t.arabicVerse}</p>
          </div>

          {/* Ligne séparatrice ornementale */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${t.primaryColor}60)` }} />
            <span className="text-lg" style={{ color: t.primaryColor }}>❁</span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${t.primaryColor}60)` }} />
          </div>

          {/* En-tête : logo école + titre certificat */}
          <div className="flex items-start justify-between mb-8">
            {/* Logo école */}
            <div className="flex items-center gap-4">
              {school.logo ? (
                <img
                  src={school.logo}
                  alt={`Logo ${school.name}`}
                  className="w-20 h-20 object-contain rounded-xl border border-gray-100 p-1"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-md"
                  style={{ background: `linear-gradient(to bottom right, ${t.primaryColor}, ${t.accentColor})` }}>
                  <span className="text-white font-bold text-3xl">{school.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <p className="font-bold text-gray-900 text-lg leading-tight">{school.name}</p>
                {school.nameAr && (
                  <p className="arabic text-gray-600 text-base mt-0.5">{school.nameAr}</p>
                )}
                {school.city && <p className="text-xs text-gray-400 mt-1">{school.city}</p>}
              </div>
            </div>

            {/* Titre certificat */}
            <div className="text-right">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: t.primaryColor }}>
                {t.subtitle}
              </p>
              <p className="text-2xl font-bold text-gray-900 leading-tight">{t.title}</p>
              <p className="arabic text-xl mt-1" style={{ color: t.primaryColor }}>{t.titleAr}</p>
            </div>
          </div>

          {/* Corps principal : photo + infos étudiant */}
          <div className="flex items-start gap-8 mb-8">
            {/* Photo ou initiales */}
            <div className="flex-shrink-0">
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.fullName}
                  className="w-28 h-28 rounded-2xl object-cover shadow-md"
                  style={{ border: `4px solid ${t.lightColor}` }}
                />
              ) : (
                <div className="w-28 h-28 rounded-2xl flex items-center justify-center shadow-md"
                  style={{ background: `linear-gradient(to bottom right, ${t.primaryColor}, ${t.accentColor})`, border: `4px solid ${t.lightColor}` }}>
                  <span className="text-white font-bold text-4xl">
                    {student.fullName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Infos principale */}
            <div className="flex-1">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Décerné à</p>
              <h2 className="text-3xl font-bold text-gray-900 mb-1">{student.fullName}</h2>
              {student.fullNameAr && (
                <p className="arabic text-xl text-gray-500 mb-3">{student.fullNameAr}</p>
              )}

              <p className="text-sm text-gray-600 mb-4">{t.bodyText}</p>

              {/* Badges infos */}
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                  style={{ background: t.lightColor, color: t.textColor, borderColor: t.primaryColor + "50" }}>
                  <BookOpen size={13}/>
                  {t.badgeEmoji} {student.level}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Star size={13}/>
                  {student.totalStars} étoiles
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
                  style={{ background: t.lightColor, color: t.textColor, borderColor: t.primaryColor + "40" }}>
                  📖 {student.memorizedCount} sourate{student.memorizedCount > 1 ? "s" : ""}
                </span>
                {student.groupName && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    👥 {student.groupName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sourates mémorisées */}
          {student.memorizedSurahs.length > 0 && (
            <div className="mb-8 p-5 rounded-xl border" style={{ background: t.lightColor + "60", borderColor: t.primaryColor + "30" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: t.textColor }}>
                Sourates mémorisées
              </p>
              <div className="flex flex-wrap gap-2">
                {student.memorizedSurahs.map(s => (
                  <span key={s.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border text-xs shadow-sm"
                    style={{ borderColor: t.primaryColor + "30" }}>
                    <span className="w-5 h-5 rounded-full text-white flex items-center justify-center font-bold text-[10px]"
                      style={{ background: t.primaryColor }}>
                      {s.id}
                    </span>
                    <span className="text-gray-700 font-medium">{s.nameFr}</span>
                    <span className="arabic text-gray-500">{s.nameAr}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note personnalisée */}
          {note && (
            <div className="mb-8 p-5 rounded-xl border relative"
              style={{ background: t.lightColor + "80", borderColor: t.primaryColor + "30" }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: t.primaryColor }}>
                Note de l&apos;administration
              </p>
              <p className="text-sm text-gray-700 italic leading-relaxed">&ldquo;{note}&rdquo;</p>
            </div>
          )}

          {/* Signatures + date */}
          <div className="flex items-end justify-between mt-8 pt-6 border-t" style={{ borderColor: t.primaryColor + "20" }}>
            <div className="text-center space-y-1">
              <div className="w-40 h-px mx-auto mb-2" style={{ background: t.primaryColor + "50" }} />
              <p className="text-xs text-gray-500">Direction de l&apos;école</p>
              <p className="text-xs font-medium text-gray-700">{school.name}</p>
            </div>
            <div className="text-center space-y-1">
              <div className="w-40 h-px mx-auto mb-2" style={{ background: t.primaryColor + "50" }} />
              <p className="text-xs text-gray-500">Date d&apos;émission</p>
              <p className="text-xs font-medium text-gray-700">{new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
