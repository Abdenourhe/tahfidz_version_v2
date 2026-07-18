// src/lib/email.ts
// Templates email — envoi délégué à src/lib/mail.ts (SendGrid)

import { sendMail } from "@/lib/mail"
import {
  getEmailTemplate,
  renderTemplate,
  bodyToHtml,
  commonVariables,
  baseTemplate,
  type EmailTemplateKey,
} from "@/lib/email-templates"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TAHFIDZ"

export { baseTemplate }

function infoRow(label: string, value: string, isAr = false): string {
  return `<tr>
    <td style="padding:8px 12px;background:#F9FAFB;font-size:13px;color:#6B7280;width:40%;border-radius:6px;">${label}</td>
    <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:600;${isAr ? "direction:rtl;text-align:right;" : ""}">${value}</td>
  </tr>`
}

// ─── Helpers de rendu des templates éditables ─────────────────────────────────

async function renderTemplatedEmail(
  key: EmailTemplateKey,
  variables: Record<string, string | number | undefined | null>,
  locale: "fr" | "ar" = "fr"
) {
  const tpl = await getEmailTemplate(key)
  const allVars = { ...commonVariables(), ...variables }
  const subject = renderTemplate(tpl.subject, allVars)
  const body = renderTemplate(tpl.body, allVars)
  const html = bodyToHtml(body, locale)
  return { subject, html, text: body }
}

// ─── Emails ───────────────────────────────────────────────────────────────────

/** Email de bienvenue envoyé à la création du compte */
export async function sendWelcomeEmail({
  to,
  fullName,
  email,
  password,
  role,
  schoolName,
  schoolSlug,
  locale = "fr",
}: {
  to: string
  fullName: string
  email: string
  password?: string
  role: string
  schoolName?: string | null
  schoolSlug?: string | null
  locale?: "fr" | "ar"
}) {
  const roleLabels: Record<string, Record<string, string>> = {
    fr: { ADMIN: "Administrateur", TEACHER: "Enseignant", PARENT: "Parent", STUDENT: "Élève" },
    ar: { ADMIN: "مدير", TEACHER: "معلم", PARENT: "ولي أمر", STUDENT: "طالب" },
  }

  try {
    const { subject, html, text } = await renderTemplatedEmail(
      "welcome",
      {
        fullName,
        email,
        password: password ?? "",
        role: roleLabels[locale]?.[role] ?? role,
        schoolName: schoolName ?? "",
        schoolSlug: schoolSlug ?? "",
      },
      locale
    )

    console.log(`[sendWelcomeEmail] Envoi à ${to} — Sujet: ${subject}`)
    const result = await sendMail({ to, subject, html, text })
    console.log(`[sendWelcomeEmail] Résultat pour ${to}:`, result)
    return result
  } catch (error) {
    console.error("[sendWelcomeEmail] Échec rendu template:", error)
  }

  // Fallback : template codé en dur
  const isAr = locale === "ar"
  const content = isAr ? `
    <p style="font-size:18px;color:#1D9E75;font-weight:700;margin-bottom:4px;">السلام عليكم ${fullName} 👋</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">تم إنشاء حسابك في <strong>${APP_NAME}</strong>. نسأل الله أن يُيسّر لك حفظ القرآن الكريم.</p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;">بيانات الدخول</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0 6px;">
        ${infoRow("الدور", roleLabels.ar[role] ?? role, true)}
        ${infoRow("البريد الإلكتروني", email, true)}
        ${password ? infoRow("كلمة المرور", password, true) : ""}
      </table>
    </div>
    <p style="color:#EF4444;font-size:13px;">⚠️ يُرجى تغيير كلمة المرور عند أول تسجيل دخول.</p>
  ` : `
    <p style="font-size:18px;color:#1D9E75;font-weight:700;margin-bottom:4px;">Salam Alaykoum ${fullName} 👋</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">Votre compte <strong>${APP_NAME}</strong> vient d'être créé. Que Allah vous facilite la mémorisation du Saint Coran.</p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#374151;">Vos identifiants de connexion</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-spacing:0 6px;">
        ${infoRow("Rôle", roleLabels.fr[role] ?? role)}
        ${infoRow("Email", email)}
        ${password ? infoRow("Mot de passe", password) : ""}
      </table>
    </div>
    <p style="color:#EF4444;font-size:13px;">⚠️ Pensez à changer votre mot de passe lors de votre première connexion.</p>
  `

  return sendMail({
    to,
    subject: isAr ? `مرحباً بك في ${APP_NAME} 🌟` : `Bienvenue sur ${APP_NAME} 🌟`,
    html: baseTemplate(content, locale),
  })
}

