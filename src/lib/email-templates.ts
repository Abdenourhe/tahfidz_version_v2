// src/lib/email-templates.ts
// Chargement et rendu des modèles d'emails éditables depuis SiteConfig.

import { prisma } from "@/lib/prisma"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TAHFIDZ"

export type EmailTemplateKey = "welcome" | "reset-password" | "invite-parent"

export interface EmailTemplate {
  subject: string
  body: string
}

// Valeurs par défaut alignées avec prisma/seed-site-config.ts
export const defaultEmailTemplates: Record<EmailTemplateKey, EmailTemplate> = {
  welcome: {
    subject: "Bienvenue sur {{appName}}",
    body: "Bonjour {{fullName}},\n\nBienvenue sur {{appName}}.{{#schoolName}} Votre école {{schoolName}} est maintenant prête à être configurée.{{/schoolName}}{{^schoolName}} Votre compte a été créé avec succès.{{/schoolName}}\n\n{{#password}}Voici vos identifiants de connexion :\n• Email : {{email}}\n• Mot de passe : {{password}}\n• Rôle : {{role}}\n\n{{/password}}Connectez-vous ici : {{loginUrl}}\n\nPensez à changer votre mot de passe lors de votre première connexion.",
  },
  "reset-password": {
    subject: "Réinitialisation de votre mot de passe",
    body: "Bonjour {{fullName}},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour choisir un nouveau mot de passe :\n\n{{resetUrl}}\n\nCe lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
  },
  "invite-parent": {
    subject: "Invitation à rejoindre {{appName}}",
    body: "Bonjour{{#fullName}} {{fullName}},{{/fullName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur {{appName}}.\n\nCliquez sur le lien suivant pour activer votre compte :\n\n{{inviteUrl}}\n\nCe lien est valable 30 jours.",
  },
}

/**
 * Récupère un modèle d'email depuis SiteConfig (clé "global").
 * Retourne le modèle par défaut si la config est absente ou invalide.
 */
export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate> {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: "global" } })
    const emails = (config?.value as Record<string, unknown> | undefined)?.emails as
      | Record<EmailTemplateKey, EmailTemplate | undefined>
      | undefined
    const tpl = emails?.[key]
    if (tpl?.subject?.trim() && tpl?.body?.trim()) {
      return { subject: tpl.subject.trim(), body: tpl.body.trim() }
    }
  } catch (error) {
    console.error(`[EMAIL_TEMPLATES] Impossible de charger le template "${key}":`, error)
  }
  return defaultEmailTemplates[key]
}

/**
 * Remplace les variables {{key}} dans un texte.
 * Supporte les blocs conditionnels : {{#key}}...{{/key}}.
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | undefined | null>
): string {
  const stringVars: Record<string, string> = {}
  for (const [key, value] of Object.entries(variables)) {
    stringVars[key] = value === undefined || value === null ? "" : String(value)
  }

  let result = template

  // Blocs conditionnels positifs : {{#key}}contenu{{/key}}
  result = result.replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key: string, content: string) => {
    return stringVars[key]?.trim() ? content : ""
  })

  // Blocs conditionnels inverses : {{^key}}contenu{{/key}}
  result = result.replace(/\{\{\^(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (match, key: string, content: string) => {
    return !stringVars[key]?.trim() ? content : ""
  })

  // Variables simples : {{key}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return stringVars[key] ?? match
  })

  return result
}

/**
 * Détecte les URLs dans un texte et les transforme en liens cliquables.
 */
function autoLink(text: string): string {
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  return text.replace(urlRegex, (url) => {
    const safeUrl = url.replace(/"/g, "&quot;")
    return `<a href="${safeUrl}" style="color:#1D9E75;text-decoration:underline;">${url}</a>`
  })
}

/**
 * Convertit un corps de mail (texte brut) en HTML sûr, puis l'encapsule
 * dans le template de base de l'application.
 */
export function bodyToHtml(body: string, locale: "fr" | "ar" = "fr"): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
  const withBreaks = escaped.replace(/\n/g, "<br>")
  const linked = autoLink(withBreaks)
  return baseTemplate(linked, locale)
}

/**
 * Template HTML de base commun à tous les emails (branding TAHFIDZ).
 */
export function baseTemplate(content: string, locale: "fr" | "ar" = "fr"): string {
  const isAr = locale === "ar"
  const dir = isAr ? "rtl" : "ltr"
  const fontFamily = isAr
    ? "'Noto Naskh Arabic', 'Georgia', serif"
    : "'Segoe UI', 'Helvetica Neue', Arial, sans-serif"

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${APP_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:${fontFamily};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1D9E75,#0F6E56);padding:32px 40px;text-align:center;">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:rgba(255,255,255,.2);border-radius:12px;margin-bottom:12px;">
              <span style="color:#fff;font-size:20px;font-weight:700;">TH</span>
            </div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;">${APP_NAME}</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,.8);font-size:14px;">
              ${isAr ? "منصة تحفيظ القرآن الكريم" : "Plateforme de mémorisation du Coran"}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F3F4F6;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              ${isAr
                ? `© ${new Date().getFullYear()} ${APP_NAME} — جميع الحقوق محفوظة`
                : `© ${new Date().getFullYear()} ${APP_NAME} — Tous droits réservés`}
            </p>
            <p style="margin:6px 0 0;color:#9CA3AF;font-size:11px;">
              ${isAr
                ? "إذا لم تكن قد طلبت هذا البريد، يمكنك تجاهله."
                : "Si vous n'avez pas demandé cet email, ignorez-le."}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Variables communes disponibles dans tous les templates.
 */
export function commonVariables(): Record<string, string> {
  return {
    appName: APP_NAME,
    loginUrl: `${APP_URL}/login`,
  }
}
