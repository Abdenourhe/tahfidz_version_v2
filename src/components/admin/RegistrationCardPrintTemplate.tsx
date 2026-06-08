"use client"

import { QRCodeSVG } from "qrcode.react"

interface Props {
  student: any
  inviteUrl?: string | null
  school: { name: string; logo?: string | null; slug?: string; address?: string | null; city?: string | null; phone?: string | null }
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

  return (
    <div
      id="registration-card-print"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "14mm",
        background: "#ffffff",
        color: "#1a1a1a",
        fontFamily: "'Arial','Helvetica',sans-serif",
        fontSize: "10pt",
        lineHeight: 1.35,
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Bordure décorative */}
      <div
        style={{
          position: "absolute",
          inset: "10mm",
          border: "2px solid #1D9E75",
          borderRadius: "6px",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "12mm",
          border: "1px solid #1D9E75",
          borderRadius: "4px",
          opacity: 0.15,
          pointerEvents: "none",
        }}
      />

      {/* En-tête */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid rgba(29,158,117,0.3)",
          paddingBottom: "8px",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {school.logo ? (
            <img
              src={school.logo}
              alt={school.name}
              crossOrigin="anonymous"
              style={{ width: "44px", height: "44px", objectFit: "contain" }}
            />
          ) : (
            <div
              style={{
                width: "44px",
                height: "44px",
                background: "linear-gradient(135deg,#1D9E75,#0F6E56)",
                borderRadius: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                fontSize: "18px",
              }}
            >
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <div style={{ fontSize: "16pt", fontWeight: "bold", color: "#1D9E75" }}>{school.name}</div>
            <div style={{ fontSize: "7pt", color: "#666", fontFamily: "monospace" }}>{school.slug}</div>
            {school.city && <div style={{ fontSize: "7pt", color: "#888" }}>{school.city}</div>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "7pt", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Fiche d&apos;inscription
          </div>
          <div style={{ fontSize: "9pt", color: "#333", fontFamily: "monospace", marginTop: "3px" }}>
            {s.studentCode}
          </div>
        </div>
      </div>

      {/* Photo + Identité */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "10px" }}>
        <div
          style={{
            width: "56px",
            height: "72px",
            border: "1px solid #ddd",
            borderRadius: "5px",
            overflow: "hidden",
            flexShrink: 0,
            background: "#f8f8f8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {u.avatar ? (
            <img
              src={u.avatar}
              alt={u.fullName}
              crossOrigin="anonymous"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <span style={{ fontSize: "20px" }}>👤</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "7pt", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Nom complet
          </div>
          <div style={{ fontSize: "13pt", fontWeight: "bold", color: "#111" }}>{u.fullName}</div>
          {u.fullNameAr && (
            <div style={{ fontSize: "11pt", color: "#444", marginTop: "1px" }}>{u.fullNameAr}</div>
          )}
          <div style={{ display: "flex", gap: "18px", marginTop: "6px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "7pt", color: "#888" }}>Code élève</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{s.studentCode}</div>
            </div>
            <div>
              <div style={{ fontSize: "7pt", color: "#888" }}>Genre</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{gender}</div>
            </div>
            <div>
              <div style={{ fontSize: "7pt", color: "#888" }}>Date de naissance</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{fmtDate(s.dateOfBirth)}</div>
            </div>
            <div>
              <div style={{ fontSize: "7pt", color: "#888" }}>Date d&apos;inscription</div>
              <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{fmtDate(u.createdAt)}</div>
            </div>
          </div>
          {(s.nationality || s.spokenLanguages) && (
            <div style={{ display: "flex", gap: "6px", marginTop: "6px", flexWrap: "wrap" }}>
              {s.nationality && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "#ecfdf5",
                    color: "#047857",
                    fontSize: "7pt",
                    fontWeight: 600,
                    border: "1px solid #a7f3d0",
                  }}
                >
                  🌍 {s.nationality}
                </span>
              )}
              {s.spokenLanguages && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "3px",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    color: "#1d4ed8",
                    fontSize: "7pt",
                    fontWeight: 600,
                    border: "1px solid #bfdbfe",
                  }}
                >
                  🗣️ {s.spokenLanguages}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Scolarité */}
      <div
        style={{
          background: "rgba(29,158,117,0.06)",
          border: "1px solid rgba(29,158,117,0.15)",
          borderRadius: "6px",
          padding: "8px 10px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "8pt",
            fontWeight: "bold",
            color: "#1D9E75",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: "6px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          🎓 Scolarité
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div style={{ minWidth: "80px" }}>
            <div style={{ fontSize: "7pt", color: "#666" }}>Groupe</div>
            <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{s.group?.name || "—"}</div>
            <div style={{ fontSize: "7pt", color: "#888" }}>{s.group?.level || ""}</div>
          </div>
          <div style={{ minWidth: "80px" }}>
            <div style={{ fontSize: "7pt", color: "#666" }}>Sourah en cours</div>
            <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{s.currentSurahNote || "—"}</div>
          </div>
          <div style={{ minWidth: "80px" }}>
            <div style={{ fontSize: "7pt", color: "#666" }}>Enseignant</div>
            <div style={{ fontSize: "9pt", fontWeight: "bold" }}>{s.teacher?.user?.fullName || "—"}</div>
          </div>
          <div style={{ minWidth: "80px" }}>
            <div style={{ fontSize: "7pt", color: "#666" }}>Statut</div>
            <div style={{ fontSize: "9pt", fontWeight: "bold", color: u.isActive ? "#16a34a" : "#dc2626" }}>
              {u.isActive ? "Actif" : "Inactif"}
            </div>
          </div>
        </div>
      </div>

      {/* Contact + Parents */}
      <div style={{ display: "flex", gap: "14px", marginBottom: "10px" }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "8pt",
              fontWeight: "bold",
              color: "#444",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "5px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            📞 Contact
          </div>
          <div style={{ fontSize: "8.5pt", color: "#333", lineHeight: 1.5 }}>
            <div>✉️ {u.email}</div>
            {u.phone && <div>📱 {u.phone}</div>}
            {s.emergencyPhone && <div>🚨 Urgence: {s.emergencyPhone}</div>}
            {(s.address || s.city) && (
              <div>📍 {[s.address, s.city, s.postalCode].filter(Boolean).join(", ")}</div>
            )}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "8pt",
              fontWeight: "bold",
              color: "#444",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "5px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🛡️ Parents / Tuteurs
          </div>
          {s.parentLinks?.length > 0 ? (
            <div style={{ fontSize: "8.5pt", color: "#333", lineHeight: 1.5 }}>
              {s.parentLinks.map((link: any) => (
                <div key={link.id} style={{ marginBottom: "4px", paddingLeft: "6px", borderLeft: "2px solid rgba(29,158,117,0.3)" }}>
                  <div style={{ fontWeight: 600 }}>{link.parent.user.fullName}</div>
                  {link.parent.user.phone && <div style={{ fontSize: "7.5pt", color: "#666" }}>{link.parent.user.phone}</div>}
                  {link.parent.user.email && <div style={{ fontSize: "7.5pt", color: "#666" }}>{link.parent.user.email}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: "8.5pt", color: "#888", fontStyle: "italic" }}>Aucun parent lié</div>
          )}

          {inviteUrl && (
            <div style={{ marginTop: "6px", paddingTop: "5px", borderTop: "1px solid #eee" }}>
              <div style={{ fontSize: "7pt", color: "#666", marginBottom: "3px" }}>
                Scannez ce QR code pour lier un parent
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <div style={{ padding: "2px", border: "1px solid #ddd", borderRadius: "4px", background: "#fff" }}>
                  <QRCodeSVG value={inviteUrl} size={56} level="M" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "6pt", color: "#aaa", wordBreak: "break-all", lineHeight: 1.3 }}>
                    {inviteUrl}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Medical */}
      {s.medicalNotes && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "6px",
            padding: "6px 10px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              fontSize: "8pt",
              fontWeight: "bold",
              color: "#dc2626",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: "3px",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            🏥 Informations médicales
          </div>
          <div style={{ fontSize: "8.5pt", color: "#991b1b", whiteSpace: "pre-wrap" }}>{s.medicalNotes}</div>
        </div>
      )}

      {/* Signatures */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          paddingTop: "10px",
          borderTop: "1px solid #ddd",
          marginBottom: "10px",
        }}
      >
        {["Signature du parent", "Signature de l'élève", "Signature de l'administration"].map((label) => (
          <div key={label} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "7pt", color: "#888", marginBottom: "20px" }}>{label}</div>
            <div style={{ borderBottom: "1px solid #999", width: "100%" }} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{ borderTop: "1px solid #ddd", paddingTop: "6px", textAlign: "center" }}>
        <div style={{ fontSize: "6pt", color: "#aaa", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Généré le {fmtDate(new Date())}
        </div>
        <div style={{ fontSize: "6pt", color: "#888", marginTop: "2px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600 }}>{school.name}</span>
          {school.city && <span>|</span>}
          {school.city && <span>{school.city}</span>}
          {school.address && <span>|</span>}
          {school.address && <span>📍 {school.address}</span>}
          {school.phone && <span>|</span>}
          {school.phone && <span>📞 {school.phone}</span>}
        </div>
      </div>
    </div>
  )
}
