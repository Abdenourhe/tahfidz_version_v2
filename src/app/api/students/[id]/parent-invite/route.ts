// src/app/api/students/[id]/parent-invite/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { sendParentInviteEmail } from "@/lib/email"
import { isMailConfigured } from "@/lib/mail"
import { NextResponse } from "next/server"
import crypto from "crypto"

async function getInviteForStudent(
  studentId: string,
  schoolId: string,
  createIfNeeded: boolean
) {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      user: { select: { fullName: true, fullNameAr: true, schoolId: true } },
    },
  })

  if (!student || student.user.schoolId !== schoolId) {
    return { error: "Élève introuvable", status: 404 }
  }

  // Chercher une invitation existante
  let invite = await prisma.parentInvite.findUnique({
    where: { studentId },
  })

  // Si expirée et non utilisée → la supprimer et en recréer une
  if (invite && !invite.used && new Date() > invite.expiresAt) {
    await prisma.parentInvite.delete({ where: { id: invite.id } })
    invite = null
  }

  // Si aucune invitation valide → en créer une nouvelle
  if (!invite && createIfNeeded) {
    const code = crypto.randomBytes(4).toString("hex").toUpperCase()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    invite = await prisma.parentInvite.create({
      data: {
        code,
        studentId,
        schoolId,
        expiresAt,
      },
    })
  }

  const inviteUrl = invite
    ? `${APP_URL}/parent/register?invite=${invite.code}&student=${student.studentCode}`
    : undefined

  return {
    student,
    invite,
    inviteUrl,
    qrValue: inviteUrl,
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const schoolId = session.user.schoolId

    const result = await getInviteForStudent(id, schoolId, true)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { student, invite, inviteUrl, qrValue } = result

    return NextResponse.json({
      inviteUrl,
      qrValue,
      studentName: student.user.fullName,
      studentNameAr: student.user.fullNameAr,
      expiresAt: invite!.expiresAt,
      used: invite!.used,
      usedAt: invite!.usedAt,
    })
  } catch (error: any) {
    console.error("[PARENT_INVITE GET ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const schoolId = session.user.schoolId

    let body: { parentEmail?: string; parentName?: string }
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
    }

    const parentEmail = body.parentEmail?.trim().toLowerCase()
    if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      return NextResponse.json({ error: "Email parent invalide" }, { status: 400 })
    }

    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "L'envoi d'emails n'est pas configuré sur cette instance." },
        { status: 503 }
      )
    }

    const result = await getInviteForStudent(id, schoolId, true)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { student, inviteUrl } = result

    const mailResult = await sendParentInviteEmail({
      to: parentEmail,
      fullName: body.parentName?.trim() || undefined,
      studentName: student.user.fullName,
      inviteUrl: inviteUrl!,
    })

    if (!mailResult.success) {
      console.error("[PARENT_INVITE POST] Échec envoi email:", mailResult.error)
      return NextResponse.json(
        { error: `Échec de l'envoi de l'email : ${mailResult.error}` },
        { status: 502 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Invitation envoyée par email avec succès.",
      inviteUrl,
    })
  } catch (error: any) {
    console.error("[PARENT_INVITE POST ERROR]", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
