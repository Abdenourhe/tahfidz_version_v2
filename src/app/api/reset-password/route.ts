// src/app/api/reset-password/route.ts — Validation token + changement mot de passe
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { jwtVerify } from "jose"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json()

    if (!token || !password || password.length < 8) {
      return NextResponse.json({ error: "Donnees invalides" }, { status: 400 })
    }

    // Verifier le token JWT
    let payload: { email: string; schoolId: string; userId: string }
    try {
      const secretKey = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
      if (!secretKey || secretKey.length < 32) {
        return NextResponse.json({ error: "Configuration serveur incomplete" }, { status: 500 })
      }
      const secret = new TextEncoder().encode(secretKey)
      const verified = await jwtVerify(token, secret, { clockTolerance: 60 })
      payload = verified.payload as any
    } catch {
      return NextResponse.json({ error: "Lien invalide ou expire. Veuillez faire une nouvelle demande." }, { status: 400 })
    }

    // Verifier que l'utilisateur existe toujours
    const user = await prisma.user.findFirst({
      where: { id: payload.userId, email: payload.email, schoolId: payload.schoolId },
    })

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 })
    }

    // Hasher et mettre a jour le mot de passe
    const hashed = await bcrypt.hash(password, 12)
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Audit log
    try {
      await (prisma as any).auditLog.create({
        data: {
          schoolId: payload.schoolId,
          userId: user.id,
          action: "password_reset_complete",
          entityType: "user",
          entityId: user.id,
          details: JSON.stringify({ resetAt: new Date().toISOString() }),
        },
      })
    } catch {
      // ignore
    }

    return NextResponse.json({ success: true, message: "Mot de passe mis a jour avec succes." })
  } catch (e) {
    console.error("[reset-password]", e)
    return NextResponse.json({ error: "Erreur serveur interne" }, { status: 500 })
  }
}
