"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { Download, Printer, Phone, Mail, MapPin, Calendar, User, GraduationCap, HeartPulse, Shield, Clock, Copy, CheckCircle2, Globe, Languages } from "lucide-react"
import { QRCodeSVG } from "qrcode.react"
import { useLanguage, useT } from "@/contexts/LanguageContext"
import { AvatarLightbox } from "@/components/AvatarLightbox"
import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

interface Props {
  student: any
  inviteUrl: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

export function RegistrationCard({ student, inviteUrl, school }: Props) {
  const { locale } = useLanguage()
  const L = locale as "fr" | "en" | "ar"
  const t = useT("registrationCard")
  const cardRef = useRef<HTMLDivElement>(null)

  const [copied, setCopied] = useState(false)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!cardRef.current) return
    const btn = document.getElementById("pdf-btn")
    if (btn) btn.style.display = "none"
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL("image/png")
      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight)
      const centerX = (pageWidth - imgWidth * ratio) / 2
      pdf.addImage(imgData, "PNG", centerX, 0, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`fiche-inscription-${student.studentCode}.pdf`)
    } finally {
      if (btn) btn.style.display = "flex"
    }
  }

  const handleCopy = () => {
    if (!inviteUrl) return
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const formatDate = (d?: Date | string | null) => {
    if (!d) return "—"
    const date = typeof d === "string" ? new Date(d) : d
    return date.toLocaleDateString(L === "ar" ? "ar-SA" : L === "en" ? "en-US" : "fr-FR", {
      day: "2-digit", month: "long", year: "numeric",
    })
  }

  const genderLabel = (g?: string | null) => {
    if (!g) return "—"
    return g === "MALE" ? t("male") : t("female")
  }

  const levelLabel = (lvl?: string | null) => {
    if (!lvl) return ""
    const map: Record<string, Record<string, string>> = {
      fr: { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé" },
      en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
      ar: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
    }
    return map[L]?.[lvl] ?? lvl
  }

  const nationalityLabel = (code?: string | null) => {
    if (!code) return "—"
    const map: Record<string, Record<string, string>> = {
      fr: { DZ: "Algérien(ne)", MA: "Marocain(e)", TN: "Tunisien(ne)", EG: "Égyptien(ne)", SA: "Saoudien(ne)", AE: "Émirien(ne)", QA: "Qatari(e)", KW: "Koweïtien(ne)", LB: "Libanais(e)", SY: "Syrien(ne)", IQ: "Irakien(ne)", JO: "Jordanien(ne)", PS: "Palestinien(ne)", SD: "Soudanais(e)", LY: "Libyen(ne)", MR: "Mauritanien(ne)", SO: "Somalien(ne)", TR: "Turc/Turque", CA: "Canadien(ne)", OTHER: "Autre" },
      en: { DZ: "Algerian", MA: "Moroccan", TN: "Tunisian", EG: "Egyptian", SA: "Saudi", AE: "Emirati", QA: "Qatari", KW: "Kuwaiti", LB: "Lebanese", SY: "Syrian", IQ: "Iraqi", JO: "Jordanian", PS: "Palestinian", SD: "Sudanese", LY: "Libyan", MR: "Mauritanian", SO: "Somali", TR: "Turkish", CA: "Canadian", OTHER: "Other" },
      ar: { DZ: "جزائري(ة)", MA: "مغربي(ة)", TN: "تونسي(ة)", EG: "مصري(ة)", SA: "سعودي(ة)", AE: "إماراتي(ة)", QA: "قطري(ة)", KW: "كويتي(ة)", LB: "لبناني(ة)", SY: "سوري(ة)", IQ: "عراقي(ة)", JO: "أردني(ة)", PS: "فلسطيني(ة)", SD: "سوداني(ة)", LY: "ليبي(ة)", MR: "موريتاني(ة)", SO: "صومالي(ة)", TR: "تركي(ة)", CA: "كندي(ة)", OTHER: "أخرى" },
    }
    return map[L]?.[code] ?? code
  }

  const languageLabel = (key: string) => {
    const map: Record<string, Record<string, string>> = {
      fr: { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" },
      en: { ar: "Arabic", fr: "French", en: "English", other: "Other" },
      ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية", other: "أخرى" },
    }
    return map[L]?.[key] ?? key
  }

  const formatSchedule = (schedule?: Record<string, string> | null) => {
    if (!schedule || Object.keys(schedule).length === 0) return null
    const dayNames: Record<string, string> = {
      MONDAY: L === "ar" ? "الإثنين" : L === "en" ? "Monday" : "Lundi",
      TUESDAY: L === "ar" ? "الثلاثاء" : L === "en" ? "Tuesday" : "Mardi",
      WEDNESDAY: L === "ar" ? "الأربعاء" : L === "en" ? "Wednesday" : "Mercredi",
      THURSDAY: L === "ar" ? "الخميس" : L === "en" ? "Thursday" : "Jeudi",
      FRIDAY: L === "ar" ? "الجمعة" : L === "en" ? "Friday" : "Vendredi",
      SATURDAY: L === "ar" ? "السبت" : L === "en" ? "Saturday" : "Samedi",
      SUNDAY: L === "ar" ? "الأحد" : L === "en" ? "Sunday" : "Dimanche",
    }
    return Object.entries(schedule).map(([day, time]) => `${dayNames[day] ?? day}: ${time}`).join(" · ")
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 print:py-0 print:bg-white">
      {/* Boutons (cachés en print) */}
      <div id="pdf-btn" className="max-w-[210mm] mx-auto mb-4 px-4 print:hidden flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-5 py-2.5 bg-tahfidz-green text-white text-sm font-semibold rounded-xl hover:bg-tahfidz-green-dark transition shadow-sm"
          >
            <Download size={16} /> PDF
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gray-700 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition shadow-sm"
          >
            <Printer size={16} /> {t("print")}
          </button>
        </div>
      </div>

      {/* Carte A4 */}
      <div
        ref={cardRef}
        id="registration-card"
        className="max-w-[210mm] min-h-[297mm] mx-auto bg-white shadow-xl print:shadow-none print:max-w-none print:w-full print:min-h-0 relative overflow-hidden"
      >
        {/* Bordure décorative */}
        <div className="absolute inset-3 border-2 border-tahfidz-green/20 rounded-xl pointer-events-none print:inset-2" />
        <div className="absolute inset-4 border border-tahfidz-green/10 rounded-lg pointer-events-none print:inset-3" />

        <div className="p-8 print:p-5 space-y-5 print:space-y-3">
          {/* En-tête */}
          <div className="flex items-center justify-between border-b-2 border-tahfidz-green/20 pb-4 print:pb-3">
            <div className="flex items-center gap-4">
              {school.logo ? (
                <Image src={school.logo} alt={school.name} width={64} height={64} className="w-16 h-16 object-contain" unoptimized />
              ) : (
                <div className="w-16 h-16 rounded-xl gradient-tahfidz flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">{school.name.charAt(0)}</span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-tahfidz-green">{school.name}</h2>
                <p className="text-xs text-gray-500 font-mono">{school.slug}</p>
                {school.city && <p className="text-xs text-gray-400 mt-0.5">{school.city}</p>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wider">{t("docTitle")}</p>
              <p className="text-sm font-mono text-gray-600 mt-1">{student.studentCode}</p>
            </div>
          </div>

          {/* Photo + Identité */}
          <div className="flex gap-6 items-start">
            <div className="w-24 h-32 print:w-20 print:h-28 rounded-xl border-2 border-gray-200 overflow-hidden flex-shrink-0 bg-gray-50 flex items-center justify-center">
              <AvatarLightbox
                src={student.user.avatar}
                alt={student.user.fullName}
                fallback={<User size={40} className="text-gray-300" />}
                className="w-full h-full"
                imgClassName="w-full h-full"
              />
            </div>
            <div className="flex-1 space-y-2 print:space-y-1.5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider">{t("fullName")}</p>
                <p className="text-xl print:text-lg font-bold text-gray-900">{student.user.fullName}</p>
                {student.user.fullNameAr && <p className="arabic text-gray-600 text-base print:text-sm mt-0.5">{student.user.fullNameAr}</p>}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2">
                <div>
                  <p className="text-xs text-gray-400">{t("studentCode")}</p>
                  <p className="font-semibold text-gray-800 font-mono">{student.studentCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("gender")}</p>
                  <p className="font-semibold text-gray-800">{genderLabel(student.user.gender)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("dob")}</p>
                  <p className="font-semibold text-gray-800">{formatDate(student.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">{t("enrollmentDate")}</p>
                  <p className="font-semibold text-gray-800">{formatDate(student.user.createdAt)}</p>
                </div>
              </div>
              {(student.nationality || student.spokenLanguages) && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {student.nationality && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      <Globe size={12} /> {nationalityLabel(student.nationality)}
                    </span>
                  )}
                  {student.spokenLanguages && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                      <Languages size={12} />
                      {student.spokenLanguages.split(",").map((k: string) => languageLabel(k.trim())).filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Scolarité */}
          <div className="bg-tahfidz-green-light/30 rounded-xl p-4 print:p-3 border border-tahfidz-green/10">
            <h3 className="text-sm font-bold text-tahfidz-green uppercase tracking-wider mb-3 print:mb-2 flex items-center gap-2">
              <GraduationCap size={16} /> {t("schooling")}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 print:gap-2">
              <div>
                <p className="text-xs text-gray-500">{t("group")}</p>
                <p className="font-semibold text-gray-800">{student.group?.name || "—"}</p>
                <p className="text-xs text-gray-400">{levelLabel(student.group?.level)}</p>
                {formatSchedule(student.group?.schedule) && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Clock size={11} /> {formatSchedule(student.group?.schedule)}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("currentSurah") || "Sourah en cours"}</p>
                <p className="font-semibold text-gray-800">{student.currentSurahNote || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("teacher")}</p>
                <p className="font-semibold text-gray-800">{student.teacher?.user.fullName || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">{t("status")}</p>
                <p className={`font-semibold ${student.user.isActive ? "text-green-600" : "text-red-500"}`}>
                  {student.user.isActive ? t("active") : t("inactive")}
                </p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3">
            <div className="space-y-2 print:space-y-1.5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Phone size={16} className="text-tahfidz-green" /> {t("contact")}
              </h3>
              <div className="space-y-1.5 print:space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-600">{student.user.email}</span>
                </div>
                {student.user.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-gray-600">{student.user.phone}</span>
                  </div>
                )}
                {student.emergencyPhone && (
                  <div className="flex items-center gap-2">
                    <HeartPulse size={14} className="text-red-400" />
                    <span className="text-gray-600 font-medium">{t("emergency")}: {student.emergencyPhone}</span>
                  </div>
                )}
                {(student.address || student.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    <span className="text-gray-600">
                      {[student.address, student.city, student.postalCode].filter(Boolean).join(", ")}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Parents */}
            <div className="space-y-2 print:space-y-1.5">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                <Shield size={16} className="text-tahfidz-green" /> {t("parents")}
              </h3>
              {student.parentLinks?.length > 0 ? (
                <div className="space-y-2">
                  {student.parentLinks.map((link: any) => (
                    <div key={link.id} className="text-sm border-l-2 border-tahfidz-green/30 pl-3">
                      <p className="font-semibold text-gray-800">{link.parent.user.fullName}</p>
                      {link.parent.user.phone && <p className="text-gray-500 text-xs">{link.parent.user.phone}</p>}
                      {link.parent.user.email && <p className="text-gray-500 text-xs">{link.parent.user.email}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">{t("noParents")}</p>
              )}

              {/* QR Code invitation */}
              {inviteUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100 print:hidden">
                  <p className="text-xs text-gray-500 mb-2">{t("scanToLinkParent")}</p>
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-1.5 rounded-lg border border-gray-200">
                      <QRCodeSVG value={inviteUrl} size={80} level="M" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-gray-400 break-all leading-tight">{inviteUrl}</p>
                      <button
                        onClick={handleCopy}
                        className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 text-[10px] border border-gray-200 rounded hover:bg-gray-50 transition print:hidden"
                      >
                        {copied ? <CheckCircle2 size={10} className="text-green-600" /> : <Copy size={10} />}
                        {copied ? t("copied") : t("copy")}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical */}
          {student.medicalNotes && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3 print:p-2.5">
              <h3 className="text-sm font-bold text-red-700 uppercase tracking-wider mb-1 flex items-center gap-2">
                <HeartPulse size={16} /> {t("medical")}
              </h3>
              <p className="text-sm text-red-800 whitespace-pre-wrap">{student.medicalNotes}</p>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 print:gap-4 pt-6 print:pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-6 print:mb-4">{t("parentSignature")}</p>
              <div className="border-b border-gray-300 w-full" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-6 print:mb-4">{t("studentSignature")}</p>
              <div className="border-b border-gray-300 w-full" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-6 print:mb-4">{t("adminSignature")}</p>
              <div className="border-b border-gray-300 w-full" />
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-3 mt-2 print:pt-2 print:mt-1">
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                {t("generatedOn")} {formatDate(new Date())}
              </p>
              <div className="flex items-center gap-3 text-[10px] text-gray-500 flex-wrap justify-center">
                <span className="font-semibold">{school.name}</span>
                {school.city && <span className="text-gray-300">|</span>}
                {school.city && <span>{school.city}</span>}
                {school.address && <span className="text-gray-300">|</span>}
                {school.address && <span className="flex items-center gap-1"><MapPin size={10} /> {school.address}</span>}
                {school.phone && <span className="text-gray-300">|</span>}
                {school.phone && <span className="flex items-center gap-1"><Phone size={10} /> {school.phone}</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles d'impression */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #registration-card,
          #registration-card * {
            visibility: visible;
          }
          #registration-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  )
}
