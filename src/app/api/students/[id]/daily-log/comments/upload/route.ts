// src/app/api/students/[id]/daily-log/comments/upload/route.ts
// POST: Génère une URL PUT signée pour uploader une pièce jointe sur R2

import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getUploadUrl, buildR2Key } from "@/lib/r2"

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id: studentId } = await params
    const body = await req.json()
    const { fileName, contentType, size } = body

    if (!fileName || !contentType) {
      return NextResponse.json({ error: "fileName et contentType requis" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(contentType)) {
      return NextResponse.json({ error: "Type de fichier non autorisé" }, { status: 400 })
    }

    if (size && size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 })
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

    const key = buildR2Key(student.user.schoolId, fileName, "daily-log-comments")
    const uploadUrl = await getUploadUrl(key, contentType, 300)

    return NextResponse.json({ key, uploadUrl })
  } catch (error: any) {
    console.error("[DAILY_LOG_COMMENT UPLOAD]", error)
    return NextResponse.json({ error: error.message || "Erreur serveur" }, { status: 500 })
  }
}
