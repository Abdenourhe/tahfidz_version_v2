// src/lib/email-templates.ts
// Chargement et rendu des modèles d'emails éditables depuis SiteConfig.

import { prisma } from "@/lib/prisma"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TAHFIDZ"

export type EmailLocale = "fr" | "en" | "ar"
export type EmailTemplateKey = "welcome" | "reset-password" | "invite-parent"

export interface EmailTemplate {
  subject: string
  body: string
}

export type MultilingualEmailTemplate = Record<EmailLocale, EmailTemplate>
export type EmailTemplatesConfig = Record<EmailTemplateKey, MultilingualEmailTemplate>

// ── Templates par défaut multilingues ──
export const defaultEmailTemplates: EmailTemplatesConfig = {
  welcome: {
    fr: {
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
    en: {
      subject: "Welcome to {{appName}}",
      body: `Dear {{fullName}},

We are pleased to welcome you to {{appName}}.{{#schoolName}} Your school {{schoolName}} has been successfully created and is ready to be configured.{{/schoolName}}{{^schoolName}} Your account has been successfully created.{{/schoolName}}

{{#schoolSlug}}Your school identifier: {{schoolSlug}}
{{/schoolSlug}}
{{#password}}Here are your login credentials:
• Email address: {{email}}
• Temporary password: {{password}}
• Profile: {{role}}

For security reasons, please change your password upon your first login.{{/password}}
{{^password}}You can now log in to your administrator space using the email address you provided during registration.{{/password}}

Click the link below to access the platform:
{{loginUrl}}

If you have any questions, our team is at your disposal.

Best regards,
The {{appName}} team`,
    },
    ar: {
      subject: "مرحباً بك في {{appName}}",
      body: `السلام عليكم {{fullName}}،

يسعدنا الترحيب بك في {{appName}}.{{#schoolName}} تم إنشاء مدرستك {{schoolName}} بنجاح وهي جاهزة للتهيئة.{{/schoolName}}{{^schoolName}} تم إنشاء حسابك بنجاح.{{/schoolName}}

{{#schoolSlug}}معرف المدرسة : {{schoolSlug}}
{{/schoolSlug}}
{{#password}}بيانات الدخول الخاصة بك :
• البريد الإلكتروني : {{email}}
• كلمة المرور المؤقتة : {{password}}
• الدور : {{role}}

لأسباب أمنية، يرجى تغيير كلمة المرور عند أول تسجيل دخول.{{/password}}
{{^password}}يمكنك الآن تسجيل الدخول إلى حسابك باستخدام البريد الإلكتروني الذي قدمته أثناء التسجيل.{{/password}}

اضغط على الرابط أدناه للوصول إلى المنصة :
{{loginUrl}}

إذا كانت لديك أي أسئلة، فريقنا جاهز لمساعدتك.

مع خالص التحية،
فريق {{appName}}`,
    },
  },
  "reset-password": {
    fr: {
      subject: "Réinitialisation de votre mot de passe",
      body: "Bonjour {{fullName}},\n\nVous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien suivant pour choisir un nouveau mot de passe :\n\n{{resetUrl}}\n\nCe lien est valable 20 minutes. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.\n\nCordialement,\nL'équipe {{appName}}",
    },
    en: {
      subject: "Reset your password",
      body: "Dear {{fullName}},\n\nYou have requested to reset your password. Click the link below to choose a new password:\n\n{{resetUrl}}\n\nThis link is valid for 20 minutes. If you did not request this, please ignore this email.\n\nBest regards,\nThe {{appName}} team",
    },
    ar: {
      subject: "إعادة تعيين كلمة المرور",
      body: "السلام عليكم {{fullName}}،\n\nلقد طلبت إعادة تعيين كلمة المرور. اضغط على الرابط أدناه لاختيار كلمة مرور جديدة :\n\n{{resetUrl}}\n\nهذا الرابط صالح لمدة 20 دقيقة. إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد.\n\nمع خالص التحية،\nفريق {{appName}}",
    },
  },
  "invite-parent": {
    fr: {
      subject: "Invitation à rejoindre {{appName}}",
      body: "Bonjour{{#fullName}} {{fullName}},{{/fullName}}\n\nVous avez été invité à suivre la progression de {{studentName}} sur {{appName}}.\n\nCliquez sur le lien suivant pour activer votre compte :\n\n{{inviteUrl}}\n\nCe lien est valable 30 jours.\n\nCordialement,\nL'équipe {{appName}}",
    },
    en: {
      subject: "Invitation to join {{appName}}",
      body: "Hello{{#fullName}} {{fullName}},{{/fullName}}\n\nYou have been invited to follow {{studentName}}'s progress on {{appName}}.\n\nClick the link below to activate your account:\n\n{{inviteUrl}}\n\nThis link is valid for 30 days.\n\nBest regards,\nThe {{appName}} team",
    },
    ar: {
      subject: "دعوة للانضمام إلى {{appName}}",
      body: "مرحباً{{#fullName}} {{fullName}}،{{/fullName}}\n\nلقد تمت دعوتك لمتابعة تقدم {{studentName}} على {{appName}}.\n\nاضغط على الرابط أدناه لتفعيل حسابك :\n\n{{inviteUrl}}\n\nهذا الرابط صالح لمدة 30 يوماً.\n\nمع خالص التحية،\nفريق {{appName}}",
    },
  },
}

// ── Anciens templates par défaut (structure plate, en français) ──
const legacyFlatTemplates: Record<EmailTemplateKey, EmailTemplate[]> = {
  welcome: [
    {
      subject: "Bienvenue sur TAHFIDZ",
      body: "Bonjour {{fullName}},\n\nBienvenue sur TAHFIDZ. Votre école est maintenant prête à être configurée.",
    },
    {
      subject: "Bienvenue sur {{appName}}",
      body: "Bonjour {{fullName}},\n\nBienvenue sur {{appName}}. Votre école est maintenant prête à être configurée.",
    },
  ],
  "reset-password": [],
  "invite-parent": [],
}

function normalizeTemplate(tpl: EmailTemplate): string {
  return `${tpl.subject.trim()}\n---BODY---\n${tpl.body.trim()}`
}

function isLegacyFlatTemplate(key: EmailTemplateKey, tpl: EmailTemplate): boolean {
  return legacyFlatTemplates[key].some((legacy) => normalizeTemplate(legacy) === normalizeTemplate(tpl))
}

/**
 * Migre une configuration d'emails vers le format multilingue.
 * - Si l'entrée est au format ancien (un seul template par clé), elle est convertie.
 * - Si le template français correspond à un ancien modèle par défaut, toutes les langues
 *   sont remplacées par les nouveaux modèles par défaut multilingues.
 * - Les templates personnalisés sont conservés en français ; l'anglais et l'arabe
 *   reçoivent les modèles par défaut.
 */
export function migrateEmailTemplatesToMultilingual(
  emails: Partial<Record<EmailTemplateKey, MultilingualEmailTemplate | EmailTemplate>> | undefined | null
): EmailTemplatesConfig {
  const result: EmailTemplatesConfig = JSON.parse(JSON.stringify(defaultEmailTemplates))
  if (!emails) return result

  for (const key of Object.keys(defaultEmailTemplates) as EmailTemplateKey[]) {
    const stored = emails[key]
    if (!stored) continue

    // Format multilingue déjà présent
    if ("fr" in stored || "en" in stored || "ar" in stored) {
      const multilingual = stored as MultilingualEmailTemplate
      for (const locale of ["fr", "en", "ar"] as EmailLocale[]) {
        const tpl = multilingual[locale]
        if (tpl?.subject?.trim() && tpl?.body?.trim()) {
          result[key][locale] = { subject: tpl.subject.trim(), body: tpl.body.trim() }
        }
      }
      continue
    }

    // Format ancien : un seul template (français)
    const flat = stored as EmailTemplate
    if (flat.subject?.trim() && flat.body?.trim()) {
      const cleaned = { subject: flat.subject.trim(), body: flat.body.trim() }
      if (isLegacyFlatTemplate(key, cleaned)) {
        // Remplacer par les nouveaux modèles par défaut multilingues
        result[key] = JSON.parse(JSON.stringify(defaultEmailTemplates[key]))
      } else {
        // Conserver le template personnalisé en français, défaut pour en/ar
        result[key].fr = cleaned
      }
    }
  }

  return result
}

/**
 * Récupère un modèle d'email depuis SiteConfig (clé "global") pour une langue donnée.
 * Retourne le modèle par défaut si la config est absente ou invalide.
 */
export async function getEmailTemplate(
  key: EmailTemplateKey,
  locale: EmailLocale = "fr"
): Promise<EmailTemplate> {
  try {
    const config = await prisma.siteConfig.findUnique({ where: { key: "global" } })
    const emails = (config?.value as Record<string, unknown> | undefined)?.emails as
      | Partial<Record<EmailTemplateKey, MultilingualEmailTemplate | EmailTemplate>>
      | undefined

    const migrated = migrateEmailTemplatesToMultilingual(emails)
    const tpl = migrated[key][locale]
    if (tpl?.subject?.trim() && tpl?.body?.trim()) {
      return { subject: tpl.subject.trim(), body: tpl.body.trim() }
    }
  } catch (error) {
    console.error(`[EMAIL_TEMPLATES] Impossible de charger le template "${key}" (${locale}):`, error)
  }
  return defaultEmailTemplates[key][locale]
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
export function bodyToHtml(body: string, locale: EmailLocale = "fr"): string {
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
export function baseTemplate(content: string, locale: EmailLocale = "fr"): string {
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
              ${isAr ? "منصة تحفيظ القرآن الكريم" : locale === "en" ? "Quran Memorization Platform" : "Plateforme de mémorisation du Coran"}
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px;${isAr ? "direction:rtl;text-align:right;" : ""}">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F3F4F6;padding:20px 40px;text-align:center;border-top:1px solid #E5E7EB;">
            <p style="margin:0;color:#9CA3AF;font-size:12px;">
              ${isAr
                ? `© ${new Date().getFullYear()} ${APP_NAME} — جميع الحقوق محفوظة`
                : `© ${new Date().getFullYear()} ${APP_NAME} — All rights reserved`}
            </p>
            <p style="margin:6px 0 0;color:#9CA3AF;font-size:11px;">
              ${isAr
                ? "إذا لم تكن قد طلبت هذا البريد، يمكنك تجاهله."
                : "If you did not request this email, please ignore it."}
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
