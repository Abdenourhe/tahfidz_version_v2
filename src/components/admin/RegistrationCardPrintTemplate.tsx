"use client"

import { QRCodeSVG } from "qrcode.react"
import { useLanguage } from "@/contexts/LanguageContext"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

const nationalityMap: Record<string, Record<string, string>> = {
  fr: {
    DZ: "Algérie", MA: "Maroc", TN: "Tunisie", EG: "Égypte", SA: "Arabie Saoudite",
    AE: "Émirats Arabes Unis", QA: "Qatar", KW: "Koweït", LB: "Liban", SY: "Syrie",
    IQ: "Irak", JO: "Jordanie", PS: "Palestine", SD: "Soudan", LY: "Libye",
    MR: "Mauritanie", SO: "Somalie", TR: "Turquie", CA: "Canada", OTHER: "Autre",
  },
  en: {
    DZ: "Algeria", MA: "Morocco", TN: "Tunisia", EG: "Egypt", SA: "Saudi Arabia",
    AE: "United Arab Emirates", QA: "Qatar", KW: "Kuwait", LB: "Lebanon", SY: "Syria",
    IQ: "Iraq", JO: "Jordan", PS: "Palestine", SD: "Sudan", LY: "Libya",
    MR: "Mauritania", SO: "Somalia", TR: "Turkey", CA: "Canada", OTHER: "Other",
  },
  ar: {
    DZ: "الجزائر", MA: "المغرب", TN: "تونس", EG: "مصر", SA: "السعودية",
    AE: "الإمارات", QA: "قطر", KW: "الكويت", LB: "لبنان", SY: "سوريا",
    IQ: "العراق", JO: "الأردن", PS: "فلسطين", SD: "السودان", LY: "ليبيا",
    MR: "موريتانيا", SO: "الصومال", TR: "تركيا", CA: "كندا", OTHER: "أخرى",
  },
}