/** Email de validation d'une mémorisation */
export async function sendMemorizationApprovedEmail({
  to,
  fullName,
  surahName,
  surahNameAr,
  score,
  stars,
  locale = "fr",
}: {
  to: string
  fullName: string
  surahName: string
  surahNameAr: string
  score: number
  stars: number
  locale?: "fr" | "ar"
}) {
  const isAr = locale === "ar"
  const starsHtml = "⭐".repeat(stars)

  const content = isAr ? `
    <p style="font-size:18px;color:#1D9E75;font-weight:700;margin-bottom:4px;">ما شاء الله ${fullName}! 🎉</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">مبروك! لقد حفظتَ سورة <strong style="color:#1D9E75;">${surahNameAr}</strong> بنجاح.</p>
    <div style="background:linear-gradient(135deg,#E1F5EE,#F0FDF9);border:1px solid #A7F3D0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <p style="font-size:32px;margin:0;">${starsHtml}</p>
      <p style="font-size:36px;font-weight:800;color:#1D9E75;margin:8px 0;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
      <p style="color:#6B7280;font-size:14px;margin:0;">الدرجة النهائية</p>
    </div>
    <p style="text-align:center;color:#6B7280;font-size:13px;">تذكر: "خيركم من تعلّم القرآن وعلّمه" 📖</p>
  ` : `
    <p style="font-size:18px;color:#1D9E75;font-weight:700;margin-bottom:4px;">Masha'Allah ${fullName} ! 🎉</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">Félicitations ! Vous avez mémorisé <strong style="color:#1D9E75;">${surahName} — ${surahNameAr}</strong>.</p>
    <div style="background:linear-gradient(135deg,#E1F5EE,#F0FDF9);border:1px solid #A7F3D0;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
      <p style="font-size:32px;margin:0;">${starsHtml}</p>
      <p style="font-size:36px;font-weight:800;color:#1D9E75;margin:8px 0;">${score}<span style="font-size:20px;color:#6B7280;">/100</span></p>
      <p style="color:#6B7280;font-size:14px;margin:0;">Score final</p>
    </div>
    <p style="text-align:center;color:#6B7280;font-size:13px;">« Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne » 📖</p>
  `

  return sendMail({
    to,
    subject: isAr ? `مبروك! سورة ${surahNameAr} محفوظة ✓` : `Félicitations ! ${surahName} mémorisée ✓`,
    html: baseTemplate(content, locale),
  })
}

