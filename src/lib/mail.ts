// src/lib/mail.ts — Envoi d'emails via SendGrid API
// Configuration requise sur Vercel:
//   SENDGRID_API_KEY = ta cle API SendGrid (SG.xxx)
//   SMTP_FROM        = l'email verifie dans SendGrid (ex: ton-email-verifie@gmail.com)
//
// Pour obtenir la cle API:
//   1. SendGrid → Settings → API Keys → Create API Key
//   2. Permissions: "Full Access" ou au minimum "Mail Send"
//   3. Copier la cle (elle commence par SG.)
//
// Pour verifier l'expediteur:
//   1. SendGrid → Settings → Sender Authentication → Single Sender Verification
//   2. Ajouter et verifier ton email

import sgMail from "@sendgrid/mail"

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY
const SMTP_FROM = process.env.SMTP_FROM ?? "noreply@tahfidz.app"

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY)
}

export interface SendMailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  if (!SENDGRID_API_KEY) {
    console.warn("[MAIL] SENDGRID_API_KEY non configure. Email non envoye.")
    console.warn("         Destinataire:", to, "| Sujet:", subject)
    return { success: false, error: "SENDGRID_API_KEY manquant" }
  }

  try {
    const fromEmail = SMTP_FROM.match(/<(.+)>/)?.[1] ?? SMTP_FROM
    const fromName = SMTP_FROM.match(/(.*)\s+</)?.[1]?.trim() ?? "TAHFIDZ"

    const msg: any = {
      to,
      from: { email: fromEmail, name: fromName },
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
    }
    await sgMail.send(msg)

    return { success: true }
  } catch (err: any) {
    const errors = err?.response?.body?.errors
    const msg = errors?.[0]?.message ?? String(err)
    console.error("[MAIL] ERREUR SendGrid:", msg)
    console.error("[MAIL] Detail:", JSON.stringify(err?.response?.body ?? err, null, 2))
    return { success: false, error: msg }
  }
}

export function isMailConfigured(): boolean {
  return !!SENDGRID_API_KEY
}
