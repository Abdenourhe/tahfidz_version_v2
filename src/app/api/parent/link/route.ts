// src/app/api/parent/link/route.ts
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const linkSchema = z.object({
  studentCode: z.string().min(4, "Code invalide"),
  relation: z.enum(["father", "mother", "guardian"]),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = linkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { studentCode, relation } = parsed.data

  // Trouver l'élève par son code
  const student = await prisma.student.findFirst({
    where: { studentCode },
    include: { user: { select: { fullName: true, fullNameAr: true } } },
  })

  if (!student) {
    return NextResponse.json({ error: "Code élève introuvable. Vérifiez le code et réessayez." }, { status: 404 })
  }

  // Récupérer le profil parent
  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
  })

  if (!parent) {
    return NextResponse.json({ error: "Profil parent introuvable" }, { status: 404 })
  }

  // Vérifier si le lien existe déjà
  const existing = await prisma.parentStudentLink.findUnique({
    where: { parentId_studentId: { parentId: parent.id, studentId: student.id } },
  })

  if (existing) {
    return NextResponse.json({ error: "Ce lien existe déjà." }, { status: 409 })
  }

  // Créer le lien (nécessite validation admin)
  const link = await prisma.parentStudentLink.create({
    data: {
      parentId: parent.id,
      studentId: student.id,
      relation,
      accessCode: studentCode,
      isVerified: true, // Auto-vérifié par code (ou false si validation admin requise)
    },
  })

  // Notifier l'admin
  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true } })
  await Promise.all(
    admins.map(admin =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          schoolId: session.user.schoolId,
          type: "parent_link",
          title: "Nouveau lien parent-élève",
          message: `${(session.user as any).name} s'est lié à l'élève ${student.user.fullName}`,
          data: { linkId: link.id, studentId: student.id },
        },
      })
    )
  )

  return NextResponse.json({
    link,
    student: {
      fullName: student.user.fullName,
      fullNameAr: student.user.fullNameAr,
    },
  }, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const parent = await prisma.parent.findUnique({
    where: { userId: session.user.id },
    include: {
      childrenLinks: {
        include: {
          student: {
            include: {
              user: { select: { fullName: true, fullNameAr: true, avatar: true } },
            },
          },
        },
      },
    },
  })

  return NextResponse.json({ links: parent?.childrenLinks ?? [] })
}