/** Email de résultat d'évaluation */
export async function sendEvaluationResultEmail({
  to,
  fullName,
  surahName,
  surahNameAr,
  score,
  decision,
  teacherNotes,
  locale = "fr",
}: {
  to: string
  fullName: string
  surahName: string
  surahNameAr: string
  score: number
  decision: string
  teacherNotes?: string
  locale?: "fr" | "ar"
}) {
  const isAr = locale === "ar"

  const decisionConfig = {
    fr: {
      APPROVED: { label: "✅ Approuvé", color: "#1D9E75", bg: "#E1F5EE" },
      NEEDS_REVISION: { label: "↺ Révision requise", color: "#D97706", bg: "#FEFCE8" },
      REJECTED: { label: "✗ Rejeté", color: "#DC2626", bg: "#FEF2F2" },
    },
    ar: {
      APPROVED: { label: "✅ مقبول", color: "#1D9E75", bg: "#E1F5EE" },
      NEEDS_REVISION: { label: "↺ يحتاج مراجعة", color: "#D97706", bg: "#FEFCE8" },
      REJECTED: { label: "✗ مرفوض", color: "#DC2626", bg: "#FEF2F2" },
    },
  }

  const dc = decisionConfig[locale][decision as keyof typeof decisionConfig.fr] ?? decisionConfig[locale].APPROVED

  const content = isAr ? `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">السلام عليكم ${fullName}</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">تم تقييم تلاوتك لسورة <strong>${surahNameAr}</strong>.</p>
    <div style="background:${dc.bg};border:1px solid ${dc.color}40;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <p style="font-size:36px;font-weight:800;color:${dc.color};margin:0 0 8px;">${score}<span style="font-size:18px;color:#6B7280;">/100</span></p>
      <span style="display:inline-block;padding:6px 16px;background:${dc.color};color:#fff;border-radius:20px;font-size:14px;font-weight:600;">${dc.label}</span>
    </div>
    ${teacherNotes ? `<div style="background:#F9FAFB;border-right:4px solid #1D9E75;padding:16px;border-radius:8px;margin:16px 0;direction:rtl;"><p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6B7280;">ملاحظات المعلم</p><p style="margin:0;font-size:14px;color:#374151;">${teacherNotes}</p></div>` : ""}
  ` : `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">Salam Alaykoum ${fullName}</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">Votre récitation de <strong>${surahName} (${surahNameAr})</strong> a été évaluée.</p>
    <div style="background:${dc.bg};border:1px solid ${dc.color}40;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <p style="font-size:36px;font-weight:800;color:${dc.color};margin:0 0 8px;">${score}<span style="font-size:18px;color:#6B7280;">/100</span></p>
      <span style="display:inline-block;padding:6px 16px;background:${dc.color};color:#fff;border-radius:20px;font-size:14px;font-weight:600;">${dc.label}</span>
    </div>
    ${teacherNotes ? `<div style="background:#F9FAFB;border-left:4px solid #1D9E75;padding:16px;border-radius:8px;margin:16px 0;"><p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#6B7280;">Notes de l'enseignant</p><p style="margin:0;font-size:14px;color:#374151;">${teacherNotes}</p></div>` : ""}
  `

  return sendMail({
    to,
    subject: isAr ? `نتيجة تقييم سورة ${surahNameAr}` : `Résultat de l'évaluation — ${surahName}`,
    html: baseTemplate(content, locale),
  })
}

