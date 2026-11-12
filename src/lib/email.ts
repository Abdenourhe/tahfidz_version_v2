// src/lib/email.ts
// Templates email — envoi délégué à src/lib/mail.ts (Brevo)

import { sendMail } from "@/lib/mail"
import {
  getEmailTemplate,
  renderTemplate,
  bodyToHtml,
  commonVariables,
  baseTemplate,
  type EmailTemplateKey,
  type EmailLocale,
} from "@/lib/email-templates"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "TAHFIDZ"

export { baseTemplate }

// ─── Helpers de rendu des templates éditables ─────────────────────────────────

async function renderTemplatedEmail(
  key: EmailTemplateKey,
  variables: Record<string, string | number | undefined | null>,
  locale: EmailLocale = "fr"
) {
  const tpl = await getEmailTemplate(key, locale)
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
  locale?: EmailLocale
}) {
  const roleLabels: Record<string, Record<string, string>> = {
    fr: { ADMIN: "Administrateur", TEACHER: "Enseignant", PARENT: "Parent", STUDENT: "Élève" },
    en: { ADMIN: "Administrator", TEACHER: "Teacher", PARENT: "Parent", STUDENT: "Student" },
    ar: { ADMIN: "مدير", TEACHER: "معلم", PARENT: "ولي أمر", STUDENT: "طالب" },
  }

  const loginUrl = schoolSlug?.trim()
    ? `${APP_URL}/login?schoolSlug=${encodeURIComponent(schoolSlug.trim())}`
    : `${APP_URL}/login`

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
        loginUrl,
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

  // Fallback minimal en cas d'erreur de rendu
  const isAr = locale === "ar"
  const content = isAr
    ? `<p>السلام عليكم ${fullName}،</p><p>تم إنشاء حسابك. <a href="${loginUrl}">الدخول</a></p>`
    : locale === "en"
      ? `<p>Dear ${fullName},</p><p>Your account has been created. <a href="${loginUrl}">Log in</a></p>`
      : `<p>Salam Alaykoum ${fullName},</p><p>Votre compte a été créé. <a href="${loginUrl}">Se connecter</a></p>`

  return sendMail({
    to,
    subject: isAr ? `مرحباً بك في ${APP_NAME}` : locale === "en" ? `Welcome to ${APP_NAME}` : `Bienvenue sur ${APP_NAME}`,
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
  locale?: EmailLocale
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
  locale?: EmailLocale
}) {
  const isAr = locale === "ar"

  const decisionConfig = {
    fr: {
      APPROVED: { label: "✅ Approuvé", color: "#1D9E75", bg: "#E1F5EE" },
      NEEDS_REVISION: { label: "↺ Révision requise", color: "#D97706", bg: "#FEFCE8" },
      REJECTED: { label: "✗ Rejeté", color: "#DC2626", bg: "#FEF2F2" },
    },
    en: {
      APPROVED: { label: "✅ Approved", color: "#1D9E75", bg: "#E1F5EE" },
      NEEDS_REVISION: { label: "↺ Revision needed", color: "#D97706", bg: "#FEFCE8" },
      REJECTED: { label: "✗ Rejected", color: "#DC2626", bg: "#FEF2F2" },
    },
    ar: {
      APPROVED: { label: "✅ مقبول", color: "#1D9E75", bg: "#E1F5EE" },
      NEEDS_REVISION: { label: "↺ يحتاج مراجعة", color: "#D97706", bg: "#FEFCE8" },
      REJECTED: { label: "✗ مرفوض", color: "#DC2626", bg: "#FEF2F2" },
    },
  }

  const dc = decisionConfig[locale]?.[decision as keyof typeof decisionConfig.fr] ?? decisionConfig[locale].APPROVED

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
  locale?: EmailLocale
}) {
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`

  try {
    const { subject, html, text } = await renderTemplatedEmail(
      "reset-password",
      {
        fullName,
        resetUrl,
        link: resetUrl,
      },
      locale
    )

    return sendMail({ to, subject, html, text })
  } catch (error) {
    console.error("[sendPasswordResetEmail] Échec rendu template:", error)
  }

  // Fallback
  const isAr = locale === "ar"
  const content = isAr
    ? `<p>السلام عليكم ${fullName}،</p><p>اضغط على الرابط لإعادة تعيين كلمة المرور : <a href="${resetUrl}">${resetUrl}</a></p><p>الرابط صالح لمدة 20 دقيقة.</p>`
    : locale === "en"
      ? `<p>Dear ${fullName},</p><p>Click the link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p><p>Valid for 20 minutes.</p>`
      : `<p>Salam Alaykoum ${fullName},</p><p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetUrl}">${resetUrl}</a></p><p>Valable 20 minutes.</p>`

  return sendMail({
    to,
    subject: isAr ? "إعادة تعيين كلمة المرور" : locale === "en" ? "Reset your password" : "Réinitialisation de votre mot de passe",
    html: baseTemplate(content, locale),
  })
}

