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
 */
export function generateQrCodeToken(): string {
  return crypto.randomUUID()
}

/**
 * Génère un secret rotatif pour une carte étudiant.
 * Le régénérer invalide les anciens QR codes.
 */
export function generateQrCodeSecret(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Retourne la date du jour au format YYYY-MM-DD utilisée pour le HMAC.
 */
export function getQrDate(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * Calcule le HMAC attendu pour un secret et une date donnés.
 */
export function computeQrHmac(secret: string, date: string): string {
  return crypto.createHmac("sha256", SECRET).update(`${secret}:${date}`).digest("hex")
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
 * Construit l'URL complète du QR code.
 */
export function generateStudentQrUrl(
  appUrl: string,
  schoolSlug: string,
  qrCodeToken: string,
  qrCodeSecret: string
): string {
  const payload = generateQrPayload(schoolSlug, qrCodeToken, qrCodeSecret)
  const encoded = encodeQrPayload(payload)
  return `${appUrl}/teacher/scan/verify?d=${encoded}`
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
