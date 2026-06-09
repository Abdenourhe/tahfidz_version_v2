import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

const LEVELS = ["beginner", "intermediate", "advanced", "expert", "attendance", "participation"]

const REQUIRED_FIELDS = [
  "id", "title", "titleAr", "subtitle", "bodyText", "arabicVerse",
  "primaryColor", "accentColor", "lightColor", "textColor", "badgeEmoji",
  "borderStyle", "fontFamily", "fontFamilyAr", "decorativePattern",
  "signatureStyle", "paperTexture", "orientation",
  "directorName", "directorNameAr", "showTeacher", "teacherName", "teacherNameAr",
]

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const rows = await prisma.certificateTemplate.findMany()
    const result: Record<string, any> = {}
    for (const row of rows) {
      result[row.level] = row.config as any
    }
    return NextResponse.json(result)
  } catch (err) {
    console.error("[TEMPLATES GET ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la lecture" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const body = await req.json()

    for (const lvl of LEVELS) {
      if (!body[lvl]) {
        return NextResponse.json({ error: `Niveau "${lvl}" manquant` }, { status: 400 })
      }
      for (const key of REQUIRED_FIELDS) {
        if (body[lvl][key] === undefined) {
          return NextResponse.json({ error: `Champ "${key}" manquant dans "${lvl}"` }, { status: 400 })
        }
      }
    }

    // Upsert tous les templates en transaction
    await prisma.$transaction(
      LEVELS.map((lvl) =>
        prisma.certificateTemplate.upsert({
          where: { level: lvl },
          update: { config: body[lvl] },
          create: { level: lvl, config: body[lvl] },
        })
      )
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[TEMPLATES SAVE ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
  }
}