/** Email de confirmation de réception d'une demande d'inscription d'école (en attente de validation) */
export async function sendSchoolRequestPendingEmail({
  to,
  adminName,
  schoolName,
  plan,
  billingCycle,
  classCount,
  studentsPerClass,
  teachersCount,
  city,
  country,
  locale = "fr",
}: {
  to: string
  adminName: string
  schoolName: string
  plan: string
  billingCycle: string
  classCount: number
  studentsPerClass: number
  teachersCount: number
  city?: string | null
  country?: string | null
  locale?: EmailLocale
}) {
  const isAr = locale === "ar"

  const planLabels: Record<string, Record<string, string>> = {
    fr: { FREE: "Gratuit", STARTER: "Starter", ECONOMIQUE: "Économique", PRO: "Pro", ENTERPRISE: "Enterprise" },
    en: { FREE: "Free", STARTER: "Starter", ECONOMIQUE: "Economy", PRO: "Pro", ENTERPRISE: "Enterprise" },
    ar: { FREE: "مجاني", STARTER: "ستارتر", ECONOMIQUE: "اقتصادي", PRO: "برو", ENTERPRISE: "مؤسسات" },
  }
  const planLabel = planLabels[locale]?.[plan] ?? plan

  const billingLabels: Record<string, Record<string, string>> = {
    fr: { MONTHLY: "Mensuel", YEARLY: "Annuel" },
    en: { MONTHLY: "Monthly", YEARLY: "Yearly" },
    ar: { MONTHLY: "شهري", YEARLY: "سنوي" },
  }
  const billingLabel = billingLabels[locale]?.[billingCycle] ?? billingCycle

  const location = [city, country].filter(Boolean).join(", ")

  // Libellés du récapitulatif selon la langue
  const t = {
    fr: {
      greeting: `Salam Alaykoum ${adminName}`,
      intro: `Nous avons bien reçu votre demande d'inscription pour <strong>${schoolName}</strong>. Elle est actuellement <strong style="color:#D97706;">en attente de validation</strong> par notre équipe.`,
      recap: "Récapitulatif de votre demande",
      school: "École",
      email: "Email administrateur",
      plan: "Formule",
      billing: "Facturation",
      classes: "Groupes / classes",
      students: "Élèves par classe",
      teachers: "Enseignants",
      location: "Localisation",
      next: "Vous recevrez un email dès que votre école sera activée. Aucune action n'est requise de votre part.",
    },
    en: {
      greeting: `Dear ${adminName}`,
      intro: `We have received your registration request for <strong>${schoolName}</strong>. It is currently <strong style="color:#D97706;">pending approval</strong> by our team.`,
      recap: "Your request summary",
      school: "School",
      email: "Admin email",
      plan: "Plan",
      billing: "Billing",
      classes: "Groups / classes",
      students: "Students per class",
      teachers: "Teachers",
      location: "Location",
      next: "You will receive an email as soon as your school is activated. No action is required on your side.",
    },
    ar: {
      greeting: `السلام عليكم ${adminName}`,
      intro: `لقد استلمنا طلب تسجيل مدرستك <strong>${schoolName}</strong>. طلبك حالياً <strong style="color:#D97706;">قيد المراجعة</strong> من طرف فريقنا.`,
      recap: "ملخص طلبك",
      school: "المدرسة",
      email: "بريد المدير",
      plan: "الباقة",
      billing: "الفوترة",
      classes: "المجموعات / الأقسام",
      students: "الطلاب في القسم",
      teachers: "المعلمون",
      location: "الموقع",
      next: "ستصلك رسالة بريد إلكتروني فور تفعيل مدرستك. لا حاجة لأي إجراء من طرفك.",
    },
  }
  const l = t[locale] ?? t.fr

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:8px 12px;font-size:13px;color:#6B7280;border-bottom:1px solid #F3F4F6;">${label}</td>
      <td style="padding:8px 12px;font-size:13px;color:#111827;font-weight:600;text-align:${isAr ? "left" : "right"};border-bottom:1px solid #F3F4F6;">${value}</td>
    </tr>`

  const content = `
    <p style="font-size:18px;color:#111827;font-weight:700;margin-bottom:4px;">${l.greeting}</p>
    <p style="color:#6B7280;font-size:14px;margin-top:0;">${l.intro}</p>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:16px;margin:20px 0;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1D9E75;text-transform:uppercase;letter-spacing:0.5px;">${l.recap}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${row(l.school, schoolName)}
        ${row(l.email, to)}
        ${row(l.plan, planLabel)}
        ${row(l.billing, billingLabel)}
        ${row(l.classes, String(classCount))}
        ${row(l.students, String(studentsPerClass))}
        ${row(l.teachers, String(teachersCount))}
        ${location ? row(l.location, location) : ""}
      </table>
    </div>
    <p style="color:#6B7280;font-size:13px;">${l.next}</p>
  `

  const subject = isAr
    ? `تم استلام طلبك — ${schoolName} قيد المراجعة`
    : locale === "en"
      ? `Request received — ${schoolName} pending approval`
      : `Demande reçue — ${schoolName} en attente de validation`

  return sendMail({ to, subject, html: baseTemplate(content, locale) })
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
  locale?: EmailLocale
}) {
  try {
    const { subject, html, text } = await renderTemplatedEmail(
      "invite-parent",
      {
        fullName: fullName ?? "",
        studentName,
        inviteUrl,
        link: inviteUrl,
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
  locale?: EmailLocale
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
    en: { COMMON: "Common", RARE: "Rare", EPIC: "Epic", LEGENDARY: "Legendary" },
    ar: { COMMON: "عادي", RARE: "نادر", EPIC: "ملحمي", LEGENDARY: "أسطوري" },
  }
  const color = rarityColors[badgeRarity] ?? "#6B7280"
  const rarityLabel = rarityLabels[locale]?.[badgeRarity as keyof typeof rarityLabels.fr] ?? badgeRarity

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
