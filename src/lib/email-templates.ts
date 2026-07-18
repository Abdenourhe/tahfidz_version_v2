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

// ── Templates par défaut actuels (alignés avec prisma/seed-site-config.ts) ──
export const defaultEmailTemplates: Record<EmailTemplateKey, EmailTemplate> = {
  welcome: {
    subject: "Bienvenue sur {{appName}}",
    body: `Bonjour {{fullName}},

Nous avons le plaisir de vous accueillir sur {{appName}}.{{#schoolName}} Votre école {{schoolName}} a été créée avec succès et est prête à être configurée.{{/schoolName}}{{^schoolName}} Votre compte a été créé avec succès.{{/schoolName}}

{{#schoolSlug}}Identifiant de votre école : {{schoolSlug}}
{{/schoolSlug}}
{{#password}}Voici vos identifiants de connexion :
• Adresse email : {{email}}
• Mot de passe temporaire : {{password}}
• Profil : {{role}}

Pour des raisons de sécurité, nous vous invitons à modifier votre mot de passe dès votre première connexion.{{/password}}
{{^password}}Vous pouvez dès maintenant vous connecter à votre espace administrateur à l'aide de l'adresse email que vous nous avez communiquée lors de votre inscription.{{/password}}

Cliquez sur le lien ci-dessous pour accéder à la plateforme :
{{loginUrl}}

Si vous avez la moindre question, notre équipe reste à votre disposition.

Cordialement,
L'équipe {{appName}}`,
  },
  "reset-password": {
    subject: "Réinitialisation de votre mot de passe",
    body: "Bonjour {{fullName}},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour choisir un nouveau mot de passe :\n\n{{resetUrl}}\n\nCe lien est valable 20 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe {{appName}}",
  },
  "invite-parent": {
    subject: "Invitation à rejoindre {{appName}}",
    body: "Bonjour{{#fullName}} {{fullName}},{{/fullName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur {{appName}}.\n\nCliquez sur le lien suivant pour activer votre compte :\n\n{{inviteUrl}}\n\nCe lien est valable 30 jours.\n\nCordialement,\nL'équipe {{appName}}",
  },
}

// ── Anciens templates par défaut à remplacer automatiquement ──
const legacyDefaultTemplates: Record<EmailTemplateKey, EmailTemplate[]> = {
  welcome: [
    {
      subject: "Bienvenue sur TAHFIDZ",
      body: "Bonjour {{fullName}},\n\nBienvenue sur TAHFIDZ. Votre école est maintenant prête à être configurée.",
    },
    {
      subject: "Bienvenue sur {{appName}}",
      body: "Bonjour {{fullName}},\n\nBienvenue sur {{appName}}. Votre école est maintenant prête à être configurée.",
    },
    {
      subject: "Bienvenue sur {{appName}}",
      body: `Bonjour {{fullName}},

Nous avons le plaisir de vous accueillir sur {{appName}}.{{#schoolName}} Votre école {{schoolName}} a été créée avec succès et est prête à être configurée.{{/schoolName}}{{^schoolName}} Votre compte a été créé avec succès.{{/schoolName}}

{{#password}}Voici vos identifiants de connexion :
• Adresse email : {{email}}
• Mot de passe temporaire : {{password}}
• Profil : {{role}}

Pour des raisons de sécurité, nous vous invitons à modifier votre mot de passe dès votre première connexion.{{/password}}
{{^password}}Vous pouvez dès maintenant vous connecter à votre espace administrateur à l'aide de l'adresse email que vous nous avez communiquée lors de votre inscription.{{/password}}

Cliquez sur le lien ci-dessous pour accéder à la plateforme :
{{loginUrl}}

Si vous avez la moindre question, notre équipe reste à votre disposition.

Cordialement,
L'équipe {{appName}}`,
    },
  ],
  "reset-password": [],
  "invite-parent": [],
}

function normalizeTemplate(tpl: EmailTemplate): string {
  return `${tpl.subject.trim()}\n---BODY---\n${tpl.body.trim()}`
}

function isLegacyTemplate(key: EmailTemplateKey, tpl: EmailTemplate): boolean {
  return legacyDefaultTemplates[key].some((legacy) => normalizeTemplate(legacy) === normalizeTemplate(tpl))
}

/**
 * Migre les templates d'emails stockés qui correspondent exactement à un ancien
 * modèle par défaut vers le nouveau modèle par défaut.
 * Utile pour mettre à jour l'affichage dans l'éditeur SuperAdmin sans toucher
 * aux templates personnalisés par l'utilisateur.
 */
export function migrateEmailTemplatesIfDefault(
  emails: Partial<Record<EmailTemplateKey, EmailTemplate>> | undefined | null
): Record<EmailTemplateKey, EmailTemplate> {
  const result: Record<EmailTemplateKey, EmailTemplate> = { ...defaultEmailTemplates }
  if (!emails) return result
  for (const key of Object.keys(defaultEmailTemplates) as EmailTemplateKey[]) {
    const stored = emails[key]
    if (stored?.subject?.trim() && stored?.body?.trim()) {
      const cleaned = { subject: stored.subject.trim(), body: stored.body.trim() }
      result[key] = isLegacyTemplate(key, cleaned) ? defaultEmailTemplates[key] : cleaned
    }
  }
  return result
}

/**
 * Récupère un modèle d'email depuis SiteConfig (clé "global").
 * Retourne le modèle par défaut si la config est absente, invalide,
 * ou si le modèle stocké correspond à un ancien template par défaut.
 */
export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplate> {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: "global" } })
    const emails = (config?.value as Record<string, unknown> | undefined)?.emails as
      | Record<EmailTemplateKey, EmailTemplate | undefined>
      | undefined
    const tpl = emails?.[key]
    if (tpl?.subject?.trim() && tpl?.body?.trim()) {
      const cleaned = { subject: tpl.subject.trim(), body: tpl.body.trim() }
      // Si le template stocké est exactement l'ancien modèle par défaut,
      // on le remplace silencieusement par la version plus récente.
      if (isLegacyTemplate(key, cleaned)) {
        console.log(`[EMAIL_TEMPLATES] Migration automatique du template "${key}" vers la nouvelle version par défaut`)
        return defaultEmailTemplates[key]
      }
      return cleaned
    }
  } catch (error) {
    console.error(`[EMAIL_TEMPLATES] Impossible de charger le template "${key}":`, error)
  }
  return defaultEmailTemplates[key]
}

/**
 * Remplace les variables {{key}} dans un texte.
 * Supporte les blocs conditionnels : {{#key}}...{{/key}} et {{^key}}...{{/key}}.
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
export function bodyToHtml(body: string, locale: "fr" | "en" | "ar" = "fr"): string {
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
export function baseTemplate(content: string, locale: "fr" | "en" | "ar" = "fr"): string {
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
            <img
              src="${APP_URL}/images/logo_full_dark.png"
              alt="${APP_NAME}"
              width="160"
              style="display:block;margin:0 auto 12px;max-width:160px;height:auto;"
            />
            <p style="margin:8px 0 0;color:rgba(255,255,255,.9);font-size:18px;font-weight:600;">
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
