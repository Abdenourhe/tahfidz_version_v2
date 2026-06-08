"use client"

import { QRCodeSVG } from "qrcode.react"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
}

const nationalityFull = (code?: string | null) => {
  const map: Record<string, string> = {
    DZ: "Algérie", MA: "Maroc", TN: "Tunisie", EG: "Égypte", SA: "Arabie Saoudite",
    AE: "Émirats Arabes Unis", QA: "Qatar", KW: "Koweït", LB: "Liban", SY: "Syrie",
    IQ: "Irak", JO: "Jordanie", PS: "Palestine", SD: "Soudan", LY: "Libye",
    MR: "Mauritanie", SO: "Somalie", TR: "Turquie", CA: "Canada", OTHER: "Autre",
  }
  return map[code ?? ""] ?? code ?? "—"
}

const languageFull = (key: string) => {
  const map: Record<string, string> = { ar: "Arabe", fr: "Français", en: "Anglais", other: "Autre" }
  return map[key.trim()] ?? key.trim()
}

const levelFull = (level?: string | null) => {
  const map: Record<string, string> = {
    beginner: "Débutant",
    intermediate: "Intermédiaire",
    advanced: "Avancé",
    expert: "Expert",
  }
  return map[level?.toLowerCase() ?? ""] ?? level ?? ""
}

