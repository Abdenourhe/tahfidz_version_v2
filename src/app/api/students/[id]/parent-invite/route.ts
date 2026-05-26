// src/app/api/students/[id]/parent-invite/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const schoolId = session.user.schoolId
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Vérifier que l'élève appartient à l'école
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, fullNameAr: true } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const userCheck = await prisma.user.findUnique({
      where: { id: student.userId },
      select: { schoolId: true },
    })

    if (!userCheck || userCheck.schoolId !== schoolId) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    // Chercher une invitation existante
    let invite = await prisma.parentInvite.findUnique({
      where: { studentId: id },
    })

    // Si expirée et non utilisée → la supprimer et en recréer une
    if (invite && !invite.used && new Date() > invite.expiresAt) {
      await prisma.parentInvite.delete({ where: { id: invite.id } })
      invite = null
    }

    // Si utilisée → retourner telle quelle
    if (invite?.used) {
      const inviteUrl = `${APP_URL}/parent/register?invite=${invite.code}&student=${student.studentCode}`
      return NextResponse.json({
        inviteUrl,
        qrValue: inviteUrl,
        studentName: student.user.fullName,
        studentNameAr: student.user.fullNameAr,
        expiresAt: invite.expiresAt,
        used: true,
        usedAt: invite.usedAt,
      })
    }

    // Si aucune invitation valide → en créer une nouvelle
    if (!invite) {
      const code = crypto.randomBytes(4).toString("hex").toUpperCase()
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      invite = await prisma.parentInvite.create({
        data: {
          code,
          studentId: id,
          schoolId,
          expiresAt,
        },
      })
    }

    const inviteUrl = `${APP_URL}/parent/register?invite=${invite.code}&student=${student.studentCode}`

    return NextResponse.json({
      inviteUrl,
      qrValue: inviteUrl,
      studentName: student.user.fullName,
      studentNameAr: student.user.fullNameAr,
      expiresAt: invite.expiresAt,
      used: false,
      usedAt: null,
    })
  } catch (error: any) {
    console.error("[PARENT_INVITE GET ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