const languageMap: Record<string, Record<string, string>> = {
  fr: { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" },
  en: { ar: "Arabic", fr: "French", en: "English", other: "Other" },
  ar: { ar: "العربية", fr: "الفرنسية", en: "الإنجليزية", other: "أخرى" },
}

const levelMap: Record<string, Record<string, string>> = {
  fr: { beginner: "Débutant", intermediate: "Intermédiaire", advanced: "Avancé", expert: "Expert" },
  en: { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" },
  ar: { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم", expert: "خبير" },
}

const dayMap: Record<string, Record<string, string>> = {
  fr: { MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi", THURSDAY: "Jeudi", FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche" },
  en: { MONDAY: "Monday", TUESDAY: "Tuesday", WEDNESDAY: "Wednesday", THURSDAY: "Thursday", FRIDAY: "Friday", SATURDAY: "Saturday", SUNDAY: "Sunday" },
  ar: { MONDAY: "الإثنين", TUESDAY: "الثلاثاء", WEDNESDAY: "الأربعاء", THURSDAY: "الخميس", FRIDAY: "الجمعة", SATURDAY: "السبت", SUNDAY: "الأحد" },
}

export function RegistrationCardPrintTemplate({ student, inviteUrl, school }: Props) {
  const { locale, useT, dir } = useLanguage()
  const t = (key: string) => useT("printCard", key)
  const isRTL = dir === "rtl"

  const s = student
  const u = s.user

  const fmtDate = (d?: string | Date | null) => {
    if (!d) return "—"
    const date = typeof d === "string" ? new Date(d) : d
    const localeStr = locale === "ar" ? "ar-SA" : locale === "en" ? "en-US" : "fr-FR"
    return date.toLocaleDateString(localeStr, { day: "2-digit", month: "long", year: "numeric" })
  }

  const gender = u.gender === "MALE" ? t("male") : u.gender === "FEMALE" ? t("female") : "—"

  const fmtSchedule = (schedule?: Record<string, string> | null) => {
    if (!schedule || Object.keys(schedule).length === 0) return null
    const days = dayMap[locale] ?? dayMap.fr
    return Object.entries(schedule).map(([day, time]) => `${days[day.toUpperCase()] ?? day}: ${time}`).join(" · ")
  }

  const natLabel = (nationalityMap[locale] ?? nationalityMap.fr)[s.nationality ?? ""] ?? s.nationality ?? "—"
  const langLabel = s.spokenLanguages
    ? s.spokenLanguages.split(",").map((k: string) => (languageMap[locale] ?? languageMap.fr)[k.trim()] ?? k.trim()).filter(Boolean).join(" · ")
    : null
  const levelLabel = (levelMap[locale] ?? levelMap.fr)[s.group?.level?.toLowerCase() ?? ""] ?? s.group?.level ?? ""

  return (
    <div
      id="registration-card-print"
      dir={dir}
      style={{
        width: "210mm",
        height: "297mm",
        padding: "16mm",
        background: "#ffffff",
        color: "#1a1a1a",
        fontFamily: "'Arial','Helvetica',sans-serif",
        fontSize: "11pt",
        lineHeight: 1.4,
        boxSizing: "border-box",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Bordure décorative */}
      <div style={{ position: "absolute", inset: "10mm", border: "2px solid #1D9E75", borderRadius: "6px", opacity: 0.25, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: "13mm", border: "1px solid #1D9E75", borderRadius: "4px", opacity: 0.15, pointerEvents: "none" }} />

      {/* En-tête */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #1D9E75", paddingBottom: "10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {school.logo ? (
            <img src={school.logo} alt={school.name} crossOrigin="anonymous" style={{ width: "52px", height: "52px", objectFit: "contain" }} />
          ) : (
            <div style={{ width: "52px", height: "52px", background: "linear-gradient(135deg,#1D9E75,#0F6E56)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: "20px" }}>
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: "18pt", fontWeight: "bold", color: "#1D9E75" }}>{school.name}</div>
            <div style={{ fontSize: "9pt", color: "#555" }}>{school.slug}</div>
            {school.city && <div style={{ fontSize: "9pt", color: "#777" }}>{school.city}</div>}
          </div>
        </div>
        <div style={{ textAlign: isRTL ? "left" : "right" }}>
          <div style={{ fontSize: "9pt", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>{t("title")}</div>
          <div style={{ fontSize: "11pt", color: "#333", fontFamily: "monospace", marginTop: "4px" }}>{s.studentCode}</div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "12px", paddingBottom: "12px" }}>

        {/* Photo + Identité */}
        <div style={{ display: "flex", gap: "16px", background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "14px", flexDirection: isRTL ? "row-reverse" : "row" }}>
          <div style={{ width: "125px", height: "155px", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {u.avatar ? (
              <img src={u.avatar} alt={u.fullName} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "10pt", color: "#999", fontWeight: 600 }}>{t("photoPlaceholder")}</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>{t("fullName")}</div>
            <div style={{ fontSize: "16pt", fontWeight: "bold", color: "#111", letterSpacing: "0.3px" }}>{u.fullName?.toUpperCase?.() || u.fullName}</div>
            {u.fullNameAr && <div style={{ fontSize: "12pt", color: "#444", marginTop: "2px" }}>{u.fullNameAr}</div>}

            <div style={{ display: "flex", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
              <div style={{ minWidth: "80px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("studentCode")}</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{s.studentCode}</div></div>
              <div style={{ minWidth: "60px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("gender")}</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{gender}</div></div>
              <div style={{ minWidth: "100px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("dateOfBirth")}</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{fmtDate(s.dateOfBirth)}</div></div>
              <div style={{ minWidth: "100px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("enrollmentDate")}</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{fmtDate(u.createdAt)}</div></div>
            </div>

            {(natLabel !== "—" || langLabel) && (
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                {natLabel !== "—" && (
                  <div>
                    <span style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("nationality")} : </span>
                    <span style={{ fontSize: "9pt", fontWeight: 600, color: "#333" }}>{natLabel}</span>
                  </div>
                )}
                {langLabel && (
                  <div>
                    <span style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>{t("languages")} : </span>
                    <span style={{ fontSize: "9pt", fontWeight: 600, color: "#333" }}>{langLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scolarité */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#1D9E75", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>{t("schooling")}</div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>{t("group")}</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.group?.name || t("dash")}</div>
              <div style={{ fontSize: "9pt", color: "#777" }}>{levelLabel}</div>
              {fmtSchedule(s.group?.schedule) && (
                <div style={{ fontSize: "9pt", color: "#1D9E75", marginTop: "2px" }}>{fmtSchedule(s.group?.schedule)}</div>
              )}
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>{t("currentSurah")}</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.currentSurahNote || t("dash")}</div>
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>{t("teacher")}</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.teacher?.user?.fullName?.toUpperCase?.() || t("dash")}</div>
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>{t("status")}</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", color: u.isActive ? "#16a34a" : "#dc2626" }}>
                {u.isActive ? t("active") : t("inactive")}
              </div>
            </div>
          </div>
        </div>

        {/* Contact + Parents */}
        <div style={{ display: "flex", gap: "20px", flexDirection: isRTL ? "row-reverse" : "row" }}>
          <div style={{ flex: 1, background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#444", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>{t("contact")}</div>
            <div style={{ fontSize: "10pt", color: "#333", lineHeight: 1.7 }}>
              <div><span style={{ color: "#666", fontSize: "9pt" }}>{t("email")} : </span>{u.email}</div>
              {u.phone && <div><span style={{ color: "#666", fontSize: "9pt" }}>{t("phone")} : </span>{u.phone}</div>}
              {s.emergencyPhone && <div><span style={{ color: "#666", fontSize: "9pt" }}>{t("emergency")} : </span><span style={{ color: "#dc2626", fontWeight: 600 }}>{s.emergencyPhone}</span></div>}
              {(s.address || s.city) && (
                <div><span style={{ color: "#666", fontSize: "9pt" }}>{t("address")} : </span>{(isRTL ? [s.postalCode, s.city, s.address] : [s.address, s.city, s.postalCode]).filter(Boolean).join(", ")}</div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#444", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>{t("parents")}</div>
            {s.parentLinks?.length > 0 ? (
              <div style={{ fontSize: "10pt", color: "#333", lineHeight: 1.7 }}>
                {s.parentLinks.map((link: any) => (
                  <div key={link.id} style={{ marginBottom: "4px", paddingLeft: isRTL ? "0" : "8px", paddingRight: isRTL ? "8px" : "0", borderLeft: isRTL ? "none" : "2px solid #1D9E75", borderRight: isRTL ? "2px solid #1D9E75" : "none" }}>
                    <div style={{ fontWeight: 600 }}>{link.parent.user.fullName}</div>
                    {link.parent.user.phone && <div style={{ fontSize: "9pt", color: "#555" }}>{link.parent.user.phone}</div>}
                    {link.parent.user.email && <div style={{ fontSize: "9pt", color: "#555" }}>{link.parent.user.email}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "10pt", color: "#888", fontStyle: "italic" }}>{t("noParentLinked")}</div>
            )}

            {inviteUrl && (
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8pt", color: "#555", marginBottom: "4px" }}>{t("scanQR")}</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", flexDirection: isRTL ? "row-reverse" : "row" }}>
                  <div style={{ padding: "3px", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" }}>
                    <QRCodeSVG value={inviteUrl} size={64} level="M" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, fontSize: "7pt", color: "#999", wordBreak: "break-all", lineHeight: 1.3 }}>
                    {inviteUrl}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Medical */}
        {s.medicalNotes && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 14px" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#dc2626", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.5px" }}>{t("medicalInfo")}</div>
            <div style={{ fontSize: "10pt", color: "#991b1b", whiteSpace: "pre-wrap" }}>{s.medicalNotes}</div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: "flex", gap: "16px", paddingTop: "12px", borderTop: "1px solid #ccc" }}>
          {[t("signatureParent"), t("signatureStudent"), t("signatureAdmin")].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "9pt", color: "#666", marginBottom: "24px" }}>{label}</div>
              <div style={{ borderBottom: "1px solid #333", width: "100%" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: "8pt", color: "#888" }}>{t("generatedOn")} {fmtDate(new Date())}</div>
        <div style={{ fontSize: "8pt", color: "#777", marginTop: "3px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>{school.name}</span>
          {school.city && <span>|</span>}
          {school.city && <span>{school.city}</span>}
          {school.address && <span>|</span>}
          {school.address && <span>{school.address}</span>}
          {school.phone && <span>|</span>}
          {school.phone && <span>{school.phone}</span>}
        </div>
      </div>
    </div>
  )
}
