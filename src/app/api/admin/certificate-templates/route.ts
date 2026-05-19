// src/app/api/admin/certificate-templates/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { readFile, writeFile } from "fs/promises"
import { join } from "path"

const TEMPLATES_PATH = join(process.cwd(), "src", "data", "certificateTemplates.json")

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const raw = await readFile(TEMPLATES_PATH, "utf-8")
    return NextResponse.json(JSON.parse(raw))
  } catch {
    return NextResponse.json({ error: "Templates introuvables" }, { status: 404 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const body = await req.json()
    const levels = ["beginner", "intermediate", "advanced"]
    const required = ["title", "titleAr", "subtitle", "bodyText", "arabicVerse",
                      "primaryColor", "accentColor", "lightColor", "textColor", "badgeEmoji"]
    for (const lvl of levels) {
      if (!body[lvl]) return NextResponse.json({ error: `Niveau "${lvl}" manquant` }, { status: 400 })
      for (const key of required) {
        if (body[lvl][key] === undefined) {
          return NextResponse.json({ error: `Champ "${key}" manquant dans "${lvl}"` }, { status: 400 })
        }
      }
    }
    await writeFile(TEMPLATES_PATH, JSON.stringify(body, null, 2), "utf-8")
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[TEMPLATES SAVE ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 })
  }
}
