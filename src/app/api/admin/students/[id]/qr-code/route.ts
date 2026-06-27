import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import {
  generateQrCodeSecret,
  generateQrCodeToken,
  generateStudentQrUrl,
} from "@/lib/qr-code"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = (await req.json().catch(() => ({}))) as { regenerateSecret?: boolean }

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: { select: { schoolId: true } } },
    })

    if (!student) {
      return NextResponse.json({ error: "Élève introuvable" }, { status: 404 })
    }

    // L'admin doit appartenir à la même école que l'élève
    if (session.user.role === "ADMIN" && student.user.schoolId !== session.user.schoolId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    const school = await prisma.school.findUnique({
      where: { id: student.user.schoolId },
      select: { slug: true, name: true },
    })

    if (!school) {
      return NextResponse.json({ error: "École introuvable" }, { status: 404 })
    }

    const qrCodeToken = student.qrCodeToken ?? generateQrCodeToken()
    const qrCodeSecret = body.regenerateSecret
      ? generateQrCodeSecret()
      : student.qrCodeSecret ?? generateQrCodeSecret()

    await prisma.student.update({
      where: { id },
      data: {
        qrCodeToken,
        qrCodeSecret,
        qrCodeUpdatedAt: new Date(),
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""
    const qrCodeUrl = generateStudentQrUrl(appUrl, school.slug, qrCodeToken, qrCodeSecret)

    return NextResponse.json({
      success: true,
      qrCodeToken,
      qrCodeUrl,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[POST /api/admin/students/[id]/qr-code]", error)
    return NextResponse.json(
      { error: "Erreur lors de la génération du QR code" },
      { status: 500 }
    )
  }
}
