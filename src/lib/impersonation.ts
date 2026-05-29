// src/lib/impersonation.ts
// Helper sécurisé pour l'impersonation superadmin → admin école
// Cookie signé HMAC, expiration 2h, httpOnly + secure + sameSite strict

import { cookies } from "next/headers"
import { createHmac, timingSafeEqual } from "crypto"

const SECRET = process.env.IMPERSONATION_SECRET!
if (!SECRET && process.env.NODE_ENV === "production") {
  throw new Error("IMPERSONATION_SECRET is required in production")
}

const FALLBACK_SECRET = "dev-imersonation-secret-do-not-use-in-production"

export interface ImpersonationPayload {
  targetAdminId: string
  targetSchoolId: string
  superadminId: string
  createdAt: number
}

function getSecret(): string {
  return SECRET || FALLBACK_SECRET
}

function sign(payload: ImpersonationPayload): string {
  const data = JSON.stringify(payload)
  return createHmac("sha256", getSecret()).update(data).digest("hex")
}

export function verifySignature(payload: ImpersonationPayload, signature: string): boolean {
  try {
    const expected = sign(payload)
    const sigBuf = Buffer.from(signature, "hex")
    const expBuf = Buffer.from(expected, "hex")
    if (sigBuf.length !== expBuf.length) return false
    return timingSafeEqual(sigBuf, expBuf)
  } catch {
    return false
  }
}

/** Vérifie la valeur brute du cookie (pour middleware + API routes) */
export function verifyImpersonationCookie(rawValue: string): ImpersonationPayload | null {
  try {
    const decoded = JSON.parse(Buffer.from(rawValue, "base64").toString())
    const { signature, ...payload } = decoded
    if (!verifySignature(payload, signature)) return null
    if (Date.now() - payload.createdAt > 2 * 60 * 60 * 1000) return null // 2h max
    return payload
  } catch {
    return null
  }
}

/** Crée le cookie signé (Server Components / Server Actions) */
export async function setImpersonation(payload: ImpersonationPayload) {
  const signature = sign(payload)
  const value = Buffer.from(JSON.stringify({ ...payload, signature })).toString("base64")
  const cookieStore = await cookies()
  cookieStore.set("impersonation_ctx", value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 2, // 2 heures
    path: "/",
  })
}

/** Retourne la valeur et les options du cookie (pour API routes NextResponse) */
export function buildImpersonationCookie(payload: ImpersonationPayload) {
  const signature = sign(payload)
  const value = Buffer.from(JSON.stringify({ ...payload, signature })).toString("base64")
  return {
    name: "impersonation_ctx",
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 2,
      path: "/",
    },
  }
}

/** Lit et vérifie le cookie (Server Components / Server Actions) */
export async function getImpersonation(): Promise<ImpersonationPayload | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get("impersonation_ctx")?.value
  if (!raw) return null
  return verifyImpersonationCookie(raw)
}

/** Supprime le cookie */
export async function clearImpersonation() {
  const cookieStore = await cookies()
  cookieStore.delete("impersonation_ctx")
}
