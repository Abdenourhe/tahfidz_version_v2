// src/lib/mail.ts — Service d'envoi d'emails via Nodemailer
import nodemailer from "nodemailer"

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
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("[MAIL] SMTP non configuré. Email non envoyé.")
    console.warn("         Destinataire:", to)
    console.warn("         Sujet:", subject)
    return { success: false, error: "SMTP non configuré" }
  }

  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    })
    console.log("[MAIL] Envoyé:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (err) {
    console.error("[MAIL] Erreur d'envoi:", err)
    return { success: false, error: String(err) }
  }
}

export function isMailConfigured(): boolean {
  return !!(SMTP_HOST && SMTP_USER && SMTP_PASS)
}
