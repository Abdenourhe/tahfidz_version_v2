// src/app/api/admin/schools/logo/route.ts — Upload logo pour SUPERADMIN (n'importe quelle école)
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"]
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file     = formData.get("logo") as File | null
    const schoolId = formData.get("schoolId") as string | null

    if (!file)     return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 })
    if (!schoolId) return NextResponse.json({ error: "schoolId manquant" }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Format non accepté. PNG, JPG, WEBP ou SVG uniquement." }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Fichier trop grand (max 2 Mo)." }, { status: 400 })
    }

    const school = await prisma.school.findUnique({ where: { id: schoolId } })
    if (!school) return NextResponse.json({ error: "École introuvable" }, { status: 404 })

    // Dossier public/uploads/schools/{schoolId}/
    const uploadDir = join(process.cwd(), "public", "uploads", "schools", schoolId)
    await mkdir(uploadDir, { recursive: true })

    const ext = file.type === "image/svg+xml" ? "svg"
              : file.type === "image/webp"    ? "webp"
              : file.type === "image/png"     ? "png"
              : "jpg"
    const filename = `logo.${ext}`
    const filepath = join(uploadDir, filename)

    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const publicPath = `/uploads/schools/${schoolId}/${filename}`

    await prisma.school.update({ where: { id: schoolId }, data: { logo: publicPath } })

    return NextResponse.json({ logo: publicPath })
  } catch (err) {
    console.error("[SUPERADMIN LOGO UPLOAD ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de l'upload" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "SUPERADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const schoolId = searchParams.get("schoolId")
  if (!schoolId) return NextResponse.json({ error: "schoolId manquant" }, { status: 400 })

  await prisma.school.update({ where: { id: schoolId }, data: { logo: null } })
  return NextResponse.json({ ok: true })
}
