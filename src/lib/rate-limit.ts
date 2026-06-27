/**
 * Rate limiting en mémoire simple pour les scans QR.
 * Note : en environnement serverless sans persistance partagée,
 * préférer Redis ou un service dédié en production.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Nettoyage périodique des entrées expirées (toutes les 5 minutes)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

/**
 * Vérifie si une action est autorisée pour une clé donnée.
 * @param key Clé d'identification (ex: "qr-scan:{studentId}")
 * @param max Nombre maximum d'actions par fenêtre
 * @param windowSeconds Durée de la fenêtre en secondes
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, limit: max, remaining: max - 1, resetAt }
  }

  if (existing.count >= max) {
    return {
      success: false,
      limit: max,
      remaining: 0,
      resetAt: existing.resetAt,
    }
  }

  existing.count += 1
  return {
    success: true,
    limit: max,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  }
}

/**
 * Raccourci pour le rate limiting des scans QR par élève.
 * Par défaut : 5 scans par minute.
 */
export function checkQrScanRateLimit(studentId: string): RateLimitResult {
  return checkRateLimit(`qr-scan:${studentId}`, 5, 60)
}
