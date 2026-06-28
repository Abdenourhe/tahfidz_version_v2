import crypto from "crypto"

const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET

if (typeof window === "undefined" && !QR_HMAC_SECRET && process.env.NODE_ENV === "production") {
  // eslint-disable-next-line no-console
  console.warn("[qr-code] QR_HMAC_SECRET n'est pas défini. Les QR codes ne seront pas sécurisés.")
}

const SECRET = QR_HMAC_SECRET ?? "dev-only-secret-change-me"

export interface QrPayload {
  s: string // schoolSlug
  t: string // qrCodeToken (permanent)
  h: string // HMAC(secret + date du jour)
}

/**
 * Génère un token permanent unique pour une carte étudiant.
 * Utilise un format court (12 caractères base64url) pour un QR code plus petit.
 */
export function generateQrCodeToken(): string {
  return crypto.randomBytes(9).toString("base64url")
}

/**
 * Génère un secret rotatif pour une carte étudiant.
 * Le régénérer invalide les anciens QR codes.
 * Format court (16 caractères hex) pour réduire la taille du QR.
 */
export function generateQrCodeSecret(): string {
  return crypto.randomBytes(8).toString("hex")
}

/**
 * Retourne la date du jour au format YYYY-MM-DD utilisée pour le HMAC.
 */
export function getQrDate(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Calcule le HMAC attendu pour un secret et une date donnés.
 * Tronqué à 16 caractères pour un QR code plus compact tout en gardant une sécurité suffisante.
 */
export function computeQrHmac(secret: string, date: string): string {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${secret}:${date}`)
    .digest("hex")
    .slice(0, 16)
}

/**
 * Génère le payload signé d'un QR code pour un élève.
 */
export function generateQrPayload(
  schoolSlug: string,
  qrCodeToken: string,
  qrCodeSecret: string
): QrPayload {
  const date = getQrDate()
  return {
    s: schoolSlug,
    t: qrCodeToken,
    h: computeQrHmac(qrCodeSecret, date),
  }
}

/**
 * Encode un payload en chaîne base64url prête à être insérée dans une URL.
 */
export function encodeQrPayload(payload: QrPayload): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64url")
}

/**
 * Décode un payload base64url.
 * Retourne null si le format est invalide.
 */
export function decodeQrPayload(encoded: string): QrPayload | null {
  try {
    const json = Buffer.from(encoded, "base64url").toString("utf-8")
    const parsed = JSON.parse(json) as QrPayload
    if (!parsed.s || !parsed.t || !parsed.h) return null
    return parsed
  } catch {
    return null
  }
}

/**
 * Génère un payload compact pour un QR code plus petit et plus facile à scanner.
 * Format : schoolSlug:token:hmac
 */
export function generateCompactQrPayload(
  schoolSlug: string,
  qrCodeToken: string,
  qrCodeSecret: string
): string {
  const { h } = generateQrPayload(schoolSlug, qrCodeToken, qrCodeSecret)
  return `${schoolSlug}:${qrCodeToken}:${h}`
}

/**
 * Décode un payload compact (schoolSlug:token:hmac).
 * Retourne null si le format est invalide.
 */
export function decodeCompactQrPayload(value: string): QrPayload | null {
  const parts = value.trim().split(":")
  if (parts.length !== 3) return null
  const [s, t, h] = parts
  if (!s || !t || !h) return null
  return { s, t, h }
}

/**
 * Tente de décoder n'importe quelle valeur scannée (URL, payload base64 ou compact).
 */
export function decodeAnyQrValue(value: string): QrPayload | null {
  const trimmed = value.trim()

  // 1. Si c'est une URL, extraire le paramètre d
  try {
    const url = new URL(trimmed)
    const d = url.searchParams.get("d")
    if (d) {
      const decoded = decodeQrPayload(d) || decodeCompactQrPayload(d)
      if (decoded) return decoded
    }
  } catch {
    // pas une URL absolue
  }

  // 2. Si c'est une URL relative (/teacher/scan/verify?d=...)
  if (trimmed.includes("?d=")) {
    const d = trimmed.split("?d=")[1]?.split("&")[0]
    if (d) {
      const decoded = decodeQrPayload(d) || decodeCompactQrPayload(d)
      if (decoded) return decoded
    }
  }

  // 3. Payload compact
  const compact = decodeCompactQrPayload(trimmed)
  if (compact) return compact

  // 4. Payload base64url
  return decodeQrPayload(trimmed)
}

/**
 * Construit l'URL complète du QR code (format compact pour faciliter le scan).
 */
export function generateStudentQrUrl(
  appUrl: string,
  schoolSlug: string,
  qrCodeToken: string,
  qrCodeSecret: string
): string {
  const compactPayload = generateCompactQrPayload(schoolSlug, qrCodeToken, qrCodeSecret)
  return `${appUrl}/teacher/scan/verify?d=${encodeURIComponent(compactPayload)}`
}

/**
 * Vérifie qu'un HMAC fourni correspond au secret et à la date du jour.
 * Utilise timingSafeEqual pour éviter les attaques par timing.
 */
export function verifyQrHmac(secret: string, date: string, hmac: string): boolean {
  const expected = computeQrHmac(secret, date)
  try {
    return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expected))
  } catch {
    return false
  }
}
