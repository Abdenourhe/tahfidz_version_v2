import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { verifyQrPayload } from "@/lib/qr-scan-verifier"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const encoded = searchParams.get("d")

    if (!encoded) {
      return NextResponse.json({ error: "QR code manquant" }, { status: 400 })
    }

    const result = await verifyQrPayload(encoded, session.user.id, session.user.role)

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined
    const userAgent = req.headers.get("user-agent") ?? undefined

    if (!result.ok) {
      // Journaliser l'échec si possible
      try {
        const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8"))
        const student = payload.t
          ? await prisma.student.findUnique({
              where: { qrCodeToken: payload.t },
              select: { id: true },
            })
          : null

        if (student) {
          await prisma.qrScanLog.create({
            data: {
              studentId: student.id,
              teacherId: session.user.role === "TEACHER" ? session.user.id : null,
              schoolId: session.user.schoolId ?? "unknown",
              tokenUsed: payload.t ?? "",
              hmacUsed: payload.h ?? "",
              ipAddress,
              userAgent,
              status: result.status as any,
              errorReason: result.reason,
            },
          })
        }
      } catch {
        // Ignorer les erreurs de journalisation
      }

      return NextResponse.json(
        { valid: false, error: result.reason, code: result.status },
        { status: 400 }
      )
    }

    const student = result.student

    // Journaliser la vérification réussie
    await prisma.qrScanLog.create({
      data: {
        studentId: student.id,
        teacherId: session.user.role === "TEACHER" ? session.user.id : null,
        schoolId: session.user.schoolId ?? student.user.schoolId,
        tokenUsed: student.qrCodeToken ?? "",
        hmacUsed: JSON.parse(Buffer.from(encoded, "base64url").toString("utf-8")).h ?? "",
        ipAddress,
        userAgent,
        status: "SUCCESS",
      },
    })

    return NextResponse.json({
      valid: true,
      student: {
        id: student.id,
        fullName: student.user.fullName,
        avatar: student.user.avatar,
        groupName: student.group?.name ?? null,
      },
    })
  } catch (error) {
    console.error("[GET /api/teacher/scan/verify]", error)
    return NextResponse.json(
      { valid: false, error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}
