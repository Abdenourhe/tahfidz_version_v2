// src/app/api/admin/school/logo/route.ts
// Stockage du logo en base64 dans la DB (compatible Vercel — pas d'écriture filesystem)

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const formData = await req.formData()
  const bodySchoolId = formData.get("schoolId") as string | null
  const schoolId = session.user.role === "SUPERADMIN" && bodySchoolId
    ? bodySchoolId
    : session.user.schoolId

  if (!schoolId) {
    return NextResponse.json({ error: "École introuvable" }, { status: 400 })
  }

  try {
    const file = formData.get("logo") as File | null
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non accepté. Utilisez PNG, JPG, WEBP ou SVG." },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Fichier trop grand. Maximum 2 Mo." },
        { status: 400 }
      )
    }

    // Lire le fichier et convertir en base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const dataUri = `data:${file.type};base64,${base64}`

    // Stocker dans la DB
    await prisma.school.update({
      where: { id: schoolId },
      data: { logo: dataUri },
    })

    return NextResponse.json({ logo: dataUri })
  } catch (err) {
    console.error("[LOGO UPLOAD ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const bodySchoolId = searchParams.get("schoolId")
  const schoolId = session.user.role === "SUPERADMIN" && bodySchoolId
    ? bodySchoolId
    : session.user.schoolId

  if (!schoolId) {
    return NextResponse.json({ error: "École introuvable" }, { status: 400 })
  }

  await prisma.school.update({
    where: { id: schoolId },
    data: { logo: null },
  })

  return NextResponse.json({ ok: true })
}
