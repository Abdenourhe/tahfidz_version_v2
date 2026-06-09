import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const templateConfigSchema = z.object({
  title: z.string().min(1),
  titleAr: z.string().optional(),
  subtitle: z.string().optional(),
  bodyText: z.string().optional(),
  arabicVerse: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  lightColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  fontFamily: z.string().optional(),
  fontFamilyAr: z.string().optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  directorName: z.string().optional(),
  directorNameAr: z.string().optional(),
  showTeacher: z.boolean().optional(),
  teacherName: z.string().optional(),
  teacherNameAr: z.string().optional(),
  showStats: z.boolean().optional(),
  showQr: z.boolean().optional(),
})

function getSchoolId(session: any) {
  if (session.user.role === "SUPERADMIN") return undefined
  return session.user.schoolId as string
}

const DEFAULT_TEMPLATES: Array<{ name: string; nameAr: string; config: any }> = [
  {
    name: "Mémorisation",
    nameAr: "الحفظ",
    config: {
      title: "Certificat de Mémorisation",
      titleAr: "شَهَادَةُ الْحِفْظ",
      subtitle: "Niveau Débutant",
      bodyText: "Pour avoir accompli avec sérieux et persévérance son programme de mémorisation du Saint Coran.",
      arabicVerse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      primaryColor: "#1a5f4a",
      accentColor: "#c9a227",
      lightColor: "#f0f7f4",
      textColor: "#0d3326",
      fontFamily: "Georgia",
      fontFamilyAr: "Amiri",
      orientation: "portrait",
      directorName: "Directeur",
      directorNameAr: "المدير",
      showTeacher: true,
      showStats: true,
      showQr: true,
    },
  },
  {
    name: "Assiduité",
    nameAr: "الحضور",
    config: {
      title: "Certificat d'Assiduité",
      titleAr: "شَهَادَةُ الْحُضُور",
      subtitle: "Reconnaissance de présence",
      bodyText: "Pour avoir fait preuve d'une assiduité exemplaire et d'un engagement constant dans son parcours d'apprentissage du Saint Coran.",
      arabicVerse: "إِنَّمَا يَخْشَى اللَّهَ مِنْ عِبَادِهِ الْعُلَمَاءُ",
      primaryColor: "#065f46",
      accentColor: "#10b981",
      lightColor: "#ecfdf5",
      textColor: "#064e3b",
      fontFamily: "Georgia",
      fontFamilyAr: "Amiri",
      orientation: "portrait",
      directorName: "Directeur",
      directorNameAr: "المدير",
      showTeacher: false,
      showStats: true,
      showQr: true,
    },
  },
  {
    name: "Participation",
    nameAr: "المشاركة",
    config: {
      title: "Certificat de Participation",
      titleAr: "شَهَادَةُ الْمُشَارَكَة",
      subtitle: "Engagement et contribution",
      bodyText: "Pour avoir démontré un esprit de participation active, de collaboration fraternelle et d'implication remarquable dans la vie de l'école.",
      arabicVerse: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا وَلَا تَفَرَّقُوا",
      primaryColor: "#1e40af",
      accentColor: "#3b82f6",
      lightColor: "#eff6ff",
      textColor: "#1e3a8a",
      fontFamily: "Georgia",
      fontFamilyAr: "Amiri",
      orientation: "portrait",
      directorName: "Directeur",
      directorNameAr: "المدير",
      showTeacher: false,
      showStats: true,
      showQr: true,
    },
  },
]

export async function GET() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const schoolId = getSchoolId(session)
    let rows = await prisma.certificateTemplate.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
    })

    // Seed defaults if school has no templates
    if (schoolId && rows.length === 0) {
      await prisma.$transaction(
        DEFAULT_TEMPLATES.map((t, i) =>
          prisma.certificateTemplate.create({
            data: {
              schoolId,
              name: t.name,
              nameAr: t.nameAr,
              config: t.config,
              isDefault: i === 0,
              sortOrder: i,
            },
          })
        )
      )
      rows = await prisma.certificateTemplate.findMany({
        where: { schoolId },
        orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }],
      })
    }

    return NextResponse.json(rows)
  } catch (err) {
    console.error("[TEMPLATES GET ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la lecture" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const schoolId = getSchoolId(session)
    if (!schoolId) {
      return NextResponse.json({ error: "schoolId requis" }, { status: 400 })
    }
    const body = await req.json()
    const config = templateConfigSchema.parse(body.config)

    const existing = await prisma.certificateTemplate.findFirst({
      where: { schoolId, name: body.name },
    })
    if (existing) {
      return NextResponse.json({ error: "Un template avec ce nom existe déjà" }, { status: 409 })
    }

    const row = await prisma.certificateTemplate.create({
      data: {
        schoolId,
        name: body.name,
        nameAr: body.nameAr ?? null,
        config: config as any,
        isDefault: body.isDefault ?? false,
        sortOrder: body.sortOrder ?? 0,
      },
    })
    return NextResponse.json(row, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Configuration invalide", details: err.flatten() }, { status: 400 })
    }
    console.error("[TEMPLATES POST ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const schoolId = getSchoolId(session)
    const body = await req.json()
    const { id, name, nameAr, config, isDefault, sortOrder } = body

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const where: any = { id }
    if (schoolId) where.schoolId = schoolId

    const existing = await prisma.certificateTemplate.findUnique({ where })
    if (!existing) {
      return NextResponse.json({ error: "Template introuvable" }, { status: 404 })
    }

    const validatedConfig = config ? templateConfigSchema.parse(config) : undefined

    const row = await prisma.certificateTemplate.update({
      where,
      data: {
        ...(name !== undefined && { name }),
        ...(nameAr !== undefined && { nameAr }),
        ...(validatedConfig !== undefined && { config: validatedConfig as any }),
        ...(isDefault !== undefined && { isDefault }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })
    return NextResponse.json(row)
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Configuration invalide", details: err.flatten() }, { status: 400 })
    }
    console.error("[TEMPLATES PUT ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 })
  }
  try {
    const schoolId = getSchoolId(session)
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const where: any = { id }
    if (schoolId) where.schoolId = schoolId

    await prisma.certificateTemplate.delete({ where })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[TEMPLATES DELETE ERROR]", err)
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}
