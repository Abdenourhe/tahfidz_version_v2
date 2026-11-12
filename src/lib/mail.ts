// src/lib/mail.ts — Envoi d'emails via l'API transactionnelle Brevo (ex-Sendinblue)
// Configuration requise sur Vercel :
//   BREVO_API_KEY = ta clé API Brevo (xkeysib-...)
//   SMTP_FROM     = l'expéditeur vérifié dans Brevo (ex: TAHFIDZ <ton-email@gmail.com>)
//
// Pour obtenir la clé API :
//   1. Brevo → SMTP & API → API Keys → Generate a new API key
//   2. Copier la clé (elle commence par xkeysib-)
//
// Pour vérifier l'expéditeur :
//   1. Brevo → Senders, Domains & Dedicated IPs → Senders → Add a sender
//   2. Valider l'email via le lien de confirmation reçu

const BREVO_API_KEY = process.env.BREVO_API_KEY
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@tahfidz.app"

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"

export interface SendMailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  if (!BREVO_API_KEY) {
    console.warn("[MAIL] BREVO_API_KEY non configure. Email non envoye.")
    console.warn("         Destinataire:", to, "| Sujet:", subject)
    return { success: false, error: "BREVO_API_KEY manquant" }
  }

  try {
    const fromEmail = SMTP_FROM.match(/<(.+)>/)?.[1] ?? SMTP_FROM
    const fromName = SMTP_FROM.match(/(.*)\s+</)?.[1]?.trim() ?? "TAHFIDZ"

    const payload: Record<string, unknown> = {
      sender: { email: fromEmail, name: fromName },
      to: [{ email: to }],
      subject,
      ...(text ? { textContent: text } : {}),
      ...(html ? { htmlContent: html } : {}),
    }

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => null)
      const msg = body?.message ?? `Brevo HTTP ${response.status}`
      console.error("[MAIL] ERREUR Brevo:", msg)
      console.error("[MAIL] Detail:", JSON.stringify(body, null, 2))
      return { success: false, error: msg }
    }

    return { success: true }
  } catch (err: any) {
    const msg = err?.message ?? String(err)
    console.error("[MAIL] ERREUR Brevo:", msg)
    return { success: false, error: msg }
  }
}

export function isMailConfigured(): boolean {
  return !!BREVO_API_KEY
}
