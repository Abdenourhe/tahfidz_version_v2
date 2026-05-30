// src/lib/mail.ts — Service d'envoi d'emails via SendGrid API (prioritaire) ou Nodemailer SMTP (fallback)
import nodemailer from "nodemailer"
import sgMail from "@sendgrid/mail"

// ——— SendGrid API ———
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
  console.log("[MAIL] SendGrid API configurée")
} else {
  console.log("[MAIL] SENDGRID_API_KEY non définie")
}

// ——— Nodemailer SMTP ———
const SMTP_HOST = process.env.SMTP_HOST
const SMTP_PORT = Number(process.env.SMTP_PORT ?? "587")
const SMTP_USER = process.env.SMTP_USER
const SMTP_PASS = process.env.SMTP_PASS
const SMTP_FROM = process.env.SMTP_FROM ?? "TAHFIDZ <noreply@tahfidz.app>"

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_PORT === 465,
  auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  tls: { rejectUnauthorized: false },
})

export interface SendMailOptions {
  to: string
  subject: string
  text?: string
  html?: string
}

export async function sendMail({ to, subject, text, html }: SendMailOptions) {
  // ——— 1. Priorité : SendGrid API ———
  if (process.env.SENDGRID_API_KEY) {
    try {
      const fromEmail = SMTP_FROM.match(/<(.+)>/)?.[1] ?? SMTP_FROM
      const fromName = SMTP_FROM.match(/(.*)\s+</)?.[1]?.trim() ?? "TAHFIDZ"
      const msg = {
        to,
        from: { email: fromEmail, name: fromName },
        subject,
        text,
        html,
      }
      console.log("[MAIL] Tentative d'envoi via SendGrid API à:", to, "depuis:", fromEmail)
      await sgMail.send(msg)
      console.log("[MAIL] Envoyé avec succès via SendGrid API:", to, "-", subject)
      return { success: true }
    } catch (err: any) {
      const errorBody = err?.response?.body ?? err
      console.error("[MAIL] Erreur SendGrid API:", JSON.stringify(errorBody, null, 2))
      return { success: false, error: err?.response?.body?.errors?.[0]?.message ?? String(err) }
    }
  }

  // ——— 2. Fallback : Nodemailer SMTP ———
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[MAIL] Ni SendGrid API ni SMTP configuré. Email non envoyé.")
    console.warn("         Destinataire:", to)
    console.warn("         Sujet:", subject)
    return { success: false, error: "Email non configuré" }
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    })
    console.log("[MAIL] Envoyé via SMTP:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error("[MAIL] Erreur SMTP:", err)
    return { success: false, error: String(err) }
  }
}

export function isMailConfigured(): boolean {
  const hasSendGrid = !!process.env.SENDGRID_API_KEY
  const hasSMTP = !!(SMTP_HOST && SMTP_USER && SMTP_PASS)
  console.log(`[MAIL] Config check — SendGrid: ${hasSendGrid}, SMTP: ${hasSMTP}`)
  return hasSendGrid || hasSMTP
}
