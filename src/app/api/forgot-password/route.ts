// src/app/api/forgot-password/route.ts — Demande de reinitialisation mot de passe
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendPasswordResetEmail } from "@/lib/email"
import { isMailConfigured } from "@/lib/mail"
import { z } from "zod"
import { SignJWT } from "jose"

const schema = z.object({
  email: z.string().email("Email invalide"),
  schoolSlug: z.string().min(2, "Identifiant ecole requis"),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message ?? "Donnees invalides" }, { status: 400 })
    }

    const { email, schoolSlug } = parsed.data

    // Verifier que l'ecole existe (insensible a la casse)
    const school = await prisma.school.findFirst({
      where: { slug: { equals: schoolSlug, mode: 'insensitive' } },
      select: { id: true, name: true, slug: true },
    })

    if (!school) {
      return NextResponse.json({ error: "Aucune ecole trouvee avec cet identifiant." }, { status: 404 })
    }

    // Verifier que l'utilisateur existe dans cette ecole
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), schoolId: school.id },
      select: { id: true, fullName: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Aucun compte trouve avec cet email pour cette ecole." }, { status: 404 })
    }

    // Generer un token JWT signe (valide 1h)
    const secretKey = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
    if (!secretKey || secretKey.length < 32) {
      return NextResponse.json({ error: "Configuration serveur incomplete (AUTH_SECRET manquant)" }, { status: 500 })
    }
    const secret = new TextEncoder().encode(secretKey)
    const token = await new SignJWT({ email: email.toLowerCase(), schoolId: school.id, userId: user.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("20m")
      .setIssuedAt()
      .sign(secret)

    // Construire le lien de reinitialisation (fallback si email non configure)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`

    let mailResult: { success: boolean; error?: string } | undefined

    // Envoyer l'email si configure (utilise le template editable depuis SiteConfig)
    if (isMailConfigured()) {
      mailResult = await sendPasswordResetEmail({
        to: email,
        fullName: user.fullName || "",
        resetToken: token,
      })

      if (!mailResult?.success) {
        console.error("[forgot-password] Echec envoi email:", mailResult?.error)
        return NextResponse.json({
          success: false,
          error: `Echec de l'envoi de l'email: ${mailResult?.error}`,
          resetUrl,
        }, { status: 502 })
      }
    }

    // Audit log
    try {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: school.id,
          userId: user.id,
          action: "password_reset_request",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({ email, schoolSlug, requestedAt: new Date().toISOString() }),
        },
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      resetUrl: isMailConfigured() ? undefined : resetUrl,
      message: isMailConfigured()
        ? "Un email de reinitialisation a ete envoye. Verifiez votre boite de reception."
        : "Demande enregistree. (Email non configure — utilisez le lien ci-dessous)",
    })
  } catch (e) {
    console.error("[forgot-password]", e)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
