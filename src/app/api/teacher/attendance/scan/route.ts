import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { decodeAnyQrValue } from "@/lib/qr-code"
import { checkQrScanRateLimit } from "@/lib/rate-limit"
import { verifyQrPayload } from "@/lib/qr-scan-verifier"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user || !["ADMIN", "TEACHER", "SUPERADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { payload?: string }
    const { payload: encoded } = body

    if (!encoded) {
      return NextResponse.json({ error: "QR code manquant" }, { status: 400 })
    }

    const result = await verifyQrPayload(encoded, session.user.id, session.user.role)
    const decodedPayload = decodeAnyQrValue(encoded)

    const ipAddress = req.headers.get("x-forwarded-for") ?? undefined
    const userAgent = req.headers.get("user-agent") ?? undefined

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.reason, code: result.status },
        { status: 400 }
      )
    }

    const student = result.student

    // Rate limiting par élève
    const rateLimit = checkQrScanRateLimit(student.id)
    if (!rateLimit.success) {
      await prisma.qrScanLog.create({
        data: {
          studentId: student.id,
          teacherId: session.user.role === "TEACHER" ? session.user.id : null,
          schoolId: session.user.schoolId ?? student.user.schoolId,
          tokenUsed: student.qrCodeToken ?? "",
          hmacUsed: decodedPayload?.h ?? "",
          ipAddress,
          userAgent,
          status: "RATE_LIMITED",
          errorReason: "Trop de scans pour cet élève",
        },
      })
      return NextResponse.json(
        { success: false, error: "Trop de scans pour cet élève. Réessayez plus tard." },
        { status: 429 }
      )
    }

    // Vérifier si une présence existe déjà pour aujourd'hui
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingAttendance = await prisma.attendance.findUnique({
      where: { studentId_date: { studentId: student.id, date: today } },
    })

    if (existingAttendance) {
      await prisma.qrScanLog.create({
        data: {
          studentId: student.id,
          teacherId: session.user.role === "TEACHER" ? session.user.id : null,
          schoolId: session.user.schoolId ?? student.user.schoolId,
          tokenUsed: student.qrCodeToken ?? "",
          hmacUsed: decodedPayload?.h ?? "",
          ipAddress,
          userAgent,
          status: "ALREADY_PRESENT",
          errorReason: "Présence déjà enregistrée aujourd'hui",
        },
      })
      return NextResponse.json(
        { success: false, error: "Présence déjà enregistrée pour cet élève aujourd'hui" },
        { status: 409 }
      )
    }

    // Créer le log de scan
    const qrScanLog = await prisma.qrScanLog.create({
      data: {
        studentId: student.id,
        teacherId: session.user.role === "TEACHER" ? session.user.id : null,
        schoolId: session.user.schoolId ?? student.user.schoolId,
        tokenUsed: student.qrCodeToken ?? "",
        hmacUsed: decodedPayload?.h ?? "",
        ipAddress,
        userAgent,
        status: "SUCCESS",
      },
    })

    // Créer la présence
    const attendance = await prisma.attendance.create({
      data: {
        studentId: student.id,
        groupId: student.groupId,
        date: today,
        status: "PRESENT",
        method: "QR_SCAN",
        recordedBy: session.user.id,
        checkInTime: new Date(),
        qrScanLogId: qrScanLog.id,
      },
    })

    // Mettre à jour la dernière activité de l'élève
    await prisma.student.update({
      where: { id: student.id },
      data: { lastActivityDate: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: `Présence de ${student.user.fullName} validée`,
      attendanceId: attendance.id,
      studentName: student.user.fullName,
    })
  } catch (error) {
    console.error("[POST /api/teacher/attendance/scan]", error)
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'enregistrement de la présence" },
      { status: 500 }
    )
  }
}
