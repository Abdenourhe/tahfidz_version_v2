// src/app/api/admin/school/signatures/route.ts
// Stockage des signatures en base64 dans la DB (compatible Vercel)

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const formData = await req.formData()
  const schoolId = session.user.schoolId
  if (!schoolId) {
    return NextResponse.json({ error: "École introuvable" }, { status: 400 })
  }

  try {
    const directorFile = formData.get("director") as File | null
    const teacherFile = formData.get("teacher") as File | null

    const updateData: Record<string, string | null> = {}

    if (directorFile) {
      if (!ALLOWED_TYPES.includes(directorFile.type)) {
        return NextResponse.json({ error: "Format signature directeur non accepté. Utilisez PNG, JPG ou WEBP." }, { status: 400 })
      }
      if (directorFile.size > MAX_SIZE) {
        return NextResponse.json({ error: "Signature directeur trop grande. Max 2 Mo." }, { status: 400 })
      }
      const bytes = await directorFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      updateData.directorSignature = `data:${directorFile.type};base64,${base64}`
    }

    if (teacherFile) {
      if (!ALLOWED_TYPES.includes(teacherFile.type)) {
        return NextResponse.json({ error: "Format signature enseignant non accepté. Utilisez PNG, JPG ou WEBP." }, { status: 400 })
      }
      if (teacherFile.size > MAX_SIZE) {
        return NextResponse.json({ error: "Signature enseignant trop grande. Max 2 Mo." }, { status: 400 })
      }
      const bytes = await teacherFile.arrayBuffer()
      const base64 = Buffer.from(bytes).toString("base64")
      updateData.teacherSignature = `data:${teacherFile.type};base64,${base64}`
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    }

    await prisma.school.update({
      where: { id: schoolId },
      data: updateData,
    })

    return NextResponse.json(updateData)
  } catch (err) {
    console.error("[SIGNATURES UPLOAD ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") // "director" | "teacher"
  const schoolId = session.user.schoolId

  if (!schoolId) {
    return NextResponse.json({ error: "École introuvable" }, { status: 400 })
  }

  const data: Record<string, null> = {}
  if (type === "director") data.directorSignature = null
  if (type === "teacher") data.teacherSignature = null

  await prisma.school.update({
    where: { id: schoolId },
    data,
  })

  return NextResponse.json({ ok: true })
}
