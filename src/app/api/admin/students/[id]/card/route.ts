import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { generateStudentQrUrl } from "@/lib/qr-code"
import { NextResponse } from "next/server"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            fullName: true,
            fullNameAr: true,
            avatar: true,
            email: true,
            phone: true,
            schoolId: true,
            isActive: true,
          },
        },
        group: { select: { name: true, nameAr: true, level: true, schedule: true } },
        teacher: { include: { user: { select: { fullName: true } } } },
      },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    if (session.user.role === "ADMIN" && student.user.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const school = await prisma.school.findUnique({
      where: { id: student.user.schoolId },
      select: { slug: true, name: true, logo: true, city: true, address: true, phone: true },
    })

    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    }

    // Génère automatiquement les tokens s'ils n'existent pas encore
    let { qrCodeToken, qrCodeSecret } = student
    if (!qrCodeToken || !qrCodeSecret) {
      const { generateQrCodeToken, generateQrCodeSecret } = await import("@/lib/qr-code")
      qrCodeToken = qrCodeToken ?? generateQrCodeToken()
      qrCodeSecret = qrCodeSecret ?? generateQrCodeSecret()
      await prisma.student.update({
        where: { id },
        data: { qrCodeToken, qrCodeSecret, qrCodeUpdatedAt: new Date() },
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
    const qrCodeUrl = generateStudentQrUrl(appUrl, school.slug, qrCodeToken, qrCodeSecret)

    return NextResponse.json({
      student: {
        id: student.id,
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        fullNameAr: student.user.fullNameAr,
        avatar: student.user.avatar,
        email: student.user.email,
        phone: student.user.phone,
        isActive: student.user.isActive,
        group: student.group,
        teacher: student.teacher,
      },
      school,
      qrCodeUrl,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[GET /api/admin/students/[id]/card]", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération de la carte" },
      { status: 500 }
    )
  }
}
