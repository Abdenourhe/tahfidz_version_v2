// src/lib/web-push.ts
// Helpers pour envoyer des notifications push Web

import webpush from "web-push"
import { prisma } from "@/lib/prisma"

const publicKey = process.env.VAPID_PUBLIC_KEY
const privateKey = process.env.VAPID_PRIVATE_KEY
const subject = process.env.VAPID_SUBJECT || "mailto:abdenour.hellas@uqat.ca"

let configured = false
function configure() {
  if (configured) return
  if (!publicKey || !privateKey) {
    console.warn("[WEB-PUSH] Clés VAPID manquantes — les notifications push sont désactivées")
    return
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

export function getVapidPublicKey(): string | null {
  return publicKey || null
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  configure()
  if (!configured) return { success: false, reason: "vapid_not_configured" }

  const sub = await prisma.pushSubscription.findUnique({ where: { userId } })
  if (!sub) return { success: false, reason: "no_subscription" }

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload)
    )
    return { success: true }
  } catch (error: any) {
    console.error("[WEB-PUSH] Erreur d'envoi à", userId, error?.message || error)
    // Si l'abonnement est invalide/expiré, le supprimer
    if (error?.statusCode === 404 || error?.statusCode === 410) {
      await prisma.pushSubscription.delete({ where: { userId } }).catch(() => {})
    }
    return { success: false, reason: "send_failed" }
  }
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const results = await Promise.all(userIds.map((id) => sendPushToUser(id, payload)))
  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  }
}
