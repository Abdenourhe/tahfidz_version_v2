// src/app/api/forgot-password/route.ts — Demande de reinitialisation mot de passe
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

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

    // Verifier que l'ecole existe
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true },
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

    // Logger la demande pour le Super Admin
    console.log("\n🔐 ═══════════════════════════════════════════")
    console.log("   DEMANDE DE REINITIALISATION MOT DE PASSE")
    console.log("   Ecole    :", school.name, `(${schoolSlug})`)
    console.log("   Utilisateur:", user.fullName, `(${email})`)
    console.log("   Role     :", user.role)
    console.log("   → Traiter sur /admin/super")
    console.log("═══════════════════════════════════════════\n")

    // Optionnel: creer un audit log
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
      // ignore audit log errors
    }

    return NextResponse.json({ success: true, message: "Demande envoyee au Super Admin." })
  } catch (e) {
    console.error("[forgot-password]", e)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