/** Email de réinitialisation du mot de passe */
export async function sendPasswordResetEmail({
  to,
  fullName,
  resetToken,
  locale = "fr",
}: {
  to: string
  fullName: string
  resetToken: string
  locale?: "fr" | "ar"
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  try {
    const { subject, html, text } = await renderTemplatedEmail(
      "reset-password",
      {
        fullName,
        resetUrl,
        link: resetUrl, // alias pour compatibilité avec l'ancien template
      },
      locale
    )

    return sendMail({ to, subject, html, text })
  } catch (error) {
    console.error("[sendPasswordResetEmail] Échec rendu template:", error)
  }

  // Fallback : template codé en dur
  const isAr = locale === "ar"
  const content = isAr ? `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">السلام عليكم ${fullName}</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">طلبتَ إعادة تعيين كلمة المرور. انقر على الزر أدناه لإتمام العملية.</p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#DC2626;font-size:13px;">⚠️ هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:12px;">إذا لم تطلب ذلك، تجاهل هذا البريد الإلكتروني.</p>
  ` : `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">Salam Alaykoum ${fullName}</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">Vous avez demandé une réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour continuer.</p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#DC2626;font-size:13px;">⚠️ Ce lien est valable pendant 1 heure seulement.</p>
    </div>
    <p style="text-align:center;color:#9CA3AF;font-size:12px;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
  `

  return sendMail({
    to,
    subject: isAr ? "إعادة تعيين كلمة المرور" : "Réinitialisation de votre mot de passe",
    html: baseTemplate(content, locale),
  })
}

/** Email d'invitation parent */
export async function sendParentInviteEmail({
  to,
  fullName,
  studentName,
  inviteUrl,
  locale = "fr",
}: {
  to: string
  fullName?: string | null
  studentName: string
  inviteUrl: string
  locale?: "fr" | "ar"
}) {
  try {
    const { subject, html, text } = await renderTemplatedEmail(
      "invite-parent",
      {
        fullName: fullName ?? "",
        studentName,
        inviteUrl,
        link: inviteUrl, // alias pour compatibilité avec l'ancien template
      },
      locale
    )

    return sendMail({ to, subject, html, text })
  } catch (error) {
    console.error("[sendParentInviteEmail] Échec rendu template:", error)
    return { success: false, error: String(error) }
  }
}

/** Email de badge obtenu */
export async function sendBadgeEarnedEmail({
  to,
  fullName,
  badgeName,
  badgeNameAr,
  badgeIcon,
  badgeRarity,
  locale = "fr",
}: {
  to: string
  fullName: string
  badgeName: string
  badgeNameAr: string
  badgeIcon: string
  badgeRarity: string
  locale?: "fr" | "ar"
}) {
  const isAr = locale === "ar"
  const rarityColors: Record<string, string> = {
    COMMON: "#6B7280",
    RARE: "#3B82F6",
    EPIC: "#8B5CF6",
    LEGENDARY: "#F59E0B",
  }
  const rarityLabels = {
    fr: { COMMON: "Commun", RARE: "Rare", EPIC: "Épique", LEGENDARY: "Légendaire" },
    ar: { COMMON: "عادي", RARE: "نادر", EPIC: "ملحمي", LEGENDARY: "أسطوري" },
  }
  const color = rarityColors[badgeRarity] ?? "#6B7280"
  const rarityLabel = rarityLabels[locale][badgeRarity as keyof typeof rarityLabels.fr] ?? badgeRarity

  const content = isAr ? `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">مبروك ${fullName}! 🏅</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">لقد حصلت على وسام جديد!</p>
    <div style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid ${color}60;border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
      <p style="font-size:56px;margin:0 0 12px;">${badgeIcon}</p>
      <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px;">${badgeNameAr}</p>
      <span style="display:inline-block;padding:4px 14px;background:${color};color:#fff;border-radius:20px;font-size:12px;font-weight:600;">${rarityLabel}</span>
    </div>
  ` : `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">Félicitations ${fullName} ! 🏅</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">Vous venez de débloquer un nouveau badge !</p>
    <div style="background:linear-gradient(135deg,#FFFBEB,#FEF3C7);border:2px solid ${color}60;border-radius:16px;padding:32px;text-align:center;margin:24px 0;">
      <p style="font-size:56px;margin:0 0 12px;">${badgeIcon}</p>
      <p style="font-size:20px;font-weight:700;color:#111827;margin:0 0 4px;">${badgeName}</p>
      <p style="font-size:14px;color:#6B7280;margin:0 0 12px;">${badgeNameAr}</p>
      <span style="display:inline-block;padding:4px 14px;background:${color};color:#fff;border-radius:20px;font-size:12px;font-weight:600;">${rarityLabel}</span>
    </div>
  `

  return sendMail({
    to,
    subject: isAr ? `وسام جديد: ${badgeNameAr} ${badgeIcon}` : `Nouveau badge : ${badgeName} ${badgeIcon}`,
    html: baseTemplate(content, locale),
  })
}
