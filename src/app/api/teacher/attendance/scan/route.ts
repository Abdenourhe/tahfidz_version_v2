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

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Vérifier si l'élève est déjà marqué présent aujourd'hui
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId: student.id,
        date: today,
        status: "PRESENT",
      },
    })

    if (existingAttendance) {
      return NextResponse.json(
        {
          success: false,
          code: "ALREADY_PRESENT",
          error: `${student.user.fullName} est déjà marqué présent aujourd'hui`,
          studentId: student.id,
          studentName: student.user.fullName,
        },
        { status: 409 }
      )
    }

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

    // Créer ou remplacer la présence du jour (action réversible/modifiable)
    // Détermine le groupe cible (QR scanné pour le groupe principal ou un groupe passé explicitement)
    const studentGroups = await prisma.studentGroup.findMany({
      where: { studentId: student.id },
      select: { groupId: true },
      take: 1,
    })
    const scanGroupId = studentGroups[0]?.groupId ?? student.groupId ?? null

    const attendance = await prisma.attendance.upsert({
      where: { studentId_groupId_date: { studentId: student.id, groupId: scanGroupId, date: today } },
      update: {
        status: "PRESENT",
        method: "QR_SCAN",
        recordedBy: session.user.id,
        checkInTime: new Date(),
        qrScanLogId: qrScanLog.id,
      },
      create: {
        studentId: student.id,
        groupId: scanGroupId,
        date: today,
        status: "PRESENT",
        method: "QR_SCAN",
        recordedBy: session.user.id,
        checkInTime: new Date(),
        qrScanLogId: qrScanLog.id,
      },
    })

    // Synchroniser avec le carnet de suivi quotidien (page /teacher/students)
    await prisma.dailyProgressLog.upsert({
      where: { studentId_date: { studentId: student.id, date: today } },
      update: { attendanceStatus: "PRESENT" },
      create: {
        studentId: student.id,
        date: today,
        createdById: session.user.id,
        attendanceStatus: "PRESENT",
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
      studentId: student.id,
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