export function RegistrationCardPrintTemplate({ student, inviteUrl, school }: Props) {
  const s = student
  const u = s.user

  const fmtDate = (d?: string | Date | null) => {
    if (!d) return "—"
    const date = typeof d === "string" ? new Date(d) : d
    return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  }

  const gender = u.gender === "MALE" ? "Garçon" : u.gender === "FEMALE" ? "Fille" : "—"

  const fmtSchedule = (schedule?: Record<string, string> | null) => {
    if (!schedule || Object.keys(schedule).length === 0) return null
    const days: Record<string, string> = {
      MONDAY: "Lundi", TUESDAY: "Mardi", WEDNESDAY: "Mercredi",
      THURSDAY: "Jeudi", FRIDAY: "Vendredi", SATURDAY: "Samedi", SUNDAY: "Dimanche",
    }
    return Object.entries(schedule).map(([day, time]) => `${days[day] ?? day}: ${time}`).join(" · ")
  }

  const natLabel = nationalityFull(s.nationality)
  const langLabel = s.spokenLanguages
    ? s.spokenLanguages.split(",").map((k: string) => languageFull(k)).filter(Boolean).join(" · ")
    : null

  return (
    <div
      id="registration-card-print"
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
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "9pt", color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Fiche d&apos;inscription</div>
          <div style={{ fontSize: "11pt", color: "#333", fontFamily: "monospace", marginTop: "4px" }}>{s.studentCode}</div>
        </div>
      </div>

      {/* Corps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", paddingTop: "12px", paddingBottom: "12px" }}>

        {/* Photo + Identité */}
        <div style={{ display: "flex", gap: "16px", background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "14px" }}>
          <div style={{ width: "90px", height: "115px", border: "1px solid #ccc", borderRadius: "6px", overflow: "hidden", flexShrink: 0, background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {u.avatar ? (
              <img src={u.avatar} alt={u.fullName} crossOrigin="anonymous" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span style={{ fontSize: "10pt", color: "#999", fontWeight: 600 }}>PHOTO</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Nom complet</div>
            <div style={{ fontSize: "16pt", fontWeight: "bold", color: "#111", textTransform: "uppercase", letterSpacing: "0.3px" }}>{u.fullName}</div>
            {u.fullNameAr && <div style={{ fontSize: "12pt", color: "#444", marginTop: "2px" }}>{u.fullNameAr}</div>}

            <div style={{ display: "flex", gap: "20px", marginTop: "10px", flexWrap: "wrap" }}>
              <div style={{ minWidth: "80px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Code élève</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{s.studentCode}</div></div>
              <div style={{ minWidth: "60px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Genre</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{gender}</div></div>
              <div style={{ minWidth: "100px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Date de naissance</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{fmtDate(s.dateOfBirth)}</div></div>
              <div style={{ minWidth: "100px" }}><div style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Date d&apos;inscription</div><div style={{ fontSize: "10pt", fontWeight: "bold", color: "#222" }}>{fmtDate(u.createdAt)}</div></div>
            </div>

            {(natLabel || langLabel) && (
              <div style={{ display: "flex", gap: "16px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                {natLabel && natLabel !== "—" && (
                  <div>
                    <span style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Nationalité : </span>
                    <span style={{ fontSize: "9pt", fontWeight: 600, color: "#333" }}>{natLabel}</span>
                  </div>
                )}
                {langLabel && (
                  <div>
                    <span style={{ fontSize: "8pt", color: "#666", textTransform: "uppercase" }}>Langues : </span>
                    <span style={{ fontSize: "9pt", fontWeight: 600, color: "#333" }}>{langLabel}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scolarité */}
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 14px" }}>
          <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#1D9E75", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>Scolarité</div>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>Groupe</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.group?.name || "—"}</div>
              <div style={{ fontSize: "9pt", color: "#777" }}>{levelFull(s.group?.level)}</div>
              {fmtSchedule(s.group?.schedule) && (
                <div style={{ fontSize: "9pt", color: "#1D9E75", marginTop: "2px" }}>{fmtSchedule(s.group?.schedule)}</div>
              )}
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>Sourah en cours</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.currentSurahNote || "—"}</div>
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>Enseignant</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold" }}>{s.teacher?.user?.fullName || "—"}</div>
            </div>
            <div style={{ minWidth: "90px" }}>
              <div style={{ fontSize: "9pt", color: "#555" }}>Statut</div>
              <div style={{ fontSize: "11pt", fontWeight: "bold", color: u.isActive ? "#16a34a" : "#dc2626" }}>
                {u.isActive ? "Actif" : "Inactif"}
              </div>
            </div>
          </div>
        </div>

        {/* Contact + Parents */}
        <div style={{ display: "flex", gap: "20px" }}>
          <div style={{ flex: 1, background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#444", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>Contact</div>
            <div style={{ fontSize: "10pt", color: "#333", lineHeight: 1.7 }}>
              <div><span style={{ color: "#666", fontSize: "9pt" }}>Email : </span>{u.email}</div>
              {u.phone && <div><span style={{ color: "#666", fontSize: "9pt" }}>Téléphone : </span>{u.phone}</div>}
              {s.emergencyPhone && <div><span style={{ color: "#666", fontSize: "9pt" }}>Urgence : </span><span style={{ color: "#dc2626", fontWeight: 600 }}>{s.emergencyPhone}</span></div>}
              {(s.address || s.city) && (
                <div><span style={{ color: "#666", fontSize: "9pt" }}>Adresse : </span>{[s.address, s.city, s.postalCode].filter(Boolean).join(", ")}</div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, background: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", padding: "12px 14px" }}>
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#444", textTransform: "uppercase", marginBottom: "8px", letterSpacing: "0.5px" }}>Parents / Tuteurs</div>
            {s.parentLinks?.length > 0 ? (
              <div style={{ fontSize: "10pt", color: "#333", lineHeight: 1.7 }}>
                {s.parentLinks.map((link: any) => (
                  <div key={link.id} style={{ marginBottom: "4px", paddingLeft: "8px", borderLeft: "2px solid #1D9E75" }}>
                    <div style={{ fontWeight: 600 }}>{link.parent.user.fullName}</div>
                    {link.parent.user.phone && <div style={{ fontSize: "9pt", color: "#555" }}>{link.parent.user.phone}</div>}
                    {link.parent.user.email && <div style={{ fontSize: "9pt", color: "#555" }}>{link.parent.user.email}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: "10pt", color: "#888", fontStyle: "italic" }}>Aucun parent lié</div>
            )}

            {inviteUrl && (
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #e0e0e0" }}>
                <div style={{ fontSize: "8pt", color: "#555", marginBottom: "4px" }}>Scannez ce QR code pour lier un parent</div>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
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
            <div style={{ fontSize: "10pt", fontWeight: "bold", color: "#dc2626", textTransform: "uppercase", marginBottom: "4px", letterSpacing: "0.5px" }}>Informations médicales</div>
            <div style={{ fontSize: "10pt", color: "#991b1b", whiteSpace: "pre-wrap" }}>{s.medicalNotes}</div>
          </div>
        )}

        {/* Signatures */}
        <div style={{ display: "flex", gap: "16px", paddingTop: "12px", borderTop: "1px solid #ccc" }}>
          {["Signature du parent", "Signature de l'élève", "Signature de l'administration"].map((label) => (
            <div key={label} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "9pt", color: "#666", marginBottom: "24px" }}>{label}</div>
              <div style={{ borderBottom: "1px solid #333", width: "100%" }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #ccc", paddingTop: "8px", textAlign: "center", flexShrink: 0 }}>
        <div style={{ fontSize: "8pt", color: "#888" }}>Généré le {fmtDate(new Date())}</div>
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
