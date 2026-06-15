// src/app/api/students/[id]/daily-log/comments/attachment/route.ts
// GET: Redirige vers une URL GET signée R2 pour lire une pièce jointe

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getDownloadUrl } from "@/lib/r2"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params
    const { searchParams } = new URL(req.url)
    const key = searchParams.get("key")

    if (!key) {
      return NextResponse.json({ error: "Clé requise" }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        teacher: { select: { userId: true } },
        parentLinks: { where: { isVerified: true }, include: { parent: { select: { userId: true } } } },
        user: { select: { schoolId: true } },
      },
    })
    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    const isAuthorized =
      session.user.role === "ADMIN" ||
      session.user.role === "SUPERADMIN" ||
      student.teacher?.userId === session.user.id ||
      student.parentLinks.some((l) => l.parent.userId === session.user.id) ||
      student.user.schoolId === session.user.schoolId

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const url = await getDownloadUrl(key, 600)
    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENT ATTACHMENT]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
